import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { getUserDetails } from '@cpp/users-groups';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { concat, forkJoin, from, merge, of, throwError } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mapTo,
  mergeMap,
  switchMap,
  take,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import {
  clearCurrentAmendmentReason,
  CompletedApiRequest,
  currentHearingIsBoxHearing,
  getCurrentHearing,
  getFirstSharedDate,
  getHearingStateDetails,
  HearingLockState,
  HearingService,
  LoadHearingDetailAction,
  LoadHearingDetailSuccessAction,
  MANAGE_RESULTS_FAILED_PUBLIC_EVENT,
  PendingApiRequest,
  RequestOptions,
  setHearingState
} from '../../../core';
import { ResultsService } from '../services/results.service';
import { ReusableInfoService } from '../services/reusable-info.service';
import { DraftResultActions } from './draft-result.actions';
import {
  getDraftResult,
  getDraftResultError,
  getDraftResultSaving,
  ResultsState,
  ShareResultsActions
} from './index';
import { DraftResultBuilderService } from '../services/draft-result-builder.service';
import { ManageHearingPublicEventError } from '../../../manage-hearing-error-page/manage-hearing-error-page.interfaces';
import { CommandError } from '@cpp/core';

const fakeRequestOptions = { url: 'results/share' } as RequestOptions;

@Injectable({ providedIn: 'root' })
export class ShareResultsEffects {
  constructor(
    private actions$: Actions,
    private draftResultBuilderService: DraftResultBuilderService,
    private hearingService: HearingService,
    private resultService: ResultsService,
    private reusableInfoService: ReusableInfoService,
    private router: Router,
    private store: Store<ResultsState>
  ) {}

