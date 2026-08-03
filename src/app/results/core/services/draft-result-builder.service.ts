import { Injectable } from '@angular/core';
import produce from 'immer';
import { find, isObjectLike, omit, sortBy, uniqBy } from 'lodash-es';
import { forkJoin, from, Observable, of } from 'rxjs';
import {
  defaultIfEmpty,
  filter,
  map,
  mergeMap,
  reduce,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { select, Store } from '@ngrx/store';
import {
  AppState,
  AmendmentReason,
  getCurrentHearing,
  omitUndefined,
  UserDetails
} from '../../../core';
import {
  AmendmentRecord,
  AmendmentsLog,
  AnyDraftResultLine,
  CachedPromptValue,
  CachedPromptValuesKeyedByShortcode,
  ChildResultDefinition,
  CopyDraftResultsTarget,
  DraftResult,
  DraftResultPrompt,
  DraftResultRelation,
  ExtendedResolvedDraftResultLine,
  InvalidResulLinesError,
  OffenceLike,
  ParseChildOptions,
  ParseTextOptions,
  ReplaceDraftResultLineOptions,
  ResolvedDraftResultLine,
  Result,
  TargetLike,
  UnresolvedDraftResultLine,
  UnresolvedPartChoice
} from '../../results.interfaces';
import {
  createDraftResultPromptsFromValueMap,
  filterResults,
  getActiveResultLines,
  getChildResultDefinitionsForRuleType,
  getChildResults,
  getDuplicateResultLineAlreadyInRelation,
  getForeignKeysForTarget,
  getHierarchyForResultLine,
  getNonRelatedParentResultLineById,
  getParentResultById,
  getRelationById,
  getResolvedResults,
  getResultById,
  getResultLineById,
  getResultLineIsUniqueRelation,
  getResults,
  getResultsGroupedWith,
  getSharedTargetIds,
  getTargetId,
  hasPendingAmendments,
  isActiveDraftResultLine,
  isConditionalMandatoryDraftResultLine,
  isEmptyValue,
  isExtendedResolvedDraftResultLine,
  isResolvedDraftResultLine,
  isResultLineSemanticallyEqual,
  isSharedResultLine,
  validateDraftResultPrompts
} from '../helpers';
import { NotepadParserService } from './notepad-parser.service';
import { ReusableInfoService } from './reusable-info.service';
import { FullNamePipe } from '../../../../app/shared';

type ParseChildResultLineOptions = TargetLike<{
  belongsToResultLineId: string;
  orderedDate: string;
  shortCode: string;
}>;

type CreateDraftResultLineOptions = TargetLike<{
  hearingId: string;
  orderedDate: string;
  originalText: string;
  amendmentReason?: AmendmentReason;
  amendmentDate?: string;
  userDetails?: UserDetails;
  cache?: CachedPromptValue[];
}>;

interface CreateChildDraftResultLineOptions
  extends Omit<CreateDraftResultLineOptions, 'originalText'> {
  shortCode: string;
}

@Injectable({ providedIn: 'root' })
export class DraftResultBuilderService {
  // We store the collection of results not added to draft result due to being semantically equal.
  private resultLineIdsNotAdded: string[] = [];

  constructor(
    private draftResultCacheService: ReusableInfoService,
    private notepadParserService: NotepadParserService,
    private fullNamePipe: FullNamePipe,
    private store: Store<AppState>
  ) {}

  /**
   * Add a child result definition to a draft result. This method handles the
   * user choosing a `oneOf` or `atleastOneOf` choice in the UI, and creates a
   * result line with an explicit relationship between this child result line
   * and its specified parent.
   *
   * @param draftResult the draft result to be updated
   * @param childOptions the options to determine the nature of the relationship
   * between a result line and the desired child
   * @returns an observable that emits the updated draft result
   */
  addChildResultDefinition(
    draftResult: DraftResult,
    userDetails: UserDetails,
    childOptions: ParseChildOptions
  ): Observable<DraftResult> {
    const belongsToResultLine = getResultLineById(draftResult, childOptions.belongsToResultLineId);

    return this.extendWithParsedResultLines(draftResult, userDetails, [
      { ...childOptions, ...getForeignKeysForTarget(belongsToResultLine) }
    ]);
  }

  /**
   * Copy one or more result lines from a target to one or more targets.
   *
   * @param draftResult the draft result to be updated
   * @param copyTargets a collection of source/destination options for copying
   * @returns an observable that emits the updated draft result
   */
  copyResultLines(
    draftResult: DraftResult,
    userDetails: UserDetails,
    copyTargets: CopyDraftResultsTarget[]
  ): Observable<DraftResult> {
    const invalidResultLines: ResolvedDraftResultLine[] = [];
    const copyResultLine = (
      originalDraftResult: DraftResult,
      options: CopyDraftResultsTarget & { belongsToResultLineId?: string }
    ): DraftResult => {
      const { belongsToResultLineId, originalResultLineId, ...foreignKeysForCopyTarget } = options;
      const { resultLine, relation } = getResultById(originalDraftResult, originalResultLineId);
      const { ruleType, childResultLineIds } = relation;
      // Create a new result line id for our copied target
      const resultLineId = uuid();
      const updatedDraftResult = produce(originalDraftResult, nextDraftResult => {
        // When copying a result, the foreign keys for the target may change
        // shape – i.e. we may be copying from an application to an offence (and
        // vice versa) so we must strip any existing ones
        let copiedResultLine = this.replaceForeignKeysForTarget(
          {
            // the creation of a copied result line should not inherit any
            // shared date that's unique to the original result line.
            ...omit(resultLine, 'sharedDate'),
            resultLineId
          } as ResolvedDraftResultLine,
          foreignKeysForCopyTarget
        );

        if (
          ruleType === 'standalone' &&
          this.isDuplicatedStandaloneResult(nextDraftResult, copiedResultLine)
        ) {
          invalidResultLines.push(copiedResultLine);
          return;
        }

        if (belongsToResultLineId && isExtendedResolvedDraftResultLine(copiedResultLine)) {
          if (
            !getResultLineIsUniqueRelation(nextDraftResult, copiedResultLine, belongsToResultLineId)
          ) {
            return;
          }
        }
        // if the target of the copied resultLine has not yet been shared, it
        // does not require an amendment reason or amendment date
        if (!getSharedTargetIds(draftResult).includes(getTargetId(copiedResultLine))) {
          copiedResultLine = omit(copiedResultLine, [
            'amendmentDate',
            'amendmentReasonId',
            'amendmentReason'
          ]) as ResolvedDraftResultLine;
        }

        nextDraftResult.resultLines[resultLineId] = copiedResultLine;
        nextDraftResult.relations.push({
          resultLineId,
          ruleType,
          childResultLineIds: []
        });

        if (belongsToResultLineId) {
          getRelationById(nextDraftResult, belongsToResultLineId).childResultLineIds.push(
            resultLineId
          );
        }
      });

      return childResultLineIds.reduce(
        (reducedDraftResult, childResultLineId) =>
          copyResultLine(reducedDraftResult, {
            belongsToResultLineId: resultLineId,
            originalResultLineId: childResultLineId,
            ...foreignKeysForCopyTarget
          }),
        updatedDraftResult
      );
    };

    const parsedDraftResult = copyTargets.reduce(copyResultLine, draftResult);

    if (invalidResultLines.length) {
      throw new InvalidResulLinesError(invalidResultLines);
    }

    return of(this.extendWithInferredRelations(parsedDraftResult, userDetails));
  }

  /**
   * Remove an unresolved part (i.e. a fragment of the original parsed text that
   * could not be resolved as either a result or a prompt value) from a result
   * line. Where this is the sole remaining part on an unresolved result line,
   * then the result line itself will also be removed, as it would have no means
   * to ever be resolved. This action is triggered by the user opting to delete
   * a part from a result line in the UI.
   *
   * As a side effect of detroying a part, it is also removed from the
   * `originalText` of the result line.
   *
   * @param draftResult the draft result to be updated
   * @param destroyPartOptions the identity of the result line and the part to
   * be destroyed
   * @returns an observable that emits the updated draft result
   */
  destroyPart(
    draftResult: DraftResult,
    userDetails: UserDetails,
    { resultLineId, partIndex }: { resultLineId: string; partIndex: number }
  ): Observable<DraftResult> {
    const resultLine = getResultLineById(draftResult, resultLineId);

    if (isResolvedDraftResultLine(resultLine) || resultLine.unresolvedParts.length > 1) {
      return of(
        produce(draftResult, nextDraftResult => {
          const draftResultLine = getResultLineById(nextDraftResult, resultLineId);

          draftResultLine.unresolvedParts.splice(partIndex, 1);
          draftResultLine.originalText = draftResultLine.originalText.replace(
            resultLine.unresolvedParts[0]
              ? `${resultLine.unresolvedParts[0].value}`
              : draftResultLine.originalText,
            ''
          );
        })
      );
    }
    return this.destroyResultLine(draftResult, userDetails, resultLineId);
  }

  /**
   * Remove a result line from a draft result. If this result line is the parent
   * of one or more child result lines, they will also be removed by this
   * action. If this result line is a child of another, then when removing it,
   * this action will attempt to replace this child relationship with any
   * 'standalone' result lines on the draft result that satisfy the outgoing
   * rule type.
   *
   * Internally, depending on whether an amendment exists on the result line,
   * this may be a non-destructive action, and the result line will be flagged
   * as deleted rather than being destroyed entirely so that this modification
   * can be shared. For the purpose of building relations or querying the draft
   * result, both forms of deletion behave the same way.
   *
   * @param draftResult the draft result to be updated
   * @param resultLineId the result line id to be removed
   * @returns an observable that emits the updated draft result
   */
  destroyResultLine(
    draftResult: DraftResult,
    userDetails: UserDetails,
    resultLineId: string
  ): Observable<DraftResult> {
    const resultLine = getResultLineById(draftResult, resultLineId);
    let updatedDraftResult = this.omitResultLine(draftResult, userDetails, resultLineId);

    if ((resultLine as ExtendedResolvedDraftResultLine).autoPopulateBooleanResult) {
      updatedDraftResult = this.resetConditionalMandatoryResults(
        updatedDraftResult,
        resultLine as ExtendedResolvedDraftResultLine,
        userDetails
      );
    }
    return this.evaluateRelations(updatedDraftResult, userDetails);
  }

  /**
   * Parses the lines of text collected by the parser(s) in the UI.
   *
   * @param draftResult the draft result to be updated
   * @param unparsedItems a collection of options for parsing text
   * @returns an observable that emits the updated draft result
   */
  parseResultDefinitions(
    draftResult: DraftResult,
    userDetails: UserDetails,
    unparsedItems: ParseTextOptions[]
  ): Observable<DraftResult> {
    return this.extendWithParsedResultLines(draftResult, userDetails, unparsedItems).pipe(
      switchMap(updatedDraftresult =>
        this.evaluateConditionalMandatoryResults(updatedDraftresult, userDetails)
      )
    );
  }

  /**
   * Replace a result line within a draft result with the result of the parsed
   * text. This will typically be used when resolving a result choice (from an
   * item in the `unresolvedParts`), or when the user changes the original text
   * of a resolved result line through the UI.
   *
   * @param draftResult the draft result to be updated
   * @param replaceOptions details of the result line to replace and the options
   * for parsing its replacement
   * @returns an observable that emits the updated draft result
   */
  replaceResultLine(
    draftResult: DraftResult,
    userDetails: UserDetails,
    { resultLineId, ...options }: ReplaceDraftResultLineOptions
  ): Observable<DraftResult> {
    const resultLine = getResultLineById(draftResult, resultLineId);
    const nextDraftResult = this.omitResultLine(draftResult, userDetails, resultLineId);

    return this.extendWithParsedResultLines(nextDraftResult, userDetails, [
      {
        ...options,
        ...getForeignKeysForTarget(resultLine),
        amendmentDate: resultLine.amendmentDate,
        amendmentReason: resultLine.amendmentReason
      }
    ]);
  }

  /**
   * Resolve an unresolved part (i.e. a fragment of the original parsed text
   * that could not be resolved as either a result or a prompt value) from a
   * result line:
   *
   * - Where the result line is unresolved, and a choice is selected by the user
   *   via the UI, this action will destroy the existing result line and replace
   *   it with the resolved result line created by the chosen shortCode.
   *
   * - When the result line is resolved, this action will assign the value of
   *   the part to a prompt choice (i.e. create or replace a result prompt using
   *   the provided choice).
   *
   * @param draftResult the draft result to be updated
   * @param resolveOptions the identity of the result line, part and the
   * `resultChoice` found on the unresolved part
   * @returns an observable that emits the updated draft result
   */
  resolvePart(
    draftResult: DraftResult,
    userDetails: UserDetails,
    resolveOptions: { resultLineId: string; partIndex: number; choice: UnresolvedPartChoice }
  ): Observable<DraftResult> {
    const { resultLineId, choice, partIndex } = resolveOptions;
    const resultLine = getResultLineById(draftResult, resultLineId);

    // Resolve a result-based part. This will completely replace the result line
    // with the chosen result. We also forward the values from any other
    // unresolved parts as they may serve as parameters for the chosen result
    // definition
    if ('shortCode' in choice) {
      return this.replaceResultLine(draftResult, userDetails, {
        resultLineId,
        orderedDate: resultLine.orderedDate,
        originalText: [
          choice.shortCode,
          ...(resultLine as UnresolvedDraftResultLine).unresolvedParts
            .filter((_, idx) => partIndex !== idx)
            .map(part =>
              'originalText' in part && part.originalText ? part.originalText : part.value
            )
        ].join(' ')
      });
    }

    // Resolve a prompt-based part. This will consume a part by setting a
    // suggested result prompt on the result line.
    if (isExtendedResolvedDraftResultLine(resultLine)) {
      return this.updateResultPrompts(
        produce(draftResult, nextDraftResult => {
          getResultLineById(nextDraftResult, resultLineId).unresolvedParts.splice(partIndex, 1);
        }),
        {
          resultLineId,
          resultPrompts: [
            ...resultLine.resultPrompts.filter(({ promptId }) => promptId !== choice.promptId),
            choice
          ]
        }
      );
    }
    return of(draftResult);
  }

  /**
   * Set the amendment reason for a result line hierarchy. Before a result line
   * can be updated or deleted after being shared, then it must be attributed an
   * amendment reason. This amendment reason is also be applied to all other
   * result lines in the hierarchy, so can be set from any result line that
   * exists in this hierarchy.
   *
   * Note that, as an amendment reason is applied throughout the amended result
   * line's parent/child hierarchy, and so the amendment reason for all result
   * lines in this hierarchy reflects the most recent amendment. There is no
   * business use case for different result lines in the same hierarchy having
   * different amendment reasons.
   *
   * @param draftResult the draft result to be updated
   * @param options the amendment reason and result line it applies to
   * @returns the updated draft result
   */
  setAmendmentReason(
    draftResult: DraftResult,
    options: {
      resultLineId: string;
      amendmentReason: AmendmentReason;
      amendmentDate: string;
      userDetails: UserDetails;
    }
  ): DraftResult {
    return produce(draftResult, nextDraftResult => {
      const results = getHierarchyForResultLine(nextDraftResult, options.resultLineId);

      for (const result of results) {
        if (result) {
          const { resultLine } = result;
          resultLine.amendmentReason = options.amendmentReason;
          resultLine.amendmentDate = options.amendmentDate;
          const { amendmentsLog } = resultLine;

          if (
            !amendmentsLog ||
            (amendmentsLog && amendmentsLog.amendmentsRecord.every(r => r.validatedBy))
          ) {
            const amendmentsRecord: AmendmentRecord = {
              resultPromptsRecord: resultLine.resultPrompts,
              amendmentReason: options.amendmentReason,
              amendmentDate: options.amendmentDate,
              amendedBy: this.fullNamePipe.transform(options.userDetails)
            };
            resultLine.amendmentsLog = {
              isAmended: true,
              isCurrentlyAdded: !resultLine.sharedDate,
              resultWithoutPrompts: resultLine.resultPrompts.length === 0,
              amendmentsRecord: []
                .concat(amendmentsRecord)
                .concat(
                  (resultLine.amendmentsLog && resultLine.amendmentsLog.amendmentsRecord) || []
                )
            };
          }
        }
      }
    });
  }

  setAmendmentLogForNewResultLine(
    amendmentReason: AmendmentReason,
    amendmentDate: string,
    userDetails: UserDetails,
    resultPrompts: DraftResultPrompt<unknown>[]
  ): AmendmentsLog | undefined {
    if (!!amendmentReason && !!amendmentDate) {
      const amendmentsRecord: AmendmentRecord = {
        resultPromptsRecord: resultPrompts,
        amendmentReason: amendmentReason,
        amendmentDate: amendmentDate,
        amendedBy: this.fullNamePipe.transform(userDetails)
      };
      return {
        isAmended: true,
        isCurrentlyAdded: true,
        resultWithoutPrompts: resultPrompts.length === 0,
        amendmentsRecord: [amendmentsRecord]
      } as AmendmentsLog;
    }
    return undefined;
  }

  setValidationDetails(draftResult: DraftResult, userDetails: UserDetails): DraftResult {
    const validationDate = new Date().toISOString();
    const createValidatedAmendmentLogs = (
      amendmentsRecord: AmendmentRecord[],
      resultPrompts: DraftResultPrompt<unknown>[],
      isCurrentlyAddedResultWithoutPrompts: boolean,
      deleted: boolean
    ): AmendmentRecord[] => {
      return (amendmentsRecord || [])
        .map(amendmentRecord => {
          if (!!amendmentRecord.validatedBy) {
            return amendmentRecord;
          }
          if (isCurrentlyAddedResultWithoutPrompts) {
            return {
              ...amendmentRecord,
              validatedBy: this.fullNamePipe.transform(userDetails),
              validationDate
            };
          }

          const amendedPrompts = amendmentRecord.resultPromptsRecord.filter(
            previousPrompt =>
              !resultPrompts.some(
                currentPrompt => JSON.stringify(currentPrompt) === JSON.stringify(previousPrompt)
              )
          );

          const idSet = new Set(
            amendmentRecord.resultPromptsRecord.map(prompt => prompt.promptRef)
          );
          const optionalPromptsAdded = resultPrompts.filter(prompt => !idSet.has(prompt.promptRef));
          const resultPromptsRecord = amendedPrompts.concat(optionalPromptsAdded) || [];

          return resultPromptsRecord.length > 0 || deleted
            ? {
                ...amendmentRecord,
                resultPromptsRecord,
                validatedBy: this.fullNamePipe.transform(userDetails),
                validationDate
              }
            : null;
        })
        .filter(amendmentLog => amendmentLog !== null);
    };
    return produce(draftResult, nextDraftResult => {
      const results = getResolvedResults(nextDraftResult);
      for (const { resultLine } of results) {
        const { amendmentsLog, deleted = false, resultPrompts = [] } = resultLine;
        const isCurrentlyAddedWithoutPrompts =
          !!amendmentsLog &&
          !!amendmentsLog.isCurrentlyAdded &&
          !!amendmentsLog.resultWithoutPrompts;

        resultLine.amendmentsLog =
          !!amendmentsLog && amendmentsLog.isAmended
            ? {
                isAmended: true,
                amendmentsRecord: createValidatedAmendmentLogs(
                  amendmentsLog.amendmentsRecord,
                  resultPrompts,
                  isCurrentlyAddedWithoutPrompts,
                  deleted
                )
              }
            : undefined;
      }
    });
  }

  /**
   * Toggle the delegated powers status of the draft result.
   *
   * @param draftResult the draft result to be updated
   * @param enabled the toggled status of the delegated powers
   * @returns the updated draft result
   */
  setDelegatedPowers(
    draftResult: DraftResult,
    options: {
      delegatedPowers: boolean;
      userDetails: UserDetails;
      amendmentReason?: AmendmentReason;
      amendmentDate?: string;
    }
  ): DraftResult {
    const { delegatedPowers, amendmentReason, amendmentDate, userDetails } = options;

    if (amendmentReason && amendmentDate) {
      const results = filterResults(
        draftResult,
        ({ relation }) => relation.ruleType === 'standalone'
      );
      // When setting delegated powers requires an amendment reason, this
      // amendment must be applied to all result lines on the draft result
      results.forEach(result => {
        draftResult = this.setAmendmentReason(draftResult, {
          amendmentDate,
          amendmentReason,
          resultLineId: result.resultLine.resultLineId,
          userDetails
        });
      });
    }

    return produce(draftResult, nextDraftResult => {
      nextDraftResult.delegatedPowers = delegatedPowers;
    });
  }

  /**
   * Sets the shadow listed offence ids. These offences will not appear publicly
   * within listing for the next hearing once the draft result is shared.
   *
   * @param draftResult the draft result to be updated
   * @param offenceIds the list of offence ids to be shadow listed
   * @returns the updated draft result
   */
  setShadowListedOffenceIds(draftResult: DraftResult, offenceIds: string[]): DraftResult {
    return produce(draftResult, nextDraftResult => {
      nextDraftResult.shadowListedOffenceIds = offenceIds;
    });
  }

  /**
   * Toggles the "conditional" mandatory child result definition of a result
   * line. This type of child definition is toggled via a boolean control in the
   * UI. Depending on the `selected` state chosen, this will either add or
   * remove the child result line from the draft result entirely.
   *
   * @param draftResult the draft result to be updated
   * @param options the id of the result line governing the conditional
   * mandatory child result definitions, and the child's selected status.
   * @returns an observable that emits the updated draft result
   */
  toggleConditionalMandatoryChild(
    draftResult: DraftResult,
    userDetails: UserDetails,
    { resultLineId, selected }: { resultLineId: string; selected: boolean }
  ): Observable<DraftResult> {
    const resultLine = draftResult.resultLines[resultLineId];

    if (isConditionalMandatoryDraftResultLine(resultLine)) {
      // childResults can be 2 for YES and NO options which will have their own child prompts
      // or can only be 1 which means Child for YES but no child for NO
      // 1: if Yes option selected it will be firstChild in childResults
      // 2: if No selected and it has child then selected one will be secondChild in childResults
      // 3: if No selected & there has no childResults (No secondChild inside childResults)
      const childResults = resultLine.childResultDefinitions;
      // determining both children by checking presence of key childOfTrueResponse
      // as BE returns childOfTrueResponse: false
      const childResultForYes = childResults.find(child => child.childOfTrueResponse !== false);

      const childResultForNo = childResults.find(child => child.childOfTrueResponse === false);

      const hasBothConditionalChildren = Boolean(childResultForNo && childResultForYes);
      const shortCode = hasBothConditionalChildren
        ? selected
          ? childResultForYes?.shortCode
          : childResultForNo?.shortCode
        : childResultForYes?.shortCode || childResultForNo?.shortCode;

      // Selecting a conditional mandatory child is the equivalent of adding a
      // known child result definition
      if ((selected && childResultForYes) || (!selected && childResultForNo)) {
        const shortCodeToMatch = hasBothConditionalChildren
          ? selected
            ? childResultForNo?.shortCode
            : childResultForYes?.shortCode
          : childResultForYes?.shortCode || childResultForNo?.shortCode;

        const childResult = getChildResults(draftResult, resultLine.resultLineId)
          .filter(r => !r.resultLine.deleted)
          .find(r => r.resultLine.shortCode === shortCodeToMatch);

        // When the result line already exists from a prior selection, then we
        // destroy it
        if (childResult) {
          return this.destroyResultLine(
            draftResult,
            userDetails,
            childResult.resultLine.resultLineId
          ).pipe(
            switchMap(nextDraftResult => {
              return this.addChildResultDefinition(nextDraftResult, userDetails, {
                belongsToResultLineId: resultLineId,
                orderedDate: resultLine.orderedDate,
                shortCode
              });
            })
          );
        }

        return this.addChildResultDefinition(draftResult, userDetails, {
          belongsToResultLineId: resultLineId,
          orderedDate: resultLine.orderedDate,
          shortCode
        });
      } else {
        const childResult = getChildResults(draftResult, resultLine.resultLineId)
          .filter(r => !r.resultLine.deleted)
          .find(r => r.resultLine.shortCode === shortCode);

        // When the result line already exists from a prior selection, then we
        // destroy it
        if (childResult) {
          return this.destroyResultLine(
            draftResult,
            userDetails,
            childResult.resultLine.resultLineId
          );
        }
        // When the initial selection of the user is 'No' then capture that a
        // decision has been made and update the result line to valid. Note that
        // when the `selected` status is true, this valid status is set
        // internally when adding the child result line to the draft result.
        return of(
          produce(draftResult, ({ resultLines }) => {
            resultLines[resultLineId] = { ...resultLine, valid: true };
          })
        );
      }
    }
    return of(draftResult);
  }

  /**
   * Sets/replaces the result prompts for a result line. This method is used for
   * updating the draft result when valid details have been entered by the user
   * via the `promptChoices` of a result line.
   *
   * @param draftResult the draft result to be updated
   * @param options the result prompts and corresponding resultLineId to update
   * @returns an observable that emits the updated draft result
   */
  updateResultPrompts(
    draftResult: DraftResult,
    { resultLineId, resultPrompts }: { resultLineId: string; resultPrompts: DraftResultPrompt[] }
  ): Observable<DraftResult> {
    const resultLine = getResultLineById(draftResult, resultLineId);

    if (isExtendedResolvedDraftResultLine(resultLine)) {
      return of(
        produce(draftResult, ({ resultLines }) => {
          resultLines[resultLine.resultLineId] = {
            ...resultLine,
            // sort the result prompts according to the prompt order found on the prompt choice
            resultPrompts: sortBy(
              resultPrompts,
              ({ promptRef }) => find(resultLine.promptChoices, { promptRef }).promptOrder
            ),
            // Note that result prompts provided to this method should be complete,
            // and hence it can concluded that the result line is now always valid.
            // However, to insure against this method potentially being used to
            // patch result prompts at some future point, we explicitly validate.
            valid: validateDraftResultPrompts(resultLine.promptChoices, resultPrompts)
          };
        })
      );
    }
    return of(draftResult);
  }

  /**
   * Create a draft result line by parsing either a child result definition
   * shortcode or original text entered by the user into a parser. Where a
   * resolved parsed result is found (i.e. a result definition could be
   * identified), the result line will try to assign result prompts based on any
   * existing cache available to it.
   *
   * @param options the options for parsing a (child) draft result line
   * @returns An observable that emits the draft result line
   */
  private createDraftResultLine(
    options: CreateChildDraftResultLineOptions
  ): Observable<ExtendedResolvedDraftResultLine>;
  private createDraftResultLine(
    options: CreateChildDraftResultLineOptions | CreateDraftResultLineOptions
  ): Observable<UnresolvedDraftResultLine | ExtendedResolvedDraftResultLine>;
  private createDraftResultLine({
    amendmentDate,
    amendmentReason,
    userDetails,
    ...options
  }: CreateChildDraftResultLineOptions | CreateDraftResultLineOptions): Observable<unknown> {
    return of(true).pipe(
      withLatestFrom(this.store.pipe(select(getCurrentHearing))),
      switchMap(([_, hearing]) =>
        this.notepadParserService
          .fetchParsedResultDefinition(options, hearing.jurisdictionType)
          .pipe(
            switchMap(parsedResult => {
              const { orderedDate, originalText, unresolvedParts } = parsedResult;
              const unresolvedResultLine = omitUndefined({
                amendmentDate: amendmentDate || undefined,
                amendmentReason: amendmentReason || undefined,
                resultLineId: uuid(),
                orderedDate,
                originalText,
                unresolvedParts,
                ...getForeignKeysForTarget(options as CreateDraftResultLineOptions)
              } as UnresolvedDraftResultLine);

              // Resolved parsed result (a result definition was identified)
              if ('resultDefinitionId' in parsedResult) {
                const { resolvedResultPrompts, ...rest } = parsedResult;
                const resultLineWithoutResultPrompts = {
                  ...unresolvedResultLine,
                  promptChoices: parsedResult.promptChoices,
                  shortCode: parsedResult.shortCode
                };
                // Cached values with which to create this result line can be passed
                // to this method directly, which is the case when a child's result
                // prompts are identifiable only by their parent, and are therefore
                // forwarded. In all other cases, the result line itself will look up
                // its own cache.
                const cachedValues$ = options.cache
                  ? of(options.cache)
                  : this.draftResultCacheService.getValuesForResultLine({
                      hearingId: options.hearingId,
                      ...resultLineWithoutResultPrompts
                    });

                return cachedValues$.pipe(
                  map(cachedItems => {
                    const resultPromptsFromCache = createDraftResultPromptsFromValueMap(
                      parsedResult.promptChoices,
                      cachedItems.reduce((valueMap, cachedItem) => {
                        const promptChoice = parsedResult.promptChoices.find(
                          val =>
                            val.type === cachedItem.type && val.promptRef === cachedItem.promptRef
                        );
                        // We do not validate an incoming value against its prompt
                        // choice if the value originates from the cache, as we want
                        // to present the value to the user in the UI even if the
                        // cached value does not satisfy the constraints of the prompt
                        // choice.
                        if (promptChoice && !isEmptyValue(cachedItem.value)) {
                          if (isObjectLike(cachedItem.value) && !Array.isArray(cachedItem.value)) {
                            return {
                              ...valueMap,
                              ...(cachedItem.value as Record<string, unknown>)
                            };
                          }
                          return {
                            ...valueMap,
                            [cachedItem.promptRef]: cachedItem.value
                          };
                        }
                        return valueMap;
                      }, {})
                    );
                    // should the resolved prompts and the cached result prompts
                    // overlap (i.e. both provide a result prompt for the same
                    // prompt choice), then we prioritize the result prompt resolved
                    // via the parser, as it's considered more recent
                    const resultPrompts = sortBy(
                      uniqBy(
                        [...resolvedResultPrompts, ...resultPromptsFromCache],
                        draftResultPrompt => draftResultPrompt.promptRef
                      ),
                      ({ promptRef }) => find(parsedResult.promptChoices, { promptRef }).promptOrder
                    );
                    // a conditional mandatory result is considered invalid until a
                    // yes/no decision is taken by the user via the UI
                    const valid =
                      validateDraftResultPrompts(parsedResult.promptChoices, resultPrompts) &&
                      !parsedResult.conditionalMandatory;

                    const amendmentsLog = this.setAmendmentLogForNewResultLine(
                      amendmentReason,
                      amendmentDate,
                      userDetails,
                      resultPrompts
                    );

                    return {
                      ...rest,
                      ...resultLineWithoutResultPrompts,
                      resultPrompts,
                      valid,
                      amendmentsLog
                    };
                  })
                );
              }
              // Unresolved parsed result
              return of(unresolvedResultLine);
            })
          )
      )
    );
  }

  /**
   * Create result lines for any mandatory, optional, or cached child result
   * definitions belonging to a result line. This will operate recursively, and
   * create all required result lines up to the maximum depth.
   *
   * @param resultLine the result line to create child result lines for
   * @param resultPromptsKeyedByShortcode an optional dictionary of result
   * prompts, keyed by their result definition shortcode, which can be used when
   * creating a new child result line
   * @returns An observable that emits child result lines and their relation to
   * the original result line
   */
  private createDraftResultLinesForKnownChildDefinitions = (
    hearingId: string,
    parentResultLine: ExtendedResolvedDraftResultLine,
    cacheForHierarchy?: CachedPromptValuesKeyedByShortcode
  ): Observable<{ resultLine: ResolvedDraftResultLine; belongsToResultLineId: string }[]> => {
    const { childResultDefinitions = [], resultLineId, orderedDate } = parentResultLine;
    // In the instance where a result line was previously cached in its entirety
    // (i.e. with its chosen child result definition shortcodes, and their
    // completed result prompts), then we want to repopulate the result prompts
    // when re-introducing these children. Therefore, we acquire the prompt
    // values keyed by their respective shortcodes by fetching the cached values
    // stored against their parent, and then forward this dictionary to each
    // depth of the recursion. (Note that cached children cannot rely on the
    // usual mechanism of looking up their own cached values, as the result
    // prompts for cached children are only stored against their parent).
    const cacheForHierarchy$ = cacheForHierarchy
      ? of(cacheForHierarchy)
      : this.draftResultCacheService.getValuesForHierarchy({ ...parentResultLine, hearingId });

    return cacheForHierarchy$.pipe(
      switchMap(cache =>
        from(childResultDefinitions).pipe(
          filter(({ ruleType, shortCode }) => {
            // When a shortcode is found as a key in the cached result prompts
            // dictionary, then this `childResultDefinition` should be
            // introduced regardless of its `ruleType` as we are rebuilding
            // the cached result line relations.
            const hasCachedChild = Boolean(cache[shortCode]);
            // A mandatory child of a "conditional mandatory" must be chosen
            // explicitly by the user via the UI, so its requirement is
            // considered as unknown at this point
            const ruleTypes = isConditionalMandatoryDraftResultLine(parentResultLine)
              ? ['optional']
              : ['optional', 'mandatory'];

            return hasCachedChild || ruleTypes.includes(ruleType);
          }),
          mergeMap(({ shortCode }) =>
            this.createDraftResultLine({
              ...getForeignKeysForTarget(parentResultLine),
              hearingId,
              orderedDate,
              shortCode,
              cache: cache[shortCode]
            }).pipe(
              // consider any nested child result definitions recursively,
              // forwarding any cache to each new depth
              mergeMap(childResultLine =>
                this.createDraftResultLinesForKnownChildDefinitions(
                  hearingId,
                  childResultLine,
                  cacheForHierarchy
                ).pipe(
                  reduce(
                    (allNestedChildren, childRelations) => [
                      ...allNestedChildren,
                      ...childRelations
                    ],
                    [] as { resultLine: ResolvedDraftResultLine; belongsToResultLineId: string }[]
                  ),
                  map(childRelations => [
                    { resultLine: childResultLine, belongsToResultLineId: resultLineId },
                    ...childRelations
                  ])
                )
              )
            )
          )
        )
      ),
      // handle the fact that no child result lines were created due to either:
      // - the child result definitions being only of ruleType 'oneOf' or
      //   'atleastOneOf' and hence the desired result definitions not being
      //   known at this stage
      // - the result line has the `conditionalMandatory` flag
      // - all 'mandatory' or 'optional' child result definitions already
      //   existing in the draft result for this target and hence their result
      //   lines are being skipped
      defaultIfEmpty([])
    );
  };

  /**
   * Internal method used for any operation that relies upon extending the draft
   * result through parsing notepad text, namely: 1) lines of original text
   * entered by the user into a parser textbox; or 2) a shortcode provided by
   * the user when selecting a 'oneOf' or 'atleastOneOf' child result
   * definition, or when a `resultChoice` from an unresolved part is chosen by
   * the user.
   *
   * @param draftResult the draft result to be extended
   * @param unparsedNotepadItems an array of items to be parsed, either text
   * options parsed from the user's input or child options originating from a
   * child result definition
   * @returns an observable that emits the extended draft result
   */
  private extendWithParsedResultLines(
    draftResult: DraftResult,
    userDetails: UserDetails,
    unparsedNotepadItems: Array<ParseTextOptions | ParseChildResultLineOptions>
  ): Observable<DraftResult> {
    const hearingId = draftResult.hearingId;

    let nextDraftResult = draftResult;

    return forkJoin(
      unparsedNotepadItems.map(unparsedNotepadItem =>
        this.createDraftResultLine({ ...unparsedNotepadItem, hearingId, userDetails })
      )
    ).pipe(
      // Parse all items into result lines, and add them to the draft result
      // before considering any child result definitions that may be required.
      // This is important when multiple notepad items are parsed together, as
      // the result line from parsing one could be used as the child of another,
      // and so would not need to be independently created via a child result
      // definition.
      tap(resultLines => {
        resultLines.forEach((resultLine, i) => {
          const config = unparsedNotepadItems[i];

          nextDraftResult = this.extendWithResultLine(
            nextDraftResult,
            resultLine,
            userDetails,
            'belongsToResultLineId' in config && config.belongsToResultLineId
          );
        });
        // Clear all existing relation mappings during result line extension.
        this.clearNonAddedResultLines();
      }),
      map(resultLines => resultLines.filter(isExtendedResolvedDraftResultLine)),
      // Evaluate each result line for any child result definitions that should
      // be introduced
      switchMap(resultLines =>
        forkJoin(
          resultLines.map(resultLine =>
            this.createDraftResultLinesForKnownChildDefinitions(hearingId, resultLine).pipe(
              tap(resultsForHierarchy => {
                resultsForHierarchy.forEach(result => {
                  nextDraftResult = this.extendWithResultLine(
                    nextDraftResult,
                    result.resultLine,
                    userDetails,
                    result.belongsToResultLineId
                  );
                });
                // Clear all existing relation mappings during result line extension.
                this.clearNonAddedResultLines();
              })
            )
          )
        )
      ),
      switchMap(() =>
        this.processAutoPopulateResults(nextDraftResult, userDetails).pipe(
          tap(updatedDraftResult => {
            nextDraftResult = updatedDraftResult;
          })
        )
      ),
      tap(() => {
        nextDraftResult = this.handleMissingRelations(
          nextDraftResult as DraftResult<ExtendedResolvedDraftResultLine>
        );
      }),
      defaultIfEmpty(null),
      map(() => nextDraftResult)
    );
  }

  /**
   * Sometimes when you enter shortcode along with grandchild,
   * it doesn't recognise siblings as their children, this function solves this issue.
   *
   * @param draftResult the draft result to be extended
   * @returns extended draft result with relations
   */
  private handleMissingRelations(
    draftResult: DraftResult<ExtendedResolvedDraftResultLine>
  ): DraftResult {
    const { relations = [] } = draftResult;
    const activeResultLinesArr = getActiveResultLines(draftResult);

    const nextRelations: DraftResultRelation[] = JSON.parse(JSON.stringify(relations));

    activeResultLinesArr.forEach(resultLine => {
      const { resultLineId, resultDefinitionId } = resultLine;

      const parentResultLine = getNonRelatedParentResultLineById(draftResult, resultLineId);
      if (!parentResultLine) {
        return;
      }

      const { resultLineId: parentResultLineId, childResultDefinitions } = parentResultLine;
      const parentDraftResultRelation = getRelationById(
        { ...draftResult, relations: nextRelations },
        parentResultLineId
      );
      if (!parentDraftResultRelation) {
        return;
      }

      const isDuplicateResultAlreadyInRelation = getDuplicateResultLineAlreadyInRelation(
        draftResult,
        resultLineId,
        parentDraftResultRelation
      );
      if (isDuplicateResultAlreadyInRelation) {
        return;
      }

      const { childResultLineIds = [] } = parentDraftResultRelation;
      const isChildAlreadyInRelationWithParent = childResultLineIds.includes(resultLineId);
      if (isChildAlreadyInRelationWithParent) {
        return;
      }

      const parentResultLineRelation = nextRelations.find(
        relation => relation.resultLineId === parentResultLineId
      );
      parentResultLineRelation.childResultLineIds.push(resultLineId);

      // If there is a relation found between nested children and parent
      // then the result should become its origin ruleType where comes from parent result.
      const resultLineRelation = nextRelations.find(
        relation => relation.resultLineId === resultLineId
      );
      const { ruleType } = childResultDefinitions.find(
        definition => definition.code === resultDefinitionId
      );
      resultLineRelation.ruleType = ruleType;
    });

    return { ...draftResult, relations: nextRelations };
  }

  private extendWithResultLine(
    draftResult: DraftResult,
    resultLine: AnyDraftResultLine,
    userDetails: UserDetails,
    belongsToResultLineId?: string
  ): DraftResult {
    if (belongsToResultLineId && isExtendedResolvedDraftResultLine(resultLine)) {
      // If parent resultLine does not exist in the draftResult, skip the child.
      if (this.resultLineIdsNotAdded.includes(belongsToResultLineId)) {
        return draftResult;
      }

      // When adding a child to a result, we must first assert that it respects
      // the grouping rules of the draft result. If it does not, then abort this
      // action. This will take care of child result lines that may be
      // semantically equal and created in parallel that we otherwise wouldn't
      // want both instances of.
      if (!getResultLineIsUniqueRelation(draftResult, resultLine, belongsToResultLineId)) {
        // keep track of result line not added
        this.resultLineIdsNotAdded.push(resultLine.resultLineId);

        return draftResult;
      }
      // Otherwise, introduce this result line as a child
      const updatedDraftResult = produce(draftResult, nextDraftResult => {
        const belongsToResult = getResultById<ExtendedResolvedDraftResultLine>(
          nextDraftResult,
          belongsToResultLineId
        );
        const { childResultDefinitions = [] } = belongsToResult.resultLine;
        const { ruleType } = childResultDefinitions.find(
          childResultDefinition => childResultDefinition.code === resultLine.resultDefinitionId
        );

        // When this result line belongs to a "conditional mandatory" result line,
        // we recognise this as the parent having being acted upon by the user, and
        // so the parent is flagged as valid.
        if (
          isConditionalMandatoryDraftResultLine(belongsToResult.resultLine) &&
          ruleType === 'mandatory'
        ) {
          belongsToResult.resultLine.valid = true;
        }

        // Add/replace the result line in the draft result, and update the
        // target's foreign keys. While these keys will usually have been
        // correctly set at the point of creation of the child result line, we set
        // them again here to handle the case where relations are shuffled due to
        // some other result line having been deleted and the struture being
        // affected.
        nextDraftResult.resultLines[resultLine.resultLineId] = this.replaceForeignKeysForTarget(
          resultLine,
          getForeignKeysForTarget(belongsToResult.resultLine)
        );

        const existingRelation = getRelationById(nextDraftResult, resultLine.resultLineId);

        if (existingRelation) {
          existingRelation.ruleType = ruleType;
        } else {
          nextDraftResult.relations.push({
            resultLineId: resultLine.resultLineId,
            ruleType,
            childResultLineIds: []
          });
        }

        if (!belongsToResult.relation.childResultLineIds.includes(resultLine.resultLineId)) {
          belongsToResult.relation.childResultLineIds.push(resultLine.resultLineId);
        }
      });

      // Amendments apply to an entire hierarchy, so if we are introducing a
      // result line to an existing hierarchy, we must also attribute any
      // existing amendments
      const belongsToResultLine = getResultLineById<ExtendedResolvedDraftResultLine>(
        updatedDraftResult,
        belongsToResultLineId
      );

      if (hasPendingAmendments(belongsToResultLine)) {
        return this.setAmendmentReason(updatedDraftResult, {
          resultLineId: resultLine.resultLineId,
          amendmentDate: belongsToResultLine.amendmentDate,
          amendmentReason: belongsToResultLine.amendmentReason,
          userDetails
        });
      }

      return updatedDraftResult;
    }

    return this.extendWithInferredRelations(
      produce(draftResult, ({ relations, resultLines }) => {
        resultLines[resultLine.resultLineId] = resultLine;
        relations.push({
          resultLineId: resultLine.resultLineId,
          ruleType: isResolvedDraftResultLine(resultLine) ? 'standalone' : 'unknown',
          childResultLineIds: []
        });
      }),
      userDetails
    );
  }

  /**
   * Remove a result line and its children from the draft result. Depending on
   * the amendment status of the result lines being removed, this operation will
   * either flag the result lines as deleted, or delete them entirely. Where an
   * amendment exists, we want to preserve the deleted result line so that its
   * new status can be shared, and so that its data remains visible after
   * deletion on the 'Manage hearing' screen.
   *
   * @param draftResult the draft result to be extended
   * @param resultLineId the id of the result line to be removed
   * @param depth the depth of the child hierarchy
   * @returns the extended draft result
   */
  private omitResultLine = (
    draftResult: DraftResult,
    userDetails: UserDetails,
    resultLineId: string,
    depth = 0
  ): DraftResult => {
    // Recursively omit all children related to this result line by iterating
    // through its related child result lines

    const resultInfo = getResultById(draftResult, resultLineId);

    if (!resultInfo) {
      return draftResult;
    }

    const { resultLine, relation } = resultInfo;

    let updatedDraftResult = relation.childResultLineIds.reduce(
      (nextDraftResult, childResultLineId) =>
        this.omitResultLine(nextDraftResult, userDetails, childResultLineId, depth + 1),
      draftResult
    );

    // When a shared result line is deleted, we are just flagging it as deleted
    // so that it can be re-shared. We mantain its relation with its parent so
    // that it can still be correctly sorted (e.g. on 'Manage hearing' page)
    if (isSharedResultLine(resultLine)) {
      updatedDraftResult = produce(updatedDraftResult, nextDraftResult => {
        getResultLineById<ResolvedDraftResultLine>(nextDraftResult, resultLineId).deleted = true;
      });
    } else {
      // When the result line has not been shared, remove any reference to this
      // result line from any parent relations it may belong to. This will
      // detatch it from the relations hierarchy, whereupon it can be cleaned up
      updatedDraftResult = produce(updatedDraftResult, nextDraftResult => {
        const belongsToResult = getParentResultById(nextDraftResult, resultLineId);
        const result = getResultById(nextDraftResult, resultLineId);

        if (belongsToResult) {
          const idx = belongsToResult.relation.childResultLineIds.indexOf(resultLineId);
          belongsToResult.relation.childResultLineIds.splice(idx, 1);
        }
        // Finally, remove this result line and its corresponding relation entirely
        delete nextDraftResult.resultLines[resultLineId];
        nextDraftResult.relations.splice(nextDraftResult.relations.indexOf(result.relation), 1);
      });
    }

    return depth === 0
      ? this.extendWithInferredRelations(updatedDraftResult, userDetails)
      : updatedDraftResult;
  };

  /**
   * Walks the standalone result lines of a draft result to determine if they
   * can be added as a child of any of the other result lines in the draft
   * result. This method can be safely used at any point to "recalibrate" the
   * draft result by building any missing relations between result lines, such
   * as when a new standalone result line has been added, or when a child result
   * line was removed.
   *
   * @param draftResult the draft result to be extended
   * @returns the extended draft result
   */
  private extendWithInferredRelations = (
    draftResult: DraftResult,
    userDetails: UserDetails
  ): DraftResult => {
    const ruleTypes: ChildResultDefinition['ruleType'][] = [
      'atleastOneOf',
      'oneOf',
      'optional',
      'mandatory'
    ];

    return filterResults<ResolvedDraftResultLine>(
      draftResult,
      result =>
        result.relation.ruleType === 'standalone' && isActiveDraftResultLine(result.resultLine)
    ).reduce((nextDraftResult, { resultLine }) => {
      // Get the result lines that are semantically equal, which is to say
      // they can be grouped with / share grouping rules with each other.
      // These are the only result lines for which we can infer any relations.
      // We will evaluate each of these to determine if they have any
      // outstanding child result definitions that might be satisfied by our
      // standalone result line.
      const relatedResults = getResultsGroupedWith(draftResult, resultLine);

      for (const relatedResult of relatedResults) {
        if ('childResultDefinitions' in relatedResult.resultLine) {
          const relatedResultLineId = relatedResult.resultLine.resultLineId;

          for (const ruleType of ruleTypes) {
            const childResults = getChildResults(draftResult, relatedResultLineId).filter(
              result =>
                result &&
                result.relation.ruleType === ruleType &&
                isActiveDraftResultLine(result.resultLine)
            );
            const childResultDefinitions = getChildResultDefinitionsForRuleType(
              relatedResult.resultLine,
              ruleType
            );
            // Depending on the rule type, the criteria for determining an
            // absent relation will differ. In the case of 'mandatory' and
            // 'optional' rule types, there is a 1-to-1 relationship, and so if
            // a child result definition existed for which a relation didn't,
            // then a new relation would be required. In the case of 'oneOf',
            // where the criteria is that once a single relation exists of this
            // type, then no further relations can be created, then any further
            // relations are not required.
            let requireRelation = true;

            if (ruleType === 'atleastOneOf') {
              requireRelation = childResultDefinitions.length > 0;
            }
            if (ruleType === 'oneOf') {
              requireRelation = childResultDefinitions.length > 0 && childResults.length === 0;
            }
            if (requireRelation) {
              for (const childResultDefinition of childResultDefinitions) {
                const hasMatchingResultDefinition = childResults.some(
                  childResult =>
                    childResult.resultLine.resultDefinitionId === childResultDefinition.code
                );

                if (
                  childResultDefinition.code === resultLine.resultDefinitionId &&
                  !hasMatchingResultDefinition
                ) {
                  return this.extendWithResultLine(
                    nextDraftResult,
                    resultLine,
                    userDetails,
                    relatedResult.resultLine.resultLineId
                  );
                }
              }
            }
          }
        }
      }
      return nextDraftResult;
    }, draftResult);
  };

  private replaceForeignKeysForTarget = <T extends AnyDraftResultLine>(
    resultLine: T,
    keys: TargetLike
  ): T => {
    return {
      ...omit(resultLine, [
        'applicationId',
        'offenceId',
        'caseId',
        'defendantId',
        'masterDefendantId'
      ]),
      ...keys
    } as T;
  };

  private clearNonAddedResultLines = () => {
    this.resultLineIdsNotAdded = [];
  };

  private evaluateConditionalMandatoryResults = (
    draftResult: DraftResult<AnyDraftResultLine>,
    userDetails: UserDetails
  ): Observable<DraftResult> => {
    const conditionalMandatoryResultLines = getResults(draftResult).filter(res =>
      isConditionalMandatoryDraftResultLine(res.resultLine)
    );
    if (!conditionalMandatoryResultLines.length) {
      return of(draftResult);
    }

    const updatedDraftResult = this.determineDefaultConditionalMandatory(
      draftResult,
      conditionalMandatoryResultLines
    );

    return of(updatedDraftResult);
  };

  private determineDefaultConditionalMandatory = (
    draftResult: DraftResult<AnyDraftResultLine>,
    conditionalMandatoryResultLines: Result<AnyDraftResultLine>[]
  ): DraftResult<AnyDraftResultLine> => {
    let updatedDraftResult = draftResult;

    conditionalMandatoryResultLines.forEach(condMandResultLine => {
      const {
        relation: { childResultLineIds }
      } = condMandResultLine;

      const selectedChildResultCodes = childResultLineIds.map(childResLineId => {
        return getResultLineById<ExtendedResolvedDraftResultLine>(draftResult, childResLineId)
          .shortCode;
      });

      const selectedChildResDefOption = (
        condMandResultLine.resultLine as ExtendedResolvedDraftResultLine
      ).childResultDefinitions.find(childResDef => {
        if (selectedChildResultCodes.includes(childResDef.shortCode)) {
          return childResDef;
        }
        return undefined;
      });
      if (selectedChildResDefOption) {
        updatedDraftResult = produce(updatedDraftResult, ({ resultLines }) => {
          resultLines[condMandResultLine.resultLine.resultLineId] = {
            ...condMandResultLine.resultLine,
            valid: true
          };
        });
      }
    });
    return updatedDraftResult;
  };

  private isDuplicatedStandaloneResult(
    draftResult: DraftResult,
    resultlineToCompare: ResolvedDraftResultLine
  ): boolean {
    //DD-33993: Allow NHCC and NHMC result shortcodes to be duplicated in multiple offences
    const shortCodeToCompare = resultlineToCompare.shortCode.toLowerCase();
    if (['nhmc', 'nhccs'].includes(shortCodeToCompare)) {
      return false;
    }

    return filterResults<ResolvedDraftResultLine>(
      draftResult,
      result =>
        result.relation.ruleType === 'standalone' && isActiveDraftResultLine(result.resultLine)
    ).some(result => {
      return (
        isResultLineSemanticallyEqual(resultlineToCompare, result.resultLine) &&
        result.resultLine.shortCode === resultlineToCompare.shortCode
      );
    });
  }

  private evaluateRelations(
    draftResult: DraftResult,
    userDetails: UserDetails
  ): Observable<DraftResult> {
    // Check whether we have any resultlines. The user might have
    // deleted them all. If we dont have any resultlines, no need to continue
    // simply return the draftResult

    const results = getActiveResultLines(
      draftResult as DraftResult<ExtendedResolvedDraftResultLine>
    );
    if (!results.length) {
      return of(draftResult);
    }

    // If we are here, we have resultlines to process.
    // As the user deleted some resultlines, we need to re-evaluate
    // the relations. This is needed as the user might have deleted results at offence and/or defendant
    // level which is related to another parent result.
    // For example FO and FCPC share the same children at defendant level. These children can
    // only appear once per defendant. So deleting FO in the UI should add the children back in FCPC
    // which what this code is doing.
    const hearingId = draftResult.hearingId;

    return of(results).pipe(
      switchMap(resultLines =>
        forkJoin(
          resultLines.map(resultLine =>
            this.createDraftResultLinesForKnownChildDefinitions(hearingId, resultLine, {}).pipe(
              tap(resultsForHierarchy => {
                resultsForHierarchy.forEach(result => {
                  draftResult = this.extendWithResultLine(
                    draftResult,
                    result.resultLine,
                    userDetails,
                    result.belongsToResultLineId
                  );
                });
              })
            )
          )
        )
      ),
      tap(() => {
        draftResult = this.handleMissingRelations(
          draftResult as DraftResult<ExtendedResolvedDraftResultLine>
        );
      }),
      map(() => draftResult)
    );
  }

  private processAutoPopulateResults(
    draftResult: DraftResult,
    userDetails: UserDetails
  ): Observable<DraftResult> {
    const activeResultLines = getActiveResultLines(
      draftResult as DraftResult<ExtendedResolvedDraftResultLine>
    );

    const autoPopulateResultLines = activeResultLines.filter(
      result => result.autoPopulateBooleanResult
    );

    if (autoPopulateResultLines.length === 0) {
      return of(draftResult);
    }

    let updatedDraftResult = draftResult;
    const childDefinitionObservables: Observable<DraftResult>[] = [];

    (autoPopulateResultLines as OffenceLike<ExtendedResolvedDraftResultLine>[]).forEach(
      resultLine => {
        const resultDefinitionId = resultLine.autoPopulateBooleanResult!;
        const matchingResults = (
          activeResultLines as OffenceLike<ExtendedResolvedDraftResultLine>[]
        ).filter(
          f =>
            f.resultDefinitionId === resultDefinitionId &&
            f.offenceId === resultLine.offenceId &&
            f.applicationId === resultLine.applicationId
        );

        if (matchingResults.length === 0) {
          return;
        }

        updatedDraftResult = produce(updatedDraftResult, draft => {
          matchingResults.forEach(matchingResult => {
            draft.resultLines[matchingResult.resultLineId] = {
              ...matchingResult,
              disabled: true
            };
          });
        });

        matchingResults.forEach(matchingResult => {
          const existingChildren = getChildResults(
            updatedDraftResult,
            matchingResult.resultLineId
          ).filter(c => !c.resultLine.deleted);

          if (existingChildren.length === 0) {
            const childResultForYes = matchingResult.childResultDefinitions.find(
              child => child.childOfTrueResponse !== false
            );
            const childDefinitionObservable = this.addChildResultDefinition(
              updatedDraftResult,
              userDetails,
              {
                belongsToResultLineId: matchingResult.resultLineId,
                orderedDate: resultLine.orderedDate,
                shortCode: childResultForYes?.shortCode
              }
            );

            childDefinitionObservables.push(childDefinitionObservable);
          }
        });
      }
    );

    if (childDefinitionObservables.length === 0) {
      return of(updatedDraftResult);
    }

    return forkJoin(childDefinitionObservables).pipe(
      map(updatedResults => {
        const finalDraftResult = updatedResults.reduce((acc, curr) => {
          return produce(acc, draft => {
            draft.resultLines = { ...curr.resultLines };
            draft.relations = [...curr.relations];
          });
        }, updatedDraftResult);

        return finalDraftResult;
      })
    );
  }

  private resetConditionalMandatoryResults(
    draftResult: DraftResult,
    deletedResult: ExtendedResolvedDraftResultLine,
    userDetails: UserDetails
  ): DraftResult {
    const activeResultLines = getActiveResultLines(
      draftResult as DraftResult<ExtendedResolvedDraftResultLine>
    );
    if (!activeResultLines.length) {
      return draftResult;
    }

    if (deletedResult.autoPopulateBooleanResult) {
      const autoPopulateBooleanResultId = deletedResult.autoPopulateBooleanResult;

      (activeResultLines as OffenceLike<ExtendedResolvedDraftResultLine>[]).forEach(result => {
        if (
          result.conditionalMandatory &&
          result.resultDefinitionId === autoPopulateBooleanResultId &&
          result.valid
        ) {
          const hasOtherForcingResults = (
            activeResultLines as OffenceLike<ExtendedResolvedDraftResultLine>[]
          )
            .filter(f => f !== deletedResult)
            .some(
              s =>
                s.autoPopulateBooleanResult === autoPopulateBooleanResultId &&
                s.offenceId === result.offenceId &&
                s.applicationId === result.applicationId
            );

          if (!hasOtherForcingResults) {
            const childResult = getChildResults(draftResult, result.resultLineId);

            draftResult = produce(draftResult, ({ resultLines }) => {
              resultLines[result.resultLineId] = { ...result, valid: false, disabled: false };
            });

            if (childResult.length > 0) {
              childResult.forEach(child => {
                draftResult = this.omitResultLine(
                  draftResult,
                  userDetails,
                  child.resultLine.resultLineId
                );
              });
            }
          }
        }
      });
    }
    return draftResult;
  }
}
