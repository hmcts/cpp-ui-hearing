import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { filter, omit, padStart } from 'lodash-es';
import { Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { omitUndefined, JurisdictionType } from '../../../core';
import {
  DraftResultPrompt,
  ParsedResult,
  PromptChoice,
  RemoteParsedResult,
  RemoteResolvedPart,
  RemoteUnresolvedPart,
  RemoteUnresolvedPartForValue,
  ResolvedDraftResultLine,
  ResolvedParsedResult,
  ResultPromptType,
  SharedResultLine,
  UnresolvedPromptPart
} from '../../results.interfaces';
import { createDraftResultPrompt, isValidValueForDraftResultPrompt } from '../helpers';
import { patchLegacyParsedResultDefinition } from '../patch';

interface ParseTextOptions {
  orderedDate: string;
  originalText: string;
}

interface ResolvedPartCandidate {
  promptRef: string;
  partIndex: number;
  resultPrompt: DraftResultPrompt;
}

interface ParseChildOptions {
  orderedDate: string;
  shortCode: string;
}

type ParseOptions = ParseTextOptions | ParseChildOptions;

@Injectable({ providedIn: 'root' })
export class NotepadParserService {
  private parsedResultDefinitionCache: Record<string, Observable<ParsedResult>> = {};

  constructor(private cppHttp: CppHttp) {}

  /**
   * Fetch the parsed result belonging to either original text, or a
   * known result definition shortcode. Remotely, the hearing context will
   * resolve the provided options into a result definition (or not, where no
   * match is found), which can be used to constuct a result line.
   *
   * @param options the options for parsing text or a known shortcode
   * @returns an observable that emits the parsed result
   */
  fetchParsedResultDefinition(
    options: ParseChildOptions | ResolvedDraftResultLine | SharedResultLine,
    hearingJurisdiction?: JurisdictionType
  ): Observable<ResolvedParsedResult>;
  fetchParsedResultDefinition(
    options: ParseOptions,
    hearingJurisdiction?: JurisdictionType
  ): Observable<ParsedResult>;
  fetchParsedResultDefinition(
    { orderedDate, ...options }: ParseOptions | ResolvedDraftResultLine,
    hearingJurisdiction?: JurisdictionType
  ): Observable<ParsedResult> {
    const originalText = 'shortCode' in options ? options.shortCode : options.originalText;
    const cacheKey = [originalText.toLowerCase(), orderedDate].join(' ');

    const initialParams = { orderedDate, originalText };
    const params = hearingJurisdiction ? { ...initialParams, hearingJurisdiction } : initialParams;

    if (!this.parsedResultDefinitionCache[cacheKey]) {
      this.parsedResultDefinitionCache = {
        ...this.parsedResultDefinitionCache,
        [cacheKey]: this.cppHttp
          .query<RemoteParsedResult>({
            url: '/referencedata-query-api/query/api/rest/referencedata/definition',
            requestType: 'application/vnd.referencedata.notepad.parse-result-definition+json',
            params: new HttpParams({
              fromObject: { ...params }
            })
          })
          .pipe(
            map(patchLegacyParsedResultDefinition),
            map(this.extendParsedResult),
            shareReplay(1),
            tap({
              error: () => {
                this.parsedResultDefinitionCache = omit(this.parsedResultDefinitionCache, cacheKey);
              }
            })
          )
      };
    }
    return this.parsedResultDefinitionCache[cacheKey];
  }

  /**
   * Transform the remote representation of the parsed result into the local
   * one. Namely, we remove the parts with a 'RESOLVED' state as they serve no
   * future purpose, and decorate any unresolved parts with result prompts where
   * we find a potential candidate for their parsed value among the the prompt
   * choices.
   *
   * @param parsedResult the parsed result obtained from the server
   * @returns the local parsed result extended with its resolved result prompts
   * and remaining unresolved parts
   */
  private extendParsedResult = (parsedResult: RemoteParsedResult): ParsedResult => {
    if ('resultDefinitionId' in parsedResult) {
      const { parts, ...other } = parsedResult;

      const filteredParts = this.filterUnresolvedParts<RemoteUnresolvedPartForValue>(parts);
      const resolvedResultPrompts: DraftResultPrompt[] = [];
      const unresolvedParts: UnresolvedPromptPart[] = [];
      const resolvedPartCandidates: ResolvedPartCandidate[] = [];

      // First pass: determine all the result prompts that can be resolved
      // against the prompt choices where the type of the part matches the type
      // of the prompt choice
      filteredParts.forEach((part, partIndex) => {
        // Consider each matching prompt choice to see if we can create a result
        // prompt using the type/value of the filtered part
        const matchedPromptChoices = other.promptChoices.filter(
          promptChoice => promptChoice.type === part.type
        );

        for (const promptChoice of matchedPromptChoices) {
          const resultPrompt = this.createResultPromptForParsedValue(promptChoice, part.value);
          // If the value was matched to this prompt choice, add it to the list
          // of resolved result prompts
          if (resultPrompt) {
            resolvedPartCandidates.push({
              partIndex,
              promptRef: promptChoice.promptRef,
              resultPrompt
            });
          }
        }
      });

      // Second pass: resolution critera:
      // - if the part has more than one matching prompt choice: UNRESOLVED
      // - if the part has exactly one matching prompt choice, but the prompt
      //   choice has more than one matching part: UNRESOLVED
      // - if the part has exactly one matching prompt choice and the prompt
      //   choice has only one matching part - RESOLVE
      const wildcardParts: RemoteUnresolvedPartForValue[] = [];

      filteredParts.forEach((part, partIndex) => {
        const matchesForPartIndex = filter(resolvedPartCandidates, { partIndex });

        if (matchesForPartIndex.length === 1) {
          // if a single match is found, we must now determine if it's the only
          // candidate in which this promptRef appears
          const { promptRef, resultPrompt } = matchesForPartIndex[0];
          const matchesForPromptRef = filter(resolvedPartCandidates, { promptRef });

          if (matchesForPromptRef.length === 1) {
            // Where a single match is found among the prompt choices and a result
            // prompt could be created for the parsed value, we identify this as a
            // resolved result prompt to be added to a result line. The part itself
            // is discarded as it's considered resolved.
            resolvedResultPrompts.push(resultPrompt);
            return;
          }
        }
        const resultPrompts = matchesForPartIndex.map(match => match.resultPrompt);

        if (resultPrompts.length === 0) {
          // if a part could not be used to create any result prompts, we can
          // now treat it as a wildcard, i.e. a part with a value that may
          // validate against a a prompt choice of a different type than its
          // part type. For example, if we entered "FO 20" and the "20" value
          // was not interpreted as "CURR" type but as "INT" type, we can now
          // evaluate it against all remaining prompt choices.
          wildcardParts.push(part);
        } else {
          // Where a single match cannot be found, add this part to the
          // unresolved parts, with a collection of result prompt candidates
          // attached to the prompt for future resolution by the user via the UI
          unresolvedParts.push(
            omitUndefined({
              type: part.type,
              value: part.value,
              originalText: part.originalText,
              resultPrompts: matchesForPartIndex.map(match => match.resultPrompt)
            })
          );
        }
      });

      if (wildcardParts.length > 0) {
        // any prompt choices that have result prompt matches already are
        // ignored, as wildcards have a lower priority.
        const restrictedPromptRefs = resolvedPartCandidates.map(({ promptRef }) => promptRef);
        const wildcardPromptChoices = parsedResult.promptChoices.filter(
          promptChoice => !restrictedPromptRefs.includes(promptChoice.promptRef)
        );
        const wildcardPartCandidates: ResolvedPartCandidate[] = [];

        // First pass: determine all the result prompts that can be resolved
        // against the prompt choices.
        wildcardParts.forEach((part, partIndex) => {
          for (const promptChoice of wildcardPromptChoices) {
            const resultPrompt = this.createResultPromptForParsedValue(promptChoice, part.value);
            // If the value was matched to this prompt choice, add it to the
            // list of resolved result prompts. We are ultimately trying to
            // determine if a prompt choice will match only one wildcard. If it
            // does, we can resolved it.
            if (resultPrompt) {
              wildcardPartCandidates.push({
                partIndex,
                promptRef: promptChoice.promptRef,
                resultPrompt
              });
            }
          }
        });

        wildcardParts.forEach((part, partIndex) => {
          const resultPrompts: DraftResultPrompt[] = [];
          const matchesForPartIndex = filter(wildcardPartCandidates, { partIndex });

          if (matchesForPartIndex.length === 1) {
            // if a single match is found, we must now determine if it's the only
            // candidate in which this promptRef appears
            const { promptRef, resultPrompt } = matchesForPartIndex[0];
            const matchesForPromptRef = filter(wildcardPartCandidates, { promptRef });

            if (matchesForPromptRef.length === 1) {
              resolvedResultPrompts.push(resultPrompt);
              return;
            } else {
              resultPrompts.push(resultPrompt);
            }
          }
          unresolvedParts.push(
            omitUndefined({
              type: part.type as ResultPromptType,
              value: part.value,
              originalText: part.originalText,
              resultPrompts
            })
          );
        });
      }
      return { ...other, unresolvedParts, resolvedResultPrompts };
    } else {
      const { parts, ...other } = parsedResult;
      // A parsed result with no resolved result definition, largely does not
      // differ from its remote representation
      return {
        ...other,
        unresolvedParts: this.filterUnresolvedParts(parts)
      };
    }
  };

  /**
   * Filters the parts from a parsed result to the unresolved parts only.
   *
   * @param parts the resolved and unresolved parts to be filtered
   * @returns the unresolved result parts minus any problematic values
   */
  private filterUnresolvedParts<T extends RemoteUnresolvedPart = RemoteUnresolvedPart>(
    parts: Array<RemoteResolvedPart | RemoteUnresolvedPart>
  ): T[] {
    return parts.filter((part): part is T => part.state === 'UNRESOLVED');
  }

  /**
   * Note: this should be handled by the backend?
   *
   * Parse a raw value against a prompt choice. The notepad support multiple
   * shorthand variants for providing values for result prompts. Where a value
   * cannot be parsed, we return undefined to inform consumers that the
   * shorthand could not be parsed into a safe value.
   *
   * @param promptChoice the prompt choice against which to evaluate the raw
   * value
   * @param value the raw value extracted from a parsed part
   * @returns the parsed value
   */
  private createResultPromptForParsedValue(
    promptChoice: PromptChoice,
    parsedValue: unknown
  ): DraftResultPrompt | undefined {
    let value: unknown;

    switch (promptChoice.type) {
      case 'BOOLEAN': {
        const booleanValue = String(parsedValue) === 'true' || String(parsedValue) === 'false';

        if (booleanValue) {
          value = String(parsedValue) === 'true';
        }
        break;
      }

      case 'DATE': {
        const DATE_SHORTHAND =
          /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-](\d{2}|\d{4})$/;

        if (DATE_SHORTHAND.test(String(parsedValue))) {
          const [day, month, year] = String(parsedValue).split(/[\/\-]/);
          const fullYear = year.length === 2 ? `20${year}` : year;

          value = `${fullYear}-${padStart(month, 2, '0')}-${padStart(day, 2, '0')}`;
        }
        break;
      }

      case 'FIXL': {
        value = promptChoice.fixedList.find(
          item => item.toLowerCase() === String(parsedValue).toLowerCase()
        );
        break;
      }

      case 'TXT': {
        const txtValue = String(parsedValue);
        const TXT_SHORTHAND = /^\[(.+)\]$/;

        value = TXT_SHORTHAND.test(txtValue) ? txtValue.replace(TXT_SHORTHAND, '$1') : txtValue;
        break;
      }

      case 'YESBOX': {
        const yesboxValue = String(parsedValue) === 'true' || String(parsedValue) === 'false';

        if (yesboxValue) {
          value = String(parsedValue) === 'true';
        }
        break;
      }

      default:
        value = parsedValue;
    }

    if (isValidValueForDraftResultPrompt(promptChoice, value)) {
      return createDraftResultPrompt(promptChoice, value);
    }
    return undefined;
  }
}
