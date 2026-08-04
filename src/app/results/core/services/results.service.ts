import { formatDate } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { UserDetails, getUserDetails } from '@cpp/users-groups';
import { select, Store } from '@ngrx/store';
import produce from 'immer';
import { flatten, keyBy, omit, sortBy, uniq, values } from 'lodash-es';
import LZString from 'lz-string';
import moment from 'moment';
import { forkJoin, from, Observable, of } from 'rxjs';
import {
  concatMap,
  defaultIfEmpty,
  filter,
  map,
  mapTo,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { AppConfigService } from '../../../config';
import {
  CPPMonitorHttp,
  getCurrentHearing,
  HearingLockState,
  MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
  omitUndefined,
  WelshDefendantTranslate,
} from '../../../core';
import {
  AnyDraftResultLine,
  CompressedDraftResultWithMetadata,
  DraftResult,
  DraftResultPrompt,
  DraftResultRelation,
  DraftResultWithMetadata,
  ExtendedResolvedDraftResultLine,
  ResolvedDraftResultLine,
  ShareableResult,
  ShareableResultPrompt,
  SharedResult,
  SharedResultLine,
  TargetLike,
  UnresolvedDraftResultLine,
} from '../../results.interfaces';
import {
  createDraftResultPromptsFromValueMap,
  filterResults,
  getForeignKeysForTarget,
  getResultLineById,
  getTargetsForHearing,
  hasPendingAmendments,
  isActiveDraftResultLine,
  isResolvedDraftResultLine,
  isShareableDraftResultLine,
  isSharedResultLine,
  serializeDraftResultPromptValue,
} from '../helpers';
import { Legacy, migrateDraftResultToVersion } from '../migrations';
import { ResultsState } from '../store';
import { DraftResultBuilderService } from './draft-result-builder.service';
import { NotepadParserService } from './notepad-parser.service';

@Injectable({ providedIn: 'root' })
export class ResultsService {
  // The version dictates the schema of the draft result – any increase to the
  // version must be accompanied by a migration from the previous version
  readonly version = 1;

  constructor(
    @Inject(CppHttp) private cppHttp: CPPMonitorHttp,
    private configService: AppConfigService,
    private draftResultBuilderService: DraftResultBuilderService,
    private notepadParserService: NotepadParserService,
    private store: Store<ResultsState>
  ) {}

  /**
   * @param hearingId the id of the hearing whose defendants being selected
   * @param payload ids of translation required defendants
   */
  setWelshDefendantTranslate({
    hearingId,
    payload,
  }: {
    hearingId: string;
    payload: WelshDefendantTranslate[];
  }) {
    return this.cppHttp.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.save-defendants-welsh-translations+json',
      successEvent: 'public.hearing.defendants-welsh-information-recorded',
      body: { defendantsWelshList: payload },
    });
  }

  /**
   * Approve any amendments to the shared results requested for approval. (When
   * an already shared result is amended due to an admin error, resharing
   * requires the ratification of the amendments by another user). As a
   * consequence of this action, the `hearingLockState` of the hearing will
   * transition to 'SHARED'.
   *
   * @param hearingId the id of the hearing whose amendments are being approved
   * @param version the version of the draft result
   * @param hearingDay the day of the hearing
   * @param userId the id of the user approving the amendments
   * @returns an observable that emits upon approving the amendments
   */
  approveAmendments(
    { hearingId, hearingDay }: DraftResult<AnyDraftResultLine>,
    userId: string
  ): Observable<unknown> {
    return this.cppHttp.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/validate-result-amendments`,
      requestType: 'application/vnd.hearing.validate-result-amendments+json',
      successEvent: 'public.hearing.result-amendments-validated',
      errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
      body: {
        validateAction: 'APPROVE',
        id: hearingId,
        hearingDay,
        userId,
      },
    });
  }

  /**
   * Cancels all amendments made to a shared result. Note that while this
   * transitions the `hearingLockState` of the hearing back to SHARED, any
   * amendments held within a draft result remain unchanged and must be
   * reverted separately.
   *
   * @param hearingId the id of the hearing whose amendments should be cancelled
   * @param hearingDay the day of the hearing
   * @returns An observable that emits upon cancellation of the amendments
   */
  cancelAmendments({
    hearingId,
    hearingDay,
  }: DraftResult<AnyDraftResultLine>): Observable<unknown> {
    return this.cppHttp.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.change-cancel-amendments+json',
      successEvent: 'public.hearing.result-amendments-cancelled',
      errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
      body: { hearingDay },
    });
  }

  /**
   * Fetches the draft result for a hearing day. This is the lightest
   * representation of these result lines given they do not contain the result
   * definition metadata used for data collection via form controls.
   *
   * @param hearingId the id of the hearing for a draft result
   * @returns An observable that emits the shareable draft result
   */
  fetchDraftResult(
    hearingId: string,
    hearingDay: string,
    isBoxwork: boolean,
    firstSharedDate: string
  ): Observable<DraftResult<UnresolvedDraftResultLine | ResolvedDraftResultLine>> {
    return this.cppHttp
      .query<CompressedDraftResultWithMetadata | Legacy.DraftResult>({
        url: `/hearing-query-api/query/api/rest/hearing/hearings/${hearingId}/${hearingDay}/draft-result`,
        requestType: 'application/vnd.hearing.get-draft-result-v2+json',
      })
      .pipe(
        map((wrappedDraftresult) => this.unwrapDraftResult(wrappedDraftresult)),
        withLatestFrom(
          this.store.pipe(
            select(getCurrentHearing),
            filter((hearing) => Boolean(hearing) && hearing.id === hearingId)
          )
        ),
        // Migrate the draft result to ensure that any historical draft result
        // becomes aligned to the interface now expected by the current release
        // of the application. We forward any pertinent extra details that the
        // migration function may require, such as hearingId and hearingDay.
        switchMap(([draftResult, hearing]) => {
          const migratedDraftResult = migrateDraftResultToVersion(
            draftResult,
            this.version,
            {
              hearingId,
              hearingDay,
              hearing,
            },
            isBoxwork,
            firstSharedDate
          );

          return of(migratedDraftResult);
          // disabled pending https://tools.hmcts.net/jira/browse/DD-16685
          // if this is a legacy hearing, save the migrated result to the
          // backend so that it is immediately available when sharing results.
          // Any other migrations need not be saved immediately as there is
          // already a draft result persisted in the non-legacy format.
          // return isLegacyDraftResult(draftResult)
          //   ? this.saveDraftResult(migratedDraftResult).pipe(mapTo(migratedDraftResult))
          //   : of(migratedDraftResult);
        }),
        // the metadata is a private property used by this service only, so is not exposed
        // to the rest of the application
        map((wrappedDraftResult) => omit(wrappedDraftResult, '__metadata__'))
      );
  }

  /**
   * Fetches the extended draft result for a hearing day. This representation of
   * the draft result includes all the result definition metadata required for
   * building the form inputs required by each result line.
   *
   * Substantially larger in size and hence slower to call than the standard
   * draft result, only use this method where `promptChoices` and
   * `childResultDefinitions` information is required.
   *
   * Note that any result line within a draft result can either be resolved
   * (i.e. a result definition was identified when it was originally parsed), or
   * unresolved (i.e. no result definition could be parsed from the provided
   * text). In the case of the latter, we don't re-query the parsed result as
   * there's no absent `promptChoices` or `childResultDefinitions` that can be
   * obtained.
   *
   * @param hearingId the id of the hearing for a draft result
   * @returns An observable that emits the draft result extended with the prompt
   * choices and child result definitions for each result line
   */
  fetchExtendedDraftResult(
    hearingId: string,
    hearingDay: string,
    isBoxwork: boolean,
    firstSharedDate: string
  ): Observable<DraftResult<UnresolvedDraftResultLine | ExtendedResolvedDraftResultLine>> {
    return this.fetchDraftResult(hearingId, hearingDay, isBoxwork, firstSharedDate).pipe(
      withLatestFrom(
        this.store.pipe(
          select(getCurrentHearing),
          filter((hearing) => Boolean(hearing) && hearing.id === hearingId)
        )
      ),
      switchMap(([draftResult, hearing]) =>
        forkJoin(
          values(draftResult.resultLines).map((resultLine) => {
            if (isResolvedDraftResultLine(resultLine)) {
              return this.notepadParserService
                .fetchParsedResultDefinition(resultLine, hearing.jurisdictionType)
                .pipe(
                  map(
                    ({
                      bailStatusCode,
                      conditionalMandatory,
                      promptChoices,
                      childResultDefinitions = [],
                    }) =>
                      omitUndefined({
                        ...resultLine,
                        bailStatusCode,
                        conditionalMandatory,
                        promptChoices,
                        childResultDefinitions,
                      })
                  )
                );
            }
            return of(resultLine);
          })
        ).pipe(
          defaultIfEmpty([]),
          map((resultLines) => ({
            ...draftResult,
            resultLines: keyBy(resultLines, 'resultLineId'),
          }))
        )
      )
    );
  }

  /**
   * Fetch a draft result that represents the currently shared results. This is
   * emitted using the draft result interface, where the last shared result
   * lines are transformed into a draft result.
   *
   * @param hearingId the id of the hearing
   * @param hearingDay the day of the hearing (YYYY-MM-DD)
   * @returns an observable that emits the draft result as per the shared result
   * lines
   */
  fetchSharedResult(
    hearingId: string,
    hearingDay: string,
    isBoxWork: boolean,
    firstSharedDate: string
  ): Observable<DraftResult> {
    return this.cppHttp
      .query<SharedResult>({
        url: `/hearing-query-api/query/api/rest/hearing/hearings/${hearingId}/${hearingDay}/share-results`,
        requestType: 'application/vnd.hearing.get-share-result-v2+json',
      })
      .pipe(
        switchMap((sharedResult) => {
          // If there are no shared result lines, then this must be a legacy
          // hearing, prior to when shared result lines were saved by the
          // database. Consequently, to recover the legacy shared results, we
          // must revert to the legacy draft result by deleting the current
          // draft.
          if (sharedResult.resultLines.length === 0) {
            return this.cppHttp
              .commandSync({
                url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/${hearingDay}`,
                requestType: 'application/vnd.hearing.delete-draft-result-v2+json',
                successEvent: 'public.hearing.draft-result-deleted-v2',
                body: { hearingId, hearingDay },
              })
              .pipe(
                switchMap(() =>
                  this.fetchExtendedDraftResult(hearingId, hearingDay, isBoxWork, firstSharedDate)
                )
              );
          }
          return this.mapSharedResultToDraftResult(hearingId, hearingDay, sharedResult, true);
        })
      );
  }

  /**
   * Lock the hearing for amendments on behalf of the current user. Depending on
   * the amendment reason provided, the `hearingState` of the hearing will
   * transition to 'SHARED_AMEND_LOCKED_ADMIN_ERROR' or
   * 'SHARED_AMEND_LOCKED_USER_ERROR'. As a consequence of locking a hearing,
   * all further amendments are restricted to the current user until abandoned
   * or shared.
   *
   * @param hearingId the id of the hearing to be locked for amendments
   * @param newHearingState the intended hearing lock state
   * @returns an observable that emits upon locking the hearing
   */
  lockHearingForAmendments(
    hearingId: string,
    newHearingState:
      | HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
      | HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
  ): Observable<unknown> {
    return this.cppHttp.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}`,
      requestType: 'application/vnd.hearing.amend+json',
      successEvent: 'public.hearing.event-amended',
      errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
      body: { hearingId, newHearingState },
      background: true,
    });
  }

  /**
   * Reject any amendments to the shared results requested for approval. As a
   * consequence of this action, the `hearingLockState` of the hearing will
   * revert to 'SHARED'. Note that the amendments held within a draft result
   * remain unchanged and must be reverted separately.
   *
   * @param hearingId the id of the hearing to be locked for amendments
   * @param version the version of the draft result
   * @param hearingDay the day of the hearing
   * @param userId the user id for the current user
   * @returns an observable that emits upon rejecting the amendments
   */
  rejectAmendments(
    { hearingId, hearingDay, version }: DraftResult<AnyDraftResultLine>,
    userId: string
  ): Observable<unknown> {
    return this.cppHttp.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/validate-result-amendments`,
      requestType: 'application/vnd.hearing.validate-result-amendments+json',
      successEvent: 'public.hearing.result-amendments-rejected',
      errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
      body: {
        validateAction: 'REJECT',
        id: hearingId,
        hearingDay,
        version: version ?? 1,
        userId,
      },
    });
  }

  /**
   * Requests approval for amendments on behalf of the current user. Where the
   * type of amendments cannot be self-ratified (such as amendments due to an
   * admin error), a second user must review the changes. This actions updates
   * the `hearingState` of the hearing to 'APPROVAL_REQUESTED'.
   *
   * @param hearingId the id of the hearing to be locked for amendments
   * @param version the version of the draft result
   * @param hearingDay the day of the hearing
   * @returns an observable that emits upon requesting the approval
   */
  requestApprovalForAmendments({
    hearingId,
    hearingDay,
    version,
  }: DraftResult<AnyDraftResultLine>): Observable<unknown> {
    return this.cppHttp.commandSync({
      url: `/hearing-command-api/command/api/rest/hearing/request-approval`,
      requestType: 'application/vnd.hearing.request-approval+json',
      successEvent: 'public.hearing.approval-requested',
      errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
      body: { hearingId, hearingDay, version: version ?? 1 },
    });
  }

  /**
   * Save a draft result. The provided draft result will be wrapped with
   * metadata (such as the draft result version used for migrations) before it's
   * sent. This metadata is used internally by this service only.
   *
   * @param draftResult the draft result to be shared
   * @returns an observable that emits upon saving the draft result
   */
  saveDraftResult(draftResult: DraftResult, isResetResults?: boolean): Observable<DraftResult> {
    const transformedDraftResult: DraftResult = {
      ...draftResult,
      version: draftResult.version ? draftResult.version + 1 : 1,
      resultLines: Object.keys(draftResult.resultLines).reduce((resultLines, resultLineId) => {
        const resultLine = draftResult.resultLines[resultLineId];
        // If we're providing an ExtendedResolvedDraftResultLine to this method,
        // we must strip its metadata so that we don't persist large volumes of
        // data that can easily be recreated by the `fetchExtendedDraftResult`
        // method.
        if ('promptChoices' in resultLine) {
          return {
            ...resultLines,
            [resultLineId]: produce(resultLine, (nextResultLine) => {
              delete nextResultLine.bailStatusCode;
              delete nextResultLine.childResultDefinitions;
              delete nextResultLine.conditionalMandatory;
              delete nextResultLine.excludedFromResults;
              delete nextResultLine.promptChoices;
            }),
          };
        }
        return { ...resultLines, [resultLineId]: resultLine };
      }, {} as Record<string, UnresolvedDraftResultLine | ResolvedDraftResultLine>),
    };
    return this.cppHttp
      .commandSync({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${draftResult.hearingId}/${draftResult.hearingDay}`,
        requestType: 'application/vnd.hearing.save-draft-result-v2+json',
        body: this.wrapDraftResult(transformedDraftResult, isResetResults),
        background: true,
        successEvent: 'public.hearing.draft-result-saved',
        errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
      })
      .pipe(mapTo(transformedDraftResult));
  }

  /**
   * Share a completed draft result (i.e. one where the result lines present are
   * all resolved and valid). This action is used for the first-time sharing of
   * result lines, and also for sharing any amendments to result lines due to
   * user error.
   *
   * @param draftResult a valid draft result to be shared
   * @param user the user sharing the draft result (e.g. court clerk)
   * @returns an observable that emits the draft result representing the shared result
   */
  shareDraftResult(
    draftResult: DraftResult,
    userDetails: UserDetails,
    isBoxWork: boolean,
    firstSharedDate: string
  ): Observable<DraftResult> {
    const { hearingId, hearingDay } = draftResult;
    const shareableDraftResult = this.mapDraftResultToShareableResult({
      draftResult,
      userDetails,
      isBoxWork,
      firstSharedDate,
    });
    return this.cppHttp
      .commandSync({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/${hearingDay}`,
        requestType: 'application/vnd.hearing.shared-results+json',
        successEvent: 'public.events.hearing.hearing-resulted-success',
        errorEvent: MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
        body: shareableDraftResult,
        timeout: 60000,
      })
      .pipe(
        switchMap(() =>
          this.mapSharedResultToDraftResult(hearingId, hearingDay, shareableDraftResult)
        )
      );
  }

  private mapDraftResultToShareableResult({
    draftResult,
    userDetails: { userId, firstName, lastName },
    isBoxWork,
    firstSharedDate,
  }: {
    draftResult: DraftResult;
    userDetails: UserDetails;
    isBoxWork: boolean;
    firstSharedDate: string;
  }): ShareableResult {
    const sharedDate = formatDate(Date.now(), 'yyyy-MM-dd', 'en-GB');
    const courtClerk = { userId, firstName, lastName };
    const mapDraftResultPromptToShareableResultPrompt = ({
      promptId: id,
      promptRef,
      label,
      type,
      value,
      welshValue,
    }: DraftResultPrompt): ShareableResultPrompt | ShareableResultPrompt[] => {
      switch (type) {
        case 'ADDRESS':
        case 'NAMEADDRESS': {
          return flatten(
            (value as DraftResultPrompt[]).map(mapDraftResultPromptToShareableResultPrompt)
          );
        }

        case 'ONEOF':
          return mapDraftResultPromptToShareableResultPrompt(value as DraftResultPrompt);

        default: {
          const serializedValue = serializeDraftResultPromptValue(type, value);

          return omitUndefined({
            id,
            promptRef,
            label,
            value: serializedValue,
            welshValue: welshValue ? String(welshValue) : undefined,
          });
        }
      }
    };

    let boxworkOrderDate: string;
    if (isBoxWork) {
      boxworkOrderDate = firstSharedDate
        ? formatDate(firstSharedDate, 'yyyy-MM-dd', 'en-GB')
        : sharedDate;
    }

    return {
      version: draftResult.version ?? 1,
      courtClerk,
      resultLines: filterResults<ResolvedDraftResultLine>(draftResult, ({ resultLine }) =>
        isShareableDraftResultLine(draftResult, resultLine, true)
      ).reduce((shareableResultLines, { resultLine, relation }) => {
        const {
          autoPopulateBooleanResult,
          disabled,
          resultDefinitionId,
          orderedDate,
          resultLineId,
          resultLevel,
          label,
          amendmentReason,
          amendmentDate,
          resultPrompts = [],
          shortCode,
          nonStandaloneAncillaryResult,
          category,
        } = resultLine;

        // BE saves amendmentsLogs as a string..
        const amendmentsLog =
          !!resultLine.amendmentsLog && JSON.stringify(resultLine.amendmentsLog);

        // strip any invalid or deleted result lines from the relation being shared
        const childResultLineIds = relation.childResultLineIds.filter((childResultLineId) => {
          const childResultLine = getResultLineById(draftResult, childResultLineId);

          return (
            isActiveDraftResultLine(childResultLine) &&
            isShareableDraftResultLine(draftResult, childResultLine, true)
          );
        });

        return [
          ...shareableResultLines,
          omitUndefined({
            ...getForeignKeysForTarget(resultLine),
            autoPopulateBooleanResult,
            category,
            delegatedPowers: draftResult.delegatedPowers ? courtClerk : undefined,
            disabled,
            shortCode,
            orderedDate: boxworkOrderDate || orderedDate,
            draftResult: '{}',
            resultLineId,
            resultDefinitionId,
            level: resultLevel === 'C' ? 'CASE' : resultLevel === 'D' ? 'DEFENDANT' : 'OFFENCE',
            resultLabel: label,
            amendmentsLog: amendmentsLog || undefined,
            amendmentReasonId: amendmentReason && amendmentReason.id,
            amendmentReason: amendmentReason && amendmentReason.reasonDescription,
            amendmentDate,
            childResultLineIds,
            isDeleted: resultLine.deleted,
            isModified: hasPendingAmendments(resultLine) || !isSharedResultLine(resultLine),
            isComplete: true,
            prompts: flatten(resultPrompts.map(mapDraftResultPromptToShareableResultPrompt)),
            shadowListed:
              'offenceId' in resultLine &&
              draftResult.shadowListedOffenceIds.includes(resultLine.offenceId),
            sharedDate,
            nonStandaloneAncillaryResult,
          }),
        ];
      }, [] as SharedResultLine[]),
    };
  }

  /**
   * Obtain a draft result representing the hearing at the point it was last
   * shared. Notably, this contains the shared date on the respective shared
   * result lines, and is typically fetched when resetting the draft result upon
   * cancelling or rejecting amendments.
   *
   * @param hearingId the id of the hearing
   * @param hearingDay the YYYY-MM-DD date of the hearing
   * @param sharedResult the previously shared result
   * @returns an observable that emits a draft result representing the last
   * shared result lines
   */
  private mapSharedResultToDraftResult(
    hearingId: string,
    hearingDay: string,
    sharedResult: SharedResult,
    incrementResultsVersion = false
  ): Observable<DraftResult<ResolvedDraftResultLine>> {
    type Results = Pick<DraftResult<ExtendedResolvedDraftResultLine>, 'relations' | 'resultLines'>;

    const initialResults: Results = { resultLines: {}, relations: [] };
    // Because optional (uncompleted) results are not shared, they won't exist
    // if we rebuild the draft result solely from the shared result lines.
    // Therefore, as we build the shared result lines, we must keep track of any
    // optional results that do not have an associated shared result line.
    const optionalResults: TargetLike<{
      belongsToResultLineId: string;
      orderedDate: string;
      shortCode: string;
    }>[] = [];

    const mergeResults = (a: Results, b: Results) => {
      return {
        version: incrementResultsVersion ? sharedResult.version : sharedResult.version + 1,
        relations: [...a.relations, ...b.relations],
        resultLines: {
          ...a.resultLines,
          ...b.resultLines,
        },
      };
    };

    const createResultsForSharedResult = (
      sharedResultLines: SharedResultLine[]
    ): Observable<Results> => {
      const standaloneResultLines = sharedResultLines.filter(
        (sharedResultLine) =>
          !sharedResultLines.find(({ childResultLineIds = [] }) =>
            childResultLineIds.includes(sharedResultLine.resultLineId)
          )
      );

      if (standaloneResultLines.length > 0) {
        return forkJoin(
          standaloneResultLines.map((standaloneResultLine) =>
            createResultForSharedResultLine(standaloneResultLine, 'standalone')
          )
        ).pipe(
          map((childResults) =>
            childResults.reduce(
              (results, childResult) => mergeResults(results, childResult),
              initialResults
            )
          )
        );
      }
      return of(initialResults);
    };

    const createResultForSharedResultLine = (
      sharedResultLine: SharedResultLine,
      ruleType: DraftResultRelation['ruleType']
    ): Observable<Results> => {
      return this.notepadParserService.fetchParsedResultDefinition(sharedResultLine).pipe(
        switchMap(
          ({
            bailStatusCode,
            conditionalMandatory,
            childResultDefinitions = [],
            excludedFromResults,
            promptChoices,
          }) => {
            const {
              amendmentReason,
              amendmentDate,
              amendmentReasonId,
              autoPopulateBooleanResult,
              category,
              childResultLineIds = [],
              disabled,
              isDeleted,
              nonStandaloneAncillaryResult,
              orderedDate,
              resultLabel,
              resultLineId,
              resultDefinitionId,
              prompts,
              shortCode,
              level,
            } = sharedResultLine;

            // BE saves amendmentsLogs as a string..
            const amendmentsLog =
              !!sharedResultLine.amendmentsLog &&
              JSON.parse(sharedResultLine.amendmentsLog as string);

            // As a shared date is stored in YYYY-MM-DD format, and an amendment
            // date uses an ISO timestamp, the literal shared date is accurate
            // only to the nearest day. Consequently, where an amendment date is
            // later than a shared date on a shared result line, we treat this
            // as the effective shared date, so that we can be more accurate in
            // date comparisons.
            const sharedDate =
              'amendmentDate' in sharedResultLine &&
              moment(sharedResultLine.amendmentDate).isAfter(sharedResultLine.sharedDate)
                ? sharedResultLine.amendmentDate
                : sharedResultLine.sharedDate;

            const result: Results = {
              relations: [
                {
                  resultLineId,
                  ruleType,
                  childResultLineIds,
                },
              ],
              resultLines: {
                [resultLineId]: omitUndefined({
                  ...getForeignKeysForTarget(sharedResultLine),
                  amendmentsLog,
                  amendmentDate,
                  amendmentReason: amendmentReasonId
                    ? {
                        id: amendmentReasonId,
                        reasonDescription: amendmentReason,
                      }
                    : undefined,
                  autoPopulateBooleanResult,
                  bailStatusCode,
                  category,
                  childResultDefinitions,
                  conditionalMandatory,
                  deleted: isDeleted,
                  disabled,
                  excludedFromResults,
                  nonStandaloneAncillaryResult,
                  orderedDate,
                  originalText: shortCode,
                  resultLevel: level === 'CASE' ? 'C' : level === 'DEFENDANT' ? 'D' : 'O',
                  label: resultLabel,
                  promptChoices,
                  resultLineId,
                  resultDefinitionId,
                  sharedDate: new Date(sharedDate).toISOString(),
                  shortCode,
                  valid: true,
                  unresolvedParts: [],
                  resultPrompts: createDraftResultPromptsFromValueMap(
                    promptChoices,
                    prompts.reduce(
                      (valueMap, prompt) => ({
                        ...valueMap,
                        [prompt.promptRef]: prompt.value,
                      }),
                      {}
                    )
                  ),
                }),
              },
            };

            if (childResultDefinitions.length > 0) {
              const sharedChildResultLines = sharedResult.resultLines.filter((resultLine) =>
                childResultLineIds.includes(resultLine.resultLineId)
              );

              return forkJoin(
                childResultDefinitions.map((childResultDefinition) => {
                  // If this child result definition has a recognised child, then add it
                  const sharedChildResultLine = sharedChildResultLines.find(
                    (childResultLine) =>
                      childResultLine.resultDefinitionId === childResultDefinition.code
                  );

                  if (sharedChildResultLine) {
                    return createResultForSharedResultLine(
                      sharedChildResultLine,
                      childResultDefinition.ruleType
                    );
                  }
                  // Capture any optional child definitions for which a shared
                  // result line did not exist. These will need to be recreated
                  // on the draft result
                  if (childResultDefinition.ruleType === 'optional') {
                    optionalResults.push({
                      ...getForeignKeysForTarget(sharedResultLine),
                      belongsToResultLineId: sharedResultLine.resultLineId,
                      orderedDate: sharedResultLine.orderedDate,
                      shortCode: childResultDefinition.shortCode,
                    });
                  }
                  return of(initialResults);
                })
              ).pipe(map((childResults) => childResults.reduce(mergeResults, result)));
            }
            return of(result);
          }
        )
      );
    };

    return createResultsForSharedResult(sharedResult.resultLines).pipe(
      map(
        (results): DraftResult<ResolvedDraftResultLine> => ({
          ...results,
          hearingId,
          hearingDay,
          delegatedPowers: sharedResult.resultLines.some(
            (resultLine) => resultLine.delegatedPowers
          ),
          shadowListedOffenceIds: uniq(
            sharedResult.resultLines
              .filter((resultLine) => 'offenceId' in resultLine && resultLine.shadowListed)
              .map((resultLine) => (resultLine as { offenceId: string }).offenceId)
          ),
        })
      ),
      withLatestFrom(this.store),
      switchMap(([draftResult, state]) => {
        if (optionalResults.length > 0) {
          // Because the shared results are not returned in the order in which
          // they were shared, we sort the optional results according to the
          // position of the offence in the hearing. Note that this means the
          // optional results will always be attached to the first result line
          // which they could belong to.
          return new Observable<DraftResult<ResolvedDraftResultLine>>((subscriber) => {
            const hearing = getCurrentHearing(state);
            const userDetails = getUserDetails(state);
            const targets = getTargetsForHearing(hearing);
            const sortedOptionalResults = sortBy(optionalResults, (optionalResult) => {
              // If an offence has an applicationId (court application offence)
              // then it should always be last as displayed in "Enter results" page. Return -1
              // Anything else can be sorted as normal
              if (
                'applicationId' in optionalResult &&
                !!optionalResult.applicationId &&
                'offenceId' in optionalResult &&
                !!optionalResult.offenceId
              ) {
                return -1;
              }

              return 'offenceId' in optionalResult
                ? targets.findIndex((target) => target.id === optionalResult.offenceId)
                : -1;
            });

            let updatedDraftResult = draftResult;

            return from(sortedOptionalResults)
              .pipe(
                concatMap((optionalResult) =>
                  this.draftResultBuilderService
                    .addChildResultDefinition(updatedDraftResult, userDetails, optionalResult)
                    .pipe(
                      tap({
                        next: (value) => {
                          updatedDraftResult = value as DraftResult<ResolvedDraftResultLine>;
                        },
                      })
                    )
                )
              )
              .subscribe({
                error: (error) => subscriber.error(error),
                complete: () => {
                  subscriber.next(updatedDraftResult);
                  subscriber.complete();
                },
              });
          });
        }
        return of(draftResult);
      })
    );
  }

  // Compress the draft result for network transfer (up to 80% smaller payloads)
  // Relies upon https://tools.hmcts.net/jira/browse/CPI-694 being completed
  private wrapDraftResult(
    draftResult: DraftResult,
    isResetResults?: boolean
  ): DraftResult | CompressedDraftResultWithMetadata {
    const __metadata__ = { version: this.version };

    if (this.configService.compressionEnabled) {
      return {
        body: LZString.compress(JSON.stringify({ ...draftResult, isResetResults })),
        __metadata__,
      };
    }
    return { ...draftResult, isResetResults, __metadata__ };
  }

  // Where the draft result has been saved with a compressed body, decompress
  // the serialiazed body into the draft result, otherwise return the draft
  // result unchanged
  private unwrapDraftResult(
    abstractDraftResult: Legacy.DraftResult | CompressedDraftResultWithMetadata
  ): Legacy.DraftResult | DraftResultWithMetadata {
    if ('body' in abstractDraftResult) {
      const { body, ...other } = abstractDraftResult;

      return {
        ...JSON.parse(LZString.decompress(body)),
        ...other,
      };
    }
    return abstractDraftResult;
  }
}
