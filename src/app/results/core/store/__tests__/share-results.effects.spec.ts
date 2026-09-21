import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CommandError, CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { UserDetails, UsersGroupsActions } from '@cpp/users-groups';
import { Actions } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, Store, provideStore, provideState } from '@ngrx/store';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of, throwError } from 'rxjs';
import {
  AppState,
  clearCurrentAmendmentReason,
  CompletedApiRequest,
  HearingDetail,
  HearingDetailResponse,
  HearingLockState,
  HearingService,
  LoadHearingDetailSuccessAction,
  PendingApiRequest,
  reducers,
  RequestOptions,
  setHearingState,
  WelshDefendantTranslate,
  ListingService
} from '../../../../core';
import { DraftResult, DraftResultPrompt } from '../../../results.interfaces';
import { ResultsService } from '../../services/results.service';
import { ReusableInfoService } from '../../services/reusable-info.service';
import { ProvisionalBookingService } from '../../../hearing-details/allocation/services/provisionalBooking.service';
import { createDraftResult } from '../../testing';
import { DraftResultActions } from '../draft-result.actions';
import { resultsReducer } from '../index';
import { ShareResultsActions } from '../share-results.actions';
import { ShareResultsEffects } from '../share-results.effects';
import { DraftResultBuilderService } from '../../services/draft-result-builder.service';

jest.mock('../../services/draft-result-builder.service');
jest.mock('../../services/results.service');
jest.mock('../../services/reusable-info.service');