  private draftResult$ = this.store.pipe(select(getDraftResult));
  approveAmendments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShareResultsActions.approveAmendments),
      withLatestFrom(this.draftResult$, this.store.pipe(select(getUserDetails))),
      switchMap(([action, draftResult, userDetails]) =>
        this.resultService.approveAmendments(draftResult, userDetails.userId).pipe(
          switchMap(() =>
            forkJoin([
              this.hearingService.getHearing(draftResult.hearingId),
              of(this.draftResultBuilderService.setValidationDetails(draftResult, userDetails))
            ])
          ),
          switchMap(([hearing, validatedDraftResult]) => [
            new LoadHearingDetailSuccessAction(hearing),
            DraftResultActions.saveDraftResult({ draftResult: validatedDraftResult })
          ]),
          catchError((error: CommandError) =>
            of(ShareResultsActions.setShareDraftResultError({ error, action }))
          )
        )
      )
    )
  );

  cancelAmendments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShareResultsActions.cancelAmendments),
      withLatestFrom(
        this.draftResult$,
        this.store.pipe(select(currentHearingIsBoxHearing)),
        this.store.pipe(select(getFirstSharedDate))
      ),
      switchMap(([action, draftResult, isBoxwork, firstSharedDate]) =>
        this.resultService.cancelAmendments(draftResult).pipe(
          switchMap(() =>
            forkJoin([
              this.hearingService.getHearing(draftResult.hearingId),
              this.resultService.fetchSharedResult(
                draftResult.hearingId,
                draftResult.hearingDay,
                isBoxwork,
                firstSharedDate
              )
            ])
          ),
          switchMap(([hearing, draftResult]) => [
            clearCurrentAmendmentReason(),
            new LoadHearingDetailSuccessAction(hearing),
            DraftResultActions.saveDraftResult({ draftResult, isResetResults: true })
          ]),
          catchError((error: CommandError) =>
            of(ShareResultsActions.setShareDraftResultError({ error, action }))
          )
        )
      )
    )
  );

  lockForAmendments$ = createEffect(() =>
    // lock a hearing for amendments based on either an explicit action, or as
    // a consequence of the draft result being persisted with a pending
    // amendment
    this.actions$.pipe(
      ofType(ShareResultsActions.lockHearingForAmendments),
      withLatestFrom(this.store.pipe(select(getHearingStateDetails))),
      filter(
        ([action, details]) =>
          action.nextState &&
          action.nextState !== details.hearingState &&
          details.hearingState !== HearingLockState.VALIDATED
      ),
      withLatestFrom(this.store.pipe(select(getUserDetails))),
      switchMap(([[action], userDetails]) =>
        merge(
          // Immediately update the hearing state and amendedByUser locally so
          // that the user can continue without waiting for an api call
          of(setHearingState({ hearingState: action.nextState, amendedByUser: userDetails })),
          // In the background, update the hearing with the lock state of
          // hearing according to the latest amendment
          this.resultService.lockHearingForAmendments(action.hearingId, action.nextState).pipe(
            mapTo(ShareResultsActions.lockHearingForAmendmentsSuccess()),
            catchError((error: CommandError) =>
              of(ShareResultsActions.setShareDraftResultError({ error, action }))
            )
          )
        )
      )
    )
  );

  rejectAmendments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShareResultsActions.rejectAmendments),
      withLatestFrom(
        this.draftResult$,
        this.store.pipe(select(getUserDetails)),
        this.store.pipe(select(currentHearingIsBoxHearing)),
        this.store.pipe(select(getFirstSharedDate))
      ),
      switchMap(([action, draftResult, userDetails, isBoxWork, firstSharedDate]) =>
        this.resultService.rejectAmendments(draftResult, userDetails.userId).pipe(
          switchMap(() =>
            forkJoin([
              this.hearingService.getHearing(draftResult.hearingId),
              this.resultService.fetchSharedResult(
                draftResult.hearingId,
                draftResult.hearingDay,
                isBoxWork,
                firstSharedDate
              )
            ])
          ),
          switchMap(([hearing, draftResult]) => [
            clearCurrentAmendmentReason(),
            new LoadHearingDetailSuccessAction(hearing),
            DraftResultActions.saveDraftResult({ draftResult, isResetResults: true })
          ]),
          catchError((error: CommandError) =>
            of(ShareResultsActions.setShareDraftResultError({ error, action }))
          )
        )
      )
    )
  );

  // Actions that trigger the sharing of a draft result should wait until any
  // in-flight requests to saving the draft result are resolved to avoid race
  // conditions between this in-flight request and a share action that updates
  // the draft result remotely
  shareEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ShareResultsActions.requestApprovalForAmendments,
        ShareResultsActions.shareDraftResult
      ),
      switchMap(action => {
        const requestApprovalForAmendments$ = of(action).pipe(
          ofType(ShareResultsActions.requestApprovalForAmendments),
          withLatestFrom(this.draftResult$),
          switchMap(([_, draftResult]) =>
            this.resultService.requestApprovalForAmendments(draftResult).pipe(
              switchMap(() => this.hearingService.getHearing(draftResult.hearingId)),
              map(hearing => new LoadHearingDetailSuccessAction(hearing))
            )
          )
        );

        const shareResult$ = of(action).pipe(
          ofType(ShareResultsActions.shareDraftResult),
          withLatestFrom(
            this.draftResult$,
            this.store.pipe(select(getUserDetails)),
            this.store.pipe(select(currentHearingIsBoxHearing)),
            this.store.pipe(select(getFirstSharedDate))
          ),
          switchMap(([_, draftResult, userDetails, isBoxWork, firstSharedDate]) =>
            forkJoin([
              this.resultService.shareDraftResult(
                draftResult,
                userDetails,
                isBoxWork,
                firstSharedDate
              ),
              this.reusableInfoService
                .cacheValuesFromSharedResult(draftResult)
                .pipe(catchError(() => of(null)))
            ]).pipe(
              withLatestFrom(this.store),
              switchMap(([[sharedDraftResult], state]) => [
                DraftResultActions.setDraftResult({ draftResult: sharedDraftResult }),
                new LoadHearingDetailSuccessAction({
                  hearing: getCurrentHearing(state),
                  hearingState: HearingLockState.SHARED,
                  amendedByUserId: null
                })
              ])
            )
          )
        );

        return concat(
          of(new PendingApiRequest(fakeRequestOptions)),
          this.store.pipe(
            select(getDraftResultSaving),
            filter(draftResultSaving => !draftResultSaving),
            take(1),
            withLatestFrom(this.store.pipe(select(getDraftResultError))),
            switchMap(([_, draftResultError]) =>
              draftResultError
                ? throwError(new Error(draftResultError.error))
                : merge(requestApprovalForAmendments$, shareResult$)
            ),
            catchError((error: CommandError | Error) => {
              if (error instanceof Error) {
                return of(
                  ShareResultsActions.setShareDraftResultError({ error: error.message, action })
                );
              }
              return of(ShareResultsActions.setShareDraftResultError({ error, action }));
            })
          ),
          of(new CompletedApiRequest(fakeRequestOptions))
        );
      })
    )
  );

  shareDraftResultWithWelshTranslate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShareResultsActions.shareDraftResultWithWelshTranslate),
      withLatestFrom(this.draftResult$),
      switchMap(([action, { hearingId }]) => {
        const { payload } = action;

        return this.resultService.setWelshDefendantTranslate({ hearingId, payload }).pipe(
          mapTo(ShareResultsActions.shareDraftResult()),
          catchError((error: CommandError) =>
            of(ShareResultsActions.setShareDraftResultError({ error, action }))
          )
        );
      })
    )
  );

  unlockHearing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShareResultsActions.unlockHearing),
      withLatestFrom(
        this.store.pipe(select(getDraftResult)),
        this.store.pipe(select(currentHearingIsBoxHearing)),
        this.store.pipe(select(getFirstSharedDate))
      ),
      switchMap(([action, { hearingId, hearingDay }, isBoxwork, firstSharedDate]) =>
        this.hearingService.unlockHearing(hearingId, hearingDay).pipe(
          switchMap(() =>
            forkJoin([
              this.hearingService.getHearing(hearingId),
              this.resultService.fetchSharedResult(
                hearingId,
                hearingDay,
                isBoxwork,
                firstSharedDate
              )
            ])
          ),
          switchMap(([hearing, draftResult]) => [
            clearCurrentAmendmentReason(),
            new LoadHearingDetailSuccessAction(hearing),
            DraftResultActions.saveDraftResult({ draftResult, isResetResults: true })
          ]),
          catchError((error: CommandError) =>
            of(ShareResultsActions.setShareDraftResultError({ error, action }))
          )
        )
      )
    )
  );

  onError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShareResultsActions.setShareDraftResultError),
      // Clear the draft result in the state to prevent users from hitting the
      // browser back button and attempting to resubmit
      mergeMap(({ error }: { error: CommandError | String }) => {
        if (
          typeof error === 'object' &&
          'originalEvent' in error &&
          error.originalEvent._metadata?.name === MANAGE_RESULTS_FAILED_PUBLIC_EVENT
        ) {
          const manageHearingError = error.originalEvent as ManageHearingPublicEventError;
          const { hearingId } = manageHearingError;

          return from([
            DraftResultActions.setManageHearingError({ manageHearingError }),
            DraftResultActions.setDraftResult({ draftResult: null }),
            clearCurrentAmendmentReason(),
            new LoadHearingDetailAction(hearingId)
          ]).pipe(
            tap(() => {
              this.router.navigate(['/manage', hearingId, 'manage-hearing-error']);
            })
          );
        }
        return of(null).pipe(
          switchMap(() => this.router.navigate(['/technical-error'])),
          mapTo(DraftResultActions.setDraftResult({ draftResult: null }))
        );
      })
    )
  );
}
