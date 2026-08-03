import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import {
  ReferenceDataService,
  ReusableInfoDefinitions,
  ReusablePromptDefinition
} from '@cpp/reference-data';
import { flatten, groupBy, omit } from 'lodash-es';
import { forkJoin, Observable, of } from 'rxjs';
import { defaultIfEmpty, map, mapTo, shareReplay, switchMap, tap } from 'rxjs/operators';
import {
  CachedPromptValuesKeyedByShortcode,
  DraftResult,
  DraftResultPrompt,
  OffenceLike,
  PromptEntry,
  ResultEntry,
  ResultPromptType,
  ReusableInfo
} from '../../results.interfaces';
import {
  deserializeDraftResultPromptValue,
  getChildResults,
  isResolvedDraftResultLine,
  isResultLineForOffence,
  serializeDraftResultPromptValue
} from '../helpers';
import {
  Legacy,
  migrateLegacyReusableInfoRequest,
  migrateLegacyReusableInfoResponse
} from '../migrations';
import { patchResuableInfoDefinitions, patchReusableInfo } from '../patch';

export interface PromptLike {
  promptRef: string;
  type: string;
  masterDefendantId: string;
  offenceId?: string;
}

interface CachedPromptValueForOffenceOptions {
  hearingId: string;
  orderedDate: string;
  masterDefendantId: string;
  offenceId?: string;
  promptRef: string;
  type: ResultPromptType;
}

@Injectable({ providedIn: 'root' })
export class ReusableInfoRemoteCacheService {
  private reusableInfoCache: Record<string, Observable<ReusableInfo>> = {};

  constructor(private cppHttp: CppHttp, private referenceDataService: ReferenceDataService) {}

  /**
   *
   * @param draftResult
   * @returns an observable that emits upon caching the draft result
   */
  cacheReusableInfoFromDraftResult(draftResult: DraftResult): Observable<unknown> {
    const resolvedResultLines = Object.values(draftResult.resultLines)
      .filter(isResolvedDraftResultLine)
      .filter(isResultLineForOffence);
    const resultLinesByOrderedDate = groupBy(resolvedResultLines, 'orderedDate');

    // Prompt level caching

    const promptEntries$ = forkJoin(
      Object.keys(resultLinesByOrderedDate).map(orderedDate =>
        this.fetchWriteablePromptDefinitions(orderedDate).pipe(
          map(writablePromptDefinitions => {
            const promptEntries: PromptEntry[] = [];

            for (const resultLine of resultLinesByOrderedDate[orderedDate]) {
              const { resultPrompts = [] } = resultLine;
              const { masterDefendantId, offenceId } = resultLine as OffenceLike;

              for (const resultPrompt of resultPrompts) {
                const effectiveResultPrompt =
                  resultPrompt.type === 'ONEOF'
                    ? (resultPrompt.value as DraftResultPrompt)
                    : resultPrompt;

                const writablePromptDefinition = writablePromptDefinitions.find(
                  ({ promptRef, type }) =>
                    effectiveResultPrompt.promptRef === promptRef &&
                    effectiveResultPrompt.type === type
                );
                if (writablePromptDefinition) {
                  const { promptRef, type, value } = effectiveResultPrompt;

                  promptEntries.push({ masterDefendantId, offenceId, promptRef, type, value });
                }
              }
            }
            return promptEntries;
          })
        )
      )
    ).pipe(map(flatten), defaultIfEmpty([]));

    // Result level caching

    const resultEntries$ = forkJoin(
      Object.keys(resultLinesByOrderedDate).map(orderedDate =>
        this.fetchWriteableResultDefinitions(orderedDate).pipe(
          map(writeableResultDefinitions => {
            const resultEntries: ResultEntry[] = [];

            for (const resultLine of resultLinesByOrderedDate[orderedDate]) {
              const { masterDefendantId, offenceId } = resultLine as OffenceLike;

              if (writeableResultDefinitions.includes(resultLine.shortCode.toLowerCase())) {
                // construct reusableResults for parent + child
                const allResultLines = [
                  resultLine,
                  ...getChildResults(draftResult, resultLine.resultLineId).map(
                    result => result.resultLine
                  )
                ];

                const resultEntry: ResultEntry = {
                  shortCode: resultLine.shortCode,
                  offenceId,
                  masterDefendantId,
                  promptValues: {}
                };

                for (const rl of allResultLines) {
                  const { shortCode, resultPrompts = [] } = rl;
                  const childPromptEntries: PromptEntry[] = [];

                  for (const resultPrompt of resultPrompts) {
                    const { promptRef, type, value } = resultPrompt;

                    childPromptEntries.push({
                      masterDefendantId: (rl as OffenceLike).masterDefendantId,
                      offenceId: (rl as OffenceLike).offenceId,
                      promptRef,
                      type,
                      value
                    });
                  }
                  resultEntry.promptValues[shortCode] = childPromptEntries;
                }
                resultEntries.push(resultEntry);
              }
            }
            return resultEntries;
          })
        )
      )
    ).pipe(map(flatten), defaultIfEmpty([]));

    return forkJoin([promptEntries$, resultEntries$]).pipe(
      switchMap(([reusablePrompts, reusableResults]) => {
        if (reusablePrompts.length > 0 || reusableResults.length > 0) {
          return this.saveReusableInfo(draftResult.hearingId, { reusablePrompts, reusableResults });
        }
        return of(undefined);
      }),
      mapTo(undefined)
    );
  }