describe('ShareResultEffects', () => {
  let actions$: Observable<Action>;
  let effects: ShareResultsEffects;
  let draftResultBuilderService: DraftResultBuilderService;
  let hearingService: HearingService;
  let provisionalBookingService: ProvisionalBookingService;
  let listingService: ListingService;
  let resultsService: ResultsService;
  let reusableInfoService: ReusableInfoService;
  let router: Router;
  let store: Store<ResultsService>;

  const hearing = { id: 'hearingId', isBoxHearing: false } as HearingDetail;
  const draftResult = createDraftResult({ hearingId: 'hearingId', hearingDay: '2020-01-01' });
  const userDetails = { userId: 'userId' } as UserDetails;
  const saveDraftResult = DraftResultActions.saveDraftResult({ draftResult });
  const saveDraftResultSuccess = DraftResultActions.saveDraftResultSuccess({ draftResult });
  const saveDraftResultError = DraftResultActions.setDraftResultError({
    error: 'Error!',
    action: saveDraftResult
  });
  const startFakeApiRequest = new PendingApiRequest({ url: 'results/share' } as RequestOptions);
  const endFakeApiRequest = new CompletedApiRequest({ url: 'results/share' } as RequestOptions);
  const manageHearingErrorNotification: CommandError = {
    status: -1,
    originalEvent: {
      _metadata: {
        id: 'public.hearing.manage-results-failed',
        name: 'public.hearing.manage-results-failed'
      }
    },
    data: {
      hearingId: 'hearingId',
      hearingDay: '2020-01-01'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, {
          initialState: {
            hearings: {
              current: { hearing, hearingState: null }
            }
          } as AppState,
          runtimeChecks: {}
        }),
        provideRouter([]),
        provideState('results', resultsReducer, {
          initialState: {
            draftResult
          }
        }),
        provideCppCoreHttpServices(),
        CppHttp,
        {
          provide: DraftResultBuilderService,
          useValue: {
            setValidationDetails: jest.fn()
          }
        },
        HearingService,
        {
          provide: ProvisionalBookingService,
          useValue: {
            releaseProvisionalHearingSlots: jest.fn(() => of(undefined))
          }
        },
        {
          provide: ListingService,
          useValue: {
            // Default: every id asked about is still an unconfirmed hold, so the sweep may
            // release it. Tests covering a CONFIRMED booking override this per-test.
            getBookingStatus: jest.fn((bookingIds: string[]) =>
              of({
                bookings: bookingIds.map(bookingId => ({
                  bookingId,
                  safeToShare: true,
                  status: 'RESERVED'
                }))
              })
            )
          }
        },
        ResultsService,
        ReusableInfoService,
        {
          provide: Router,
          useValue: {
            navigate: jest.fn()
          }
        },
        ShareResultsEffects,
        provideMockActions(() => actions$)
      ],
      teardown: { destroyAfterEach: false }
    });

    TestBed.inject(Store).dispatch(UsersGroupsActions.setUserDetails({ userDetails }));

    actions$ = TestBed.inject(Actions);
    effects = TestBed.inject(ShareResultsEffects);
    hearingService = TestBed.inject(HearingService);
    provisionalBookingService = TestBed.inject(ProvisionalBookingService);
    listingService = TestBed.inject(ListingService);
    resultsService = TestBed.inject(ResultsService);
    reusableInfoService = TestBed.inject(ReusableInfoService);
    draftResultBuilderService = TestBed.inject(DraftResultBuilderService);
    router = TestBed.inject(Router);
    store = TestBed.inject(Store);
  });

  describe('ShareResultsActions.approveAmendments', () => {
    const requestAction = ShareResultsActions.approveAmendments();

    it('should approve an amendment to the shared results', () => {
      const updatedHearing = { hearingState: HearingLockState.SHARED } as HearingDetailResponse;

      actions$ = hot('        -a------', { a: requestAction });
      const response$ = cold(' -(r|)  ', { r: draftResult });
      const hearing$ = cold('   --(r|)', { r: updatedHearing });
      const expected$ = cold('    ----(hd)', {
        d: DraftResultActions.saveDraftResult({ draftResult }),
        h: new LoadHearingDetailSuccessAction(updatedHearing)
      });
      hearingService.getHearing = jest.fn(() => hearing$);
      resultsService.approveAmendments = jest.fn(() => response$);
      draftResultBuilderService.setValidationDetails = jest.fn(() => {
        return {
          hearingDay: '2020-01-01',
          hearingId: 'hearingId',
          relations: [] as any[],
          resultLines: {},
          shadowListedOffenceIds: [] as any[],
          version: 1
        };
      }) as jest.Mock;

      expect(effects.approveAmendments$).toBeObservable(expected$);
      expect(resultsService.approveAmendments).toHaveBeenCalledWith(draftResult, 'userId');
      expect(hearingService.getHearing).toHaveBeenCalledWith('hearingId');
    });

    it('should handle an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: manageHearingErrorNotification
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, manageHearingErrorNotification);
      const expected$ = cold('--b---', { b: errorAction });
      resultsService.approveAmendments = jest.fn(() => response$);

      expect(effects.approveAmendments$).toBeObservable(expected$);
    });
  });

  describe('ShareResultsActions.cancelAmendments', () => {
    const requestAction = ShareResultsActions.cancelAmendments();

    it('should unlock a draft result for amendments', () => {
      const updatedHearing = {} as HearingDetailResponse;

      actions$ = hot('            -a-------', { a: requestAction });
      const cancel$ = cold('       --(r|)  ');
      const hearing$ = cold('        --(r|)', { r: updatedHearing });
      const sharedResult$ = cold('   -(r|) ', { r: draftResult });
      const expected$ = cold('    -----(chd)', {
        c: clearCurrentAmendmentReason(),
        d: DraftResultActions.saveDraftResult({ draftResult, isResetResults: true }),
        h: new LoadHearingDetailSuccessAction(updatedHearing)
      });

      hearingService.getHearing = jest.fn(() => hearing$);
      resultsService.cancelAmendments = jest.fn(() => cancel$);
      resultsService.fetchSharedResult = jest.fn(() => sharedResult$);

      expect(effects.cancelAmendments$).toBeObservable(expected$);
      expect(hearingService.getHearing).toHaveBeenCalledWith('hearingId');
      expect(resultsService.cancelAmendments).toHaveBeenCalledWith(draftResult);
      expect(resultsService.fetchSharedResult).toHaveBeenCalledWith(
        'hearingId',
        '2020-01-01',
        false,
        undefined
      );
    });

    it('should handle an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: manageHearingErrorNotification
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, manageHearingErrorNotification);
      const expected$ = cold('--b---', { b: errorAction });
      resultsService.cancelAmendments = jest.fn(() => response$);

      expect(effects.cancelAmendments$).toBeObservable(expected$);
    });
  });

  describe('ShareResultsActions.lockHearingForAmendments', () => {
    const requestAction = ShareResultsActions.lockHearingForAmendments({
      hearingId: 'hearingId',
      nextState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
    });

    it('should lock a draft result for amendments', () => {
      const hearingLockStateAction = setHearingState({
        amendedByUser: userDetails,
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
      });

      actions$ = hot('          -a------', { a: requestAction });
      const amendments$ = cold(' ---(r|)');
      const expected$ = cold('  -b--c---', {
        b: hearingLockStateAction,
        c: ShareResultsActions.lockHearingForAmendmentsSuccess()
      });

      resultsService.lockHearingForAmendments = jest.fn(() => amendments$);

      expect(effects.lockForAmendments$).toBeObservable(expected$);
      expect(resultsService.lockHearingForAmendments).toHaveBeenCalledWith(
        'hearingId',
        HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
      );
    });

    it('should lock the hearing for user error amendments', () => {
      const userErrorAction = ShareResultsActions.lockHearingForAmendments({
        hearingId: 'hearingId',
        nextState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
      });
      const hearingLockStateAction = setHearingState({
        amendedByUser: userDetails,
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
      });

      actions$ = hot('          -a------', { a: userErrorAction });
      const amendments$ = cold(' ---(r|)');
      const expected$ = cold('  -b--c---', {
        b: hearingLockStateAction,
        c: ShareResultsActions.lockHearingForAmendmentsSuccess()
      });

      resultsService.lockHearingForAmendments = jest.fn(() => amendments$);

      expect(effects.lockForAmendments$).toBeObservable(expected$);
      expect(resultsService.lockHearingForAmendments).toHaveBeenCalledWith(
        'hearingId',
        HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
      );
    });

    it('should do nothing when attempting to lock a hearing to its existing state', () => {
      store.dispatch(
        new LoadHearingDetailSuccessAction({
          hearing: {},
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
        } as HearingDetailResponse)
      );
      actions$ = hot('        -a-', { a: requestAction });
      const expected$ = cold('---');

      expect(effects.lockForAmendments$).toBeObservable(expected$);
    });

    it('should handle an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: manageHearingErrorNotification
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, manageHearingErrorNotification);
      const expected$ = cold('-bc---', {
        b: setHearingState({
          amendedByUser: userDetails,
          hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
        }),
        c: errorAction
      });
      resultsService.lockHearingForAmendments = jest.fn(() => response$);

      expect(effects.lockForAmendments$).toBeObservable(expected$);
    });
  });

  describe('ShareResultsActions.rejectAmendments', () => {
    const requestAction = ShareResultsActions.rejectAmendments();

    it('should reject the amendments to a shared result', () => {
      const updatedHearing = { hearingState: HearingLockState.SHARED } as HearingDetailResponse;
      const successAction = new LoadHearingDetailSuccessAction(updatedHearing);
      const sharedResult = {} as DraftResult;
      const saveDraftResultAction = DraftResultActions.saveDraftResult({
        draftResult: sharedResult,
        isResetResults: true
      });

      actions$ = hot('        -a------', { a: requestAction });
      const response$ = cold(' -(r|)  ', { r: draftResult });
      const hearing$ = cold('   --(r|)', { r: updatedHearing });
      const results$ = cold('   -(r|) ', { r: sharedResult });
      const expected$ = cold('----(abc)', {
        a: clearCurrentAmendmentReason(),
        b: successAction,
        c: saveDraftResultAction
      });

      hearingService.getHearing = jest.fn(() => hearing$);
      resultsService.fetchSharedResult = jest.fn(() => results$);
      resultsService.rejectAmendments = jest.fn(() => response$);

      expect(effects.rejectAmendments$).toBeObservable(expected$);
      expect(hearingService.getHearing).toHaveBeenCalledWith('hearingId');
      expect(resultsService.rejectAmendments).toHaveBeenCalledWith(draftResult, 'userId');
    });

    it('should handle an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: manageHearingErrorNotification
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, manageHearingErrorNotification);
      const expected$ = cold('--b---', { b: errorAction });
      resultsService.rejectAmendments = jest.fn(() => response$);

      expect(effects.rejectAmendments$).toBeObservable(expected$);
    });
  });

  describe('ShareResultsActions.requestApprovalForAmendments', () => {
    const requestAction = ShareResultsActions.requestApprovalForAmendments();

    it('should request approval for amendments made to a shared result', () => {
      const updatedHearing = { hearingState: HearingLockState.SHARED } as HearingDetailResponse;
      const successAction = new LoadHearingDetailSuccessAction(updatedHearing);

      actions$ = hot('        -a------', { a: requestAction });
      const response$ = cold(' -(r|)  ', { r: draftResult });
      const hearing$ = cold('   --(r|)', { r: updatedHearing });
      const expected$ = cold('-b--(cd)', {
        b: startFakeApiRequest,
        c: successAction,
        d: endFakeApiRequest
      });

      resultsService.requestApprovalForAmendments = jest.fn(() => response$);
      hearingService.getHearing = jest.fn(() => hearing$);

      expect(effects.shareEvents$).toBeObservable(expected$);
      expect(hearingService.getHearing).toHaveBeenCalledWith('hearingId');
      expect(resultsService.requestApprovalForAmendments).toHaveBeenCalledWith(draftResult);
    });

    it('should delay requesting approval while the draft result is saving', () => {
      const updatedHearing = { hearingState: HearingLockState.SHARED } as HearingDetailResponse;
      const successAction = new LoadHearingDetailSuccessAction(updatedHearing);
      const actions = {
        a: saveDraftResult,
        b: requestAction,
        c: saveDraftResultSuccess,
        d: startFakeApiRequest,
        e: successAction,
        f: endFakeApiRequest
      };

      actions$ = hot('        ab-c------', actions);
      const response$ = cold('   -(r|)  ', { r: draftResult });
      const hearing$ = cold('     --(r|)', { r: updatedHearing });
      const expected$ = cold('-d----(ef)', actions);

      actions$.subscribe(store);

      resultsService.requestApprovalForAmendments = jest.fn(() => response$);
      hearingService.getHearing = jest.fn(() => hearing$);

      expect(effects.shareEvents$).toBeObservable(expected$);
    });

    it('should revert to an error action when the draft result failed to share', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: 'Error!'
      });
      const actions = {
        a: saveDraftResult,
        b: requestAction,
        c: saveDraftResultError,
        d: startFakeApiRequest,
        e: errorAction,
        f: endFakeApiRequest
      };

      actions$ = hot('        ab-c---', actions);
      const expected$ = cold('-d-(ef)', actions);

      actions$.subscribe(store);

      expect(effects.shareEvents$).toBeObservable(expected$);
    });

    it('should handle an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: manageHearingErrorNotification
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, manageHearingErrorNotification);
      const expected$ = cold('-b(cd)', {
        b: startFakeApiRequest,
        c: errorAction,
        d: endFakeApiRequest
      });
      resultsService.requestApprovalForAmendments = jest.fn(() => response$);

      expect(effects.shareEvents$).toBeObservable(expected$);
    });
  });

  describe('ShareResultsActions.shareDraftResult', () => {
    const requestAction = ShareResultsActions.shareDraftResult();
    const successAction = new LoadHearingDetailSuccessAction({
      hearing,
      hearingState: HearingLockState.SHARED,
      amendedByUserId: null
    });

    it('should share a draft result', () => {
      actions$ = hot('            -a------', { a: requestAction });
      const response$ = cold('     -(r|)  ', { r: draftResult });
      const reusableInfo$ = cold(' ---(r|)');
      const expected$ = cold('    -b--(cde)', {
        b: startFakeApiRequest,
        c: DraftResultActions.setDraftResult({ draftResult }),
        d: successAction,
        e: endFakeApiRequest
      });

      resultsService.shareDraftResult = jest.fn(() => response$);
      reusableInfoService.cacheValuesFromSharedResult = jest.fn(() => reusableInfo$);

      expect(effects.shareEvents$).toBeObservable(expected$);
      expect(reusableInfoService.cacheValuesFromSharedResult).toHaveBeenCalledWith(draftResult);
      expect(resultsService.shareDraftResult).toHaveBeenCalledWith(
        draftResult,
        {
          userId: 'userId'
        },
        false,
        undefined
      );
    });

    it('should delay sharing the results while the draft result is saving', () => {
      const actions = {
        a: saveDraftResult,
        b: requestAction,
        c: saveDraftResultSuccess,
        d: startFakeApiRequest,
        e: DraftResultActions.setDraftResult({ draftResult }),
        f: successAction,
        g: endFakeApiRequest
      };

      actions$ = hot('        ab--c------', actions);
      const response$ = cold('    -(r|)  ', { r: draftResult });
      const reusableInfo$ = cold('--(r|) ');
      const expected$ = cold('-d----(efg)', actions);

      actions$.subscribe(store);

      resultsService.shareDraftResult = jest.fn(() => response$);
      reusableInfoService.cacheValuesFromSharedResult = jest.fn(() => reusableInfo$);

      expect(effects.shareEvents$).toBeObservable(expected$);
    });

    it('should revert to an error action when the draft result failed to share', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: 'Error!'
      });
      const actions = {
        a: saveDraftResult,
        b: requestAction,
        c: saveDraftResultError,
        d: startFakeApiRequest,
        e: errorAction,
        f: endFakeApiRequest
      };

      actions$ = hot('        ab-c---', actions);
      const expected$ = cold('-d-(ef)', actions);

      actions$.subscribe(store);

      expect(effects.shareEvents$).toBeObservable(expected$);
    });

    it('should handle an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: manageHearingErrorNotification
      });

      actions$ = hot('            -a----', { a: requestAction });
      const response$ = cold('     -#   ', undefined, manageHearingErrorNotification);
      const reusableInfo$ = cold(' -----');
      const expected$ = cold('    -b(cd)', {
        b: startFakeApiRequest,
        c: errorAction,
        d: endFakeApiRequest
      });
      resultsService.shareDraftResult = jest.fn(() => response$);
      reusableInfoService.cacheValuesFromSharedResult = jest.fn(() => reusableInfo$);

      expect(effects.shareEvents$).toBeObservable(expected$);
    });

    it('should handle an error with reusable info', () => {
      actions$ = hot('            -a-------', { a: requestAction });
      const response$ = cold('     --(r|)--', { r: draftResult });
      const reusableInfo$ = cold(' ---#    ');
      const expected$ = cold('    -b--(cde)', {
        b: startFakeApiRequest,
        c: DraftResultActions.setDraftResult({ draftResult }),
        d: successAction,
        e: endFakeApiRequest
      });

      resultsService.shareDraftResult = jest.fn(() => response$);
      reusableInfoService.cacheValuesFromSharedResult = jest.fn(() => reusableInfo$);

      expect(effects.shareEvents$).toBeObservable(expected$);
    });
  });

  describe('ShareResultsActions.shareDraftResultWithWelshTranslate', () => {
    const payload: WelshDefendantTranslate[] = [
      { welshTranslation: true, defendantId: 'defendant-id-1' }
    ];
    const requestAction = ShareResultsActions.shareDraftResultWithWelshTranslate({ payload });

    it('should send welsh language required defendants', () => {
      const successAction = ShareResultsActions.shareDraftResult();

      actions$ = hot('        -a------', { a: requestAction });
      const response$ = cold(' --(r|)  ', { r: null });
      const expected$ = cold('---b---', { b: successAction });

      resultsService.setWelshDefendantTranslate = jest.fn(() => response$);

      expect(effects.shareDraftResultWithWelshTranslate$).toBeObservable(expected$);
      expect(resultsService.setWelshDefendantTranslate).toHaveBeenCalledWith({
        hearingId: draftResult.hearingId,
        payload
      });
    });

    it('should handle an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: requestAction,
        error: manageHearingErrorNotification
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, manageHearingErrorNotification);
      const expected$ = cold('--b---', { b: errorAction });
      resultsService.setWelshDefendantTranslate = jest.fn(() => response$);

      expect(effects.shareDraftResultWithWelshTranslate$).toBeObservable(expected$);
    });
  });

  describe('ShareResultsActions.error', () => {
    it('should redirect to the technical error page when a share effect yields an error', () => {
      const errorAction = ShareResultsActions.setShareDraftResultError({
        action: ShareResultsActions.shareDraftResult(),
        error: 'Error!'
      });

      actions$ = hot('        -a----', { a: errorAction });
      const redirect$ = cold(' -(r|)');
      const expected$ = cold('--b---', {
        b: DraftResultActions.setDraftResult({ draftResult: null })
      });

      router.navigate = jest.fn(() => redirect$) as jest.Mock;

      expect(effects.onError$).toBeObservable(expected$);
      expect(router.navigate).toHaveBeenCalledWith(['/technical-error']);
    });
  });

  describe('releaseAbandonedProvisionalBookings$', () => {
    const bookingReferencePrompt = (value: string): DraftResultPrompt => ({
      type: 'HIDDEN',
      promptId: 'booking-prompt-id',
      promptRef: 'bookingReference',
      label: 'Booking reference',
      value
    });

    const existingHearingIdPrompt = (value: string): DraftResultPrompt => ({
      type: 'HIDDEN',
      promptId: 'existing-hearing-prompt-id',
      promptRef: 'existingHearingId',
      label: 'Existing hearing id',
      value
    });

    const draftResultWithLines = (
      resultLines: Record<string, { resultPrompts: DraftResultPrompt[]; sharedDate?: string }>
    ): DraftResult =>
      ({
        ...draftResult,
        resultLines
      } as unknown as DraftResult);

    const seedDraftResult = (nextDraftResult: DraftResult) => {
      store.dispatch(DraftResultActions.setDraftResult({ draftResult: nextDraftResult }));
    };

    it('releases every bookingReference on the draft result being discarded, excluding related-hearings lines', () => {
      seedDraftResult(
        draftResultWithLines({
          'line-1': { resultPrompts: [bookingReferencePrompt('booking-1')] },
          'line-2': {
            resultPrompts: [
              bookingReferencePrompt('court-schedule-1'),
              existingHearingIdPrompt('existing-hearing-id')
            ]
          },
          'line-3': { resultPrompts: [] }
        })
      );
      const release$ = cold('-(r|)', { r: undefined });
      provisionalBookingService.releaseProvisionalHearingSlots = jest.fn(() => release$);

      actions$ = hot('-a--', { a: ShareResultsActions.cancelAmendments() });
      const expected$ = cold('--r', { r: undefined });

      expect(effects.releaseAbandonedProvisionalBookings$).toBeObservable(expected$);
      expect(provisionalBookingService.releaseProvisionalHearingSlots).toHaveBeenCalledTimes(1);
      expect(provisionalBookingService.releaseProvisionalHearingSlots).toHaveBeenCalledWith({
        hearingId: draftResult.hearingId,
        bookingId: 'booking-1'
      });
    });

    // Discarding local edits is not a share, so a CONFIRMED booking must survive it untouched -
    // only a share may change one. An unconfirmed hold on the same draft is still given back.
    it('releases only the unconfirmed holds, leaving confirmed bookings alone', () => {
      seedDraftResult(
        draftResultWithLines({
          'line-1': { resultPrompts: [bookingReferencePrompt('booking-confirmed')] },
          'line-2': { resultPrompts: [bookingReferencePrompt('booking-held')] }
        })
      );
      listingService.getBookingStatus = jest.fn(() =>
        of({
          bookings: [
            { bookingId: 'booking-confirmed', safeToShare: true, status: 'SHARED' },
            { bookingId: 'booking-held', safeToShare: true, status: 'RESERVED' }
          ]
        })
      );
      const release$ = cold('-(r|)', { r: undefined });
      provisionalBookingService.releaseProvisionalHearingSlots = jest.fn(() => release$);

      actions$ = hot('-a--', { a: ShareResultsActions.cancelAmendments() });
      const expected$ = cold('--r', { r: undefined });

      expect(effects.releaseAbandonedProvisionalBookings$).toBeObservable(expected$);
      expect(provisionalBookingService.releaseProvisionalHearingSlots).toHaveBeenCalledTimes(1);
      expect(provisionalBookingService.releaseProvisionalHearingSlots).toHaveBeenCalledWith({
        hearingId: draftResult.hearingId,
        bookingId: 'booking-held'
      });
    });

    // A SHARED line can still hold an unconfirmed booking - a re-pick during the amendment
    // reuses the bookingId - so the sweep must offer it and act on courtscheduler's verdict.
    it('sweeps a SHARED line whose booking is still RESERVED', () => {
      seedDraftResult(
        draftResultWithLines({
          'line-1': {
            resultPrompts: [bookingReferencePrompt('booking-repicked')],
            sharedDate: '2026-09-21'
          }
        })
      );
      const release$ = cold('-(r|)', { r: undefined });
      provisionalBookingService.releaseProvisionalHearingSlots = jest.fn(() => release$);

      actions$ = hot('-a--', { a: ShareResultsActions.cancelAmendments() });
      const expected$ = cold('--r', { r: undefined });

      expect(effects.releaseAbandonedProvisionalBookings$).toBeObservable(expected$);
      expect(provisionalBookingService.releaseProvisionalHearingSlots).toHaveBeenCalledWith({
        hearingId: draftResult.hearingId,
        bookingId: 'booking-repicked'
      });
    });

    // Fails CLOSED: without a verdict we cannot tell a confirmed booking from an unconfirmed
    // one, and releasing a confirmed one must never happen. The 01:00 purge is the backstop.
    it('releases nothing when the booking-status lookup fails', () => {
      seedDraftResult(
        draftResultWithLines({
          'line-1': { resultPrompts: [bookingReferencePrompt('booking-1')] }
        })
      );
      listingService.getBookingStatus = jest.fn(() =>
        throwError(() => new Error('courtscheduler unreachable'))
      );
      provisionalBookingService.releaseProvisionalHearingSlots = jest.fn(() => of(undefined));

      actions$ = hot('-a--', { a: ShareResultsActions.cancelAmendments() });

      expect(effects.releaseAbandonedProvisionalBookings$).toBeObservable(cold('----'));
      expect(provisionalBookingService.releaseProvisionalHearingSlots).not.toHaveBeenCalled();
    });

    it('calls nothing when the discarded draft result carries no bookingReference', () => {
      seedDraftResult(draftResultWithLines({ 'line-1': { resultPrompts: [] } }));
      provisionalBookingService.releaseProvisionalHearingSlots = jest.fn(() => of(undefined));

      actions$ = hot('-a--', { a: ShareResultsActions.rejectAmendments() });

      expect(effects.releaseAbandonedProvisionalBookings$).toBeObservable(cold('----'));
      expect(provisionalBookingService.releaseProvisionalHearingSlots).not.toHaveBeenCalled();
    });

    it('releases on unlockHearing too', () => {
      seedDraftResult(
        draftResultWithLines({ 'line-1': { resultPrompts: [bookingReferencePrompt('booking-4')] } })
      );
      const release$ = cold('-(r|)', { r: undefined });
      provisionalBookingService.releaseProvisionalHearingSlots = jest.fn(() => release$);

      actions$ = hot('-a--', { a: ShareResultsActions.unlockHearing() });
      const expected$ = cold('--r', { r: undefined });

      expect(effects.releaseAbandonedProvisionalBookings$).toBeObservable(expected$);
      expect(provisionalBookingService.releaseProvisionalHearingSlots).toHaveBeenCalledWith({
        hearingId: draftResult.hearingId,
        bookingId: 'booking-4'
      });
    });

    it('does not block or surface an error when a release fails', () => {
      seedDraftResult(
        draftResultWithLines({ 'line-1': { resultPrompts: [bookingReferencePrompt('booking-5')] } })
      );
      const release$ = cold('-#', undefined, new Error('release failed'));
      provisionalBookingService.releaseProvisionalHearingSlots = jest.fn(() => release$);

      actions$ = hot('-a--', { a: ShareResultsActions.cancelAmendments() });

      // The failure is swallowed: the effect completes quietly rather than erroring.
      expect(effects.releaseAbandonedProvisionalBookings$).toBeObservable(cold('----'));
    });
  });
});
