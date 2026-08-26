import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { forkJoin, from, merge, of } from 'rxjs';
import {
  catchError,
  concatMap,
  filter,
  map,
  mapTo,
  switchMap,
  tap,
  withLatestFrom,
  take
} from 'rxjs/operators';
import {
  getHearingLockStateByAmendmentReason,
  getCurrentHearingState,
  getDefendantsFromAllCases
} from '../../../core/selectors/hearing';
import { getCurrentHearing } from '../../../core';
import { DraftResultBuilderService } from '../services/draft-result-builder.service';
import { ReusableInfoService } from '../services/reusable-info.service';
import { ResultsService } from '../services/results.service';
import { ResultsValidationService } from '../services/results-validation.service';
import { buildResultsValidationRequest } from '../helpers/results-validation';
import { getUserDetails } from '@cpp/users-groups';
import { hasResultingAssistant } from '../../../core/selectors/user-groups';
import { DraftResultActions } from './draft-result.actions';
import { ResultsValidationActions } from './results-validation.actions';
import { ResultsState, getDraftResult } from './index';
import { InvalidResulLinesError } from '../../results.interfaces';
import { ManageHearingPublicEventError } from '../../../manage-hearing-error-page/manage-hearing-error-page.interfaces';
import { CommandError } from '@cpp/core';
import {
  LoadHearingDetailAction,
  MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
  HearingLockState,
  clearCurrentAmendmentReason
} from '../../../core';
import { ShareResultsActions } from './share-results.actions';

@Injectable({ providedIn: 'root' })
export class DraftResultEffects {
  constructor(
    private actions$: Actions,
    private draftResultBuilderService: DraftResultBuilderService,
    private resultService: ResultsService,
    private resultsValidationService: ResultsValidationService,
    private reusableInfoService: ReusableInfoService,
    private router: Router,
    private store: Store<ResultsState>
  ) {}

  private draftResult$ = this.store.pipe(select(getDraftResult));
  private userDetails$ = this.store.pipe(select(getUserDetails));
  private hearingLockState$ = this.store.pipe(select(getHearingLockStateByAmendmentReason));
  private hearingState$ = this.store.pipe(select(getCurrentHearingState));
  private hearing$ = this.store.pipe(select(getCurrentHearing));
  private defendants$ = this.store.pipe(select(getDefendantsFromAllCases));
  private hasResultingAssistant$ = this.store.pipe(select(hasResultingAssistant));