  /**
   * Fetch a value previously cached remotely for a target / prompt choice
   * combination.
   *
   * @param options the prompt choice and target criteria for matching a cached
   * value
   * @returns an observable that emits a matched value (or undefined)
   */
  fetchCachedPromptValue(
    options: CachedPromptValueForOffenceOptions
  ): Observable<PromptEntry | undefined> {
    return this.fetchReusableInfo(options.hearingId).pipe(
      map(({ reusablePrompts }) =>
        reusablePrompts.find(reusablePrompt => {
          if (
            reusablePrompt.promptRef === options.promptRef &&
            reusablePrompt.type === options.type
          ) {
            return reusablePrompt.offenceId
              ? reusablePrompt.offenceId === options.offenceId
              : reusablePrompt.masterDefendantId === options.masterDefendantId;
          }
          return false;
        })
      )
    );
  }

  fetchReusableInfo(hearingId: string): Observable<ReusableInfo> {
    if (!this.reusableInfoCache[hearingId]) {
      this.reusableInfoCache[hearingId] = this.cppHttp
        .query<Legacy.ReusableInfo>({
          url: `/hearing-query-api/query/api/rest/hearing/reusable-info/${hearingId}`,
          requestType: 'application/vnd.hearing.query.reusable-info+json'
        })
        .pipe(
          map(reusuableInfo => migrateLegacyReusableInfoResponse(reusuableInfo)),
          map(patchReusableInfo),
          map(({ reusablePrompts, ...other }) => ({
            ...other,
            reusablePrompts: reusablePrompts.map(({ value, ...reusablePrompt }) => ({
              ...reusablePrompt,
              value: deserializeDraftResultPromptValue(reusablePrompt.type, value as string)
            }))
          })),
          shareReplay(1),
          tap({
            error: () => {
              this.reusableInfoCache = omit(this.reusableInfoCache, hearingId);
            }
          })
        );
    }
    return this.reusableInfoCache[hearingId];
  }

  fetchResuableInfoDefinitions(orderedDate: string): Observable<ReusableInfoDefinitions> {
    return this.referenceDataService
      .fetchResuableInfoDefinitions(orderedDate, {
        background: true
      })
      .pipe(map(patchResuableInfoDefinitions));
  }

  /**
   * Fetch
   *
   * @param options the criteria
   * @returns an observable that emits a dictionary of cached prompt values
   * keyed by their shortcode
   */
  getValuesForHierarchy(options: {
    hearingId: string;
    shortCode: string;
    masterDefendantId: string;
    offenceId?: string;
  }): Observable<CachedPromptValuesKeyedByShortcode> {
    const { masterDefendantId, offenceId, shortCode } = options;

    return this.fetchReusableInfo(options.hearingId).pipe(
      map(({ reusableResults }) => {
        const cache = reusableResults.find(
          reusableResult =>
            reusableResult.shortCode === shortCode &&
            reusableResult.masterDefendantId === masterDefendantId &&
            (!reusableResult.offenceId || reusableResult.offenceId === offenceId)
        );

        return cache ? cache.promptValues : {};
      })
    );
  }

  private fetchWriteablePromptDefinitions(
    orderedDate: string
  ): Observable<ReusablePromptDefinition[]> {
    return this.fetchResuableInfoDefinitions(orderedDate).pipe(
      map(({ reusablePromptDefinitions }) =>
        reusablePromptDefinitions.filter(({ cacheable }) => cacheable === 1)
      )
    );
  }

  private fetchWriteableResultDefinitions(orderedDate: string): Observable<string[]> {
    return this.fetchResuableInfoDefinitions(orderedDate).pipe(
      map(({ reusableResultDefinitions }) =>
        reusableResultDefinitions.map(({ shortCode }) => shortCode.toLowerCase())
      )
    );
  }

  private saveReusableInfo(
    hearingId: string,
    { reusablePrompts, ...other }: ReusableInfo
  ): Observable<unknown> {
    return this.cppHttp
      .command({
        url: `/hearing-command-api/command/api/rest/hearing/reusable-info/${hearingId}`,
        requestType: 'application/vnd.hearing.reusable-info+json',
        body: migrateLegacyReusableInfoRequest({
          ...other,
          reusablePrompts: reusablePrompts.map(({ value, ...reusablePrompt }) => ({
            ...reusablePrompt,
            value: serializeDraftResultPromptValue(reusablePrompt.type, value)
          }))
        })
      })
      .pipe(
        tap(() => {
          delete this.reusableInfoCache[hearingId];
        })
      );
  }
}