  // All actions that update the draft result are handled in a single-threaded
  // fashion. This is to account for situations where concurrent actions that
  // trigger asynchronous updates to the draft result would otherwise be
  // updating the draft result in parallel and so one update would always get
  // overwritten.
  draftResultEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        DraftResultActions.addChildToDraftResultLine,
        DraftResultActions.copyDraftResultLines,
        DraftResultActions.destroyDraftResultLine,
        DraftResultActions.destroyDraftResultLinePart,
        DraftResultActions.parseNotepadItems,
        DraftResultActions.replaceDraftResultLine,
        DraftResultActions.resolveDraftResultLinePart,
        DraftResultActions.setAmendmentReason,
        DraftResultActions.setDelegatedPowers,
        DraftResultActions.setConditionalMandatory,
        DraftResultActions.setShadowListedOffenceIds,
        DraftResultActions.updateResultPromptsForDraftResultLine
      ),
      withLatestFrom(this.hearingLockState$, this.draftResult$, this.hearingState$),
      switchMap(([action, hearingLockState, draftResult, currentHearingState]) =>
        hearingLockState && currentHearingState === HearingLockState.SHARED
          ? of(
              ShareResultsActions.lockHearingForAmendments({
                hearingId: draftResult.hearingId,
                nextState: hearingLockState
              })
            ).pipe(
              tap(lockAction => this.store.dispatch(lockAction)),
              switchMap(() =>
                this.actions$.pipe(
                  ofType(ShareResultsActions.lockHearingForAmendmentsSuccess),
                  take(1),
                  mapTo(action)
                )
              )
            )
          : of(action)
      ),
      concatMap(action => {
        const addChildResultLine$ = of(action).pipe(
          ofType(DraftResultActions.addChildToDraftResultLine),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ options }, draftResult, userDetails]) =>
            this.draftResultBuilderService.addChildResultDefinition(
              draftResult,
              userDetails,
              options
            )
          )
        );

        const copyDraftResultLines$ = of(action).pipe(
          ofType(DraftResultActions.copyDraftResultLines),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ copyTargets }, draftResult, userDetails]) =>
            this.draftResultBuilderService
              .copyResultLines(draftResult, userDetails, copyTargets)
              .pipe(
                tap(() => {
                  this.router.navigate(['/manage', draftResult.hearingId, 'enter-results']);
                })
              )
          )
        );

        const destroyResultLine$ = of(action).pipe(
          ofType(DraftResultActions.destroyDraftResultLine),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ resultLineId }, draftResult, userDetails]) =>
            this.draftResultBuilderService.destroyResultLine(draftResult, userDetails, resultLineId)
          )
        );

        const destroyResultLinePart$ = of(action).pipe(
          ofType(DraftResultActions.destroyDraftResultLinePart),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ resultLineId, partIndex }, draftResult, userDetails]) =>
            this.draftResultBuilderService.destroyPart(draftResult, userDetails, {
              resultLineId,
              partIndex
            })
          )
        );

        const parseNotepadItems$ = of(action).pipe(
          ofType(DraftResultActions.parseNotepadItems),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ items }, draftResult, userDetails]) =>
            this.draftResultBuilderService.parseResultDefinitions(draftResult, userDetails, items)
          )
        );

        const replaceResultLine$ = of(action).pipe(
          ofType(DraftResultActions.replaceDraftResultLine),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ options }, draftResult, userDetails]) =>
            this.draftResultBuilderService.replaceResultLine(draftResult, userDetails, options)
          )
        );

        const resolveDraftResultLinePart$ = of(action).pipe(
          ofType(DraftResultActions.resolveDraftResultLinePart),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ resultLineId, partIndex, choice }, draftResult, userDetails]) =>
            this.draftResultBuilderService.resolvePart(draftResult, userDetails, {
              resultLineId,
              partIndex,
              choice
            })
          )
        );

        const setConditionalMandatory$ = of(action).pipe(
          ofType(DraftResultActions.setConditionalMandatory),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(([{ resultLineId, selected }, draftResult, userDetails]) =>
            this.draftResultBuilderService.toggleConditionalMandatoryChild(
              draftResult,
              userDetails,
              {
                resultLineId,
                selected
              }
            )
          )
        );

        const setAmendmentReason$ = of(action).pipe(
          ofType(DraftResultActions.setAmendmentReason),
          withLatestFrom(this.draftResult$, this.userDetails$),
          switchMap(
            ([
              {
                amendmentDate,
                amendmentReason,
                resultLineId,
                childResultOptions,
                destroyResultLine
              },
              draftResult,
              userDetails
            ]) => {
              const updatedDraftResult = this.draftResultBuilderService.setAmendmentReason(
                draftResult,
                {
                  resultLineId,
                  amendmentReason,
                  amendmentDate,
                  userDetails
                }
              );
              // Merging the addChild and destroy actions with the setAmendmentReason action
              // we don't deal with race conditions that occurs since
              // the introduction of the versioning when saving the draftresult.

              // If addChildResultLine is provided, chain the addChild action, like this
              // saveDraftResult is not called twice when adding a child on a shared result line
              // if the hearing is not yet amended
              if (childResultOptions) {
                return this.draftResultBuilderService.addChildResultDefinition(
                  updatedDraftResult,
                  userDetails,
                  childResultOptions
                );
              }
              // If destroy flag is true, chain the destroy action, like this
              // saveDraftResult is not called twice when performing a deletion on a shared result line
              // if the hearing is not yet amended
              if (destroyResultLine) {
                return this.draftResultBuilderService.destroyResultLine(
                  updatedDraftResult,
                  userDetails,
                  resultLineId
                );
              }

              return of(updatedDraftResult);
            }
          )
        );

        const setDelegatedPowers$ = of(action).pipe(
          ofType(DraftResultActions.setDelegatedPowers),
          withLatestFrom(this.draftResult$, this.userDetails$),
          map(([{ delegatedPowers, amendmentReason, amendmentDate }, draftResult, userDetails]) =>
            this.draftResultBuilderService.setDelegatedPowers(draftResult, {
              delegatedPowers,
              amendmentReason,
              amendmentDate,
              userDetails
            })
          )
        );

        const setShadowListedOffenceIds$ = of(action).pipe(
          ofType(DraftResultActions.setShadowListedOffenceIds),
          withLatestFrom(this.draftResult$),
          map(([{ offenceIds }, draftResult]) =>
            this.draftResultBuilderService.setShadowListedOffenceIds(draftResult, offenceIds)
          )
        );

        const updateResultPrompts$ = of(action).pipe(
          ofType(DraftResultActions.updateResultPromptsForDraftResultLine),
          withLatestFrom(this.draftResult$),
          switchMap(([{ resultLineId, resultPrompts, redirectTo }, draftResult]) =>
            this.draftResultBuilderService
              .updateResultPrompts(draftResult, { resultLineId, resultPrompts })
              .pipe(
                tap(() => {
                  if (redirectTo) {
                    this.router.navigate(redirectTo);
                  }
                })
              )
          )
        );

        return merge(
          addChildResultLine$,
          copyDraftResultLines$,
          destroyResultLine$,
          destroyResultLinePart$,
          parseNotepadItems$,
          replaceResultLine$,
          resolveDraftResultLinePart$,
          setAmendmentReason$,
          setConditionalMandatory$,
          setDelegatedPowers$,
          setShadowListedOffenceIds$,
          updateResultPrompts$
        ).pipe(
          map(draftResult => DraftResultActions.saveDraftResult({ draftResult })),
          catchError((error: Error) => {
            if (error instanceof InvalidResulLinesError) {
              return of(
                DraftResultActions.setDraftResultLineErrors({
                  invalidResultLines: error.invalidResultLines
                })
              );
            }
            return of(DraftResultActions.setDraftResultError({ error: error.message, action }));
          })
        );
      })
    )
  );

  validate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ResultsValidationActions.validateResults),
      withLatestFrom(this.draftResult$, this.hearing$, this.defendants$),
      filter(([, draftResult]) => !!draftResult),
      switchMap(([action, draftResult, hearing, defendants]) => {
        const request = buildResultsValidationRequest(draftResult, hearing, defendants);
        return this.resultsValidationService.validate(request).pipe(
          tap(response => {
            if (action.navigateOnSuccess && response.isValid) {
              this.router.navigateByUrl(`/manage/${draftResult.hearingId}`, {
                state: { skipResultsValidation: action.skipResultsValidation }
              });
            }
          }),
          map(response => ResultsValidationActions.validateResultsSuccess({ response })),
          // We absorb any HTTP errors (4XX/5XX) and clear the validation results.
          // This is a requested team/business workaround DD-42483. Validation is advisory
          // and if the validator service is down, it should not prevent the user
          // from loading the hearing page or sharing results.
          catchError(() => {
            if (action.navigateOnSuccess) {
              this.router.navigateByUrl(`/manage/${draftResult.hearingId}`, {
                state: { skipResultsValidation: action.skipResultsValidation }
              });
            }
            return of(ResultsValidationActions.clearValidationResults());
          })
        );
      })
    )
  );

  validateOnDraftResultLoad$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DraftResultActions.setDraftResult),
      filter(({ draftResult }) => !!draftResult),
      withLatestFrom(this.hasResultingAssistant$),
      filter(([, enabled]) => enabled),
      map(() => ResultsValidationActions.validateResults({ navigateOnSuccess: false }))
    )
  );

  // Persist the draft result on a separate "thread" to the draft result actions
  // so that it's non-blocking
  saveDraftResult$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DraftResultActions.saveDraftResult),
      switchMap(action =>
        forkJoin([
          this.resultService.saveDraftResult(action.draftResult, action.isResetResults),
          this.reusableInfoService.cacheValuesFromDraftResult(action.draftResult)
        ]).pipe(
          mapTo(DraftResultActions.saveDraftResultSuccess({ draftResult: action.draftResult })),
          catchError((error: CommandError | Error) => {
            if (
              'originalEvent' in error &&
              error.originalEvent?._metadata?.name === MANAGE_RESULTS_FAILED_PUBLIC_EVENT
            ) {
              const manageHearingError = error.originalEvent as ManageHearingPublicEventError;
              return from([
                DraftResultActions.setManageHearingError({ manageHearingError }),
                DraftResultActions.setDraftResult({ draftResult: null }),
                clearCurrentAmendmentReason(),
                new LoadHearingDetailAction(action.draftResult.hearingId)
              ]).pipe(
                tap(() => {
                  this.router.navigate([
                    '/manage',
                    action.draftResult.hearingId,
                    'manage-hearing-error'
                  ]);
                })
              );
            }
            return of(
              DraftResultActions.setDraftResultError({ error: (error as Error).message, action })
            );
          })
        )
      )
    )
  );
}
