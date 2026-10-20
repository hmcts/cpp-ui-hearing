import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CommandError } from '@cpp/core';
import { OrganisationUnit } from '@cpp/reference-data';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, provideState, provideStore, Store } from '@ngrx/store';
import {
  HearingSlot,
  ListingNote,
  loadHearingSlotsSuccess,
  loadListingNotes,
  SchedulingService,
  SearchHearingSlotsParams
} from '@cpp/scheduling';
import { cold, getTestScheduler, hot } from 'jasmine-marbles';
import { Observable } from 'rxjs';
import {
  ApiError,
  HEARING_SLOTS_PROVISIONAL_BOOKING_REFUSED_PUBLIC_EVENT,
  reducers
} from '../../../../core';
import { ProvisionalBookingService } from '../../../hearing-details/allocation/services/provisionalBooking.service';
import {
  HearingSlotsBookingErrorCode,
  HearingSlotsBookingErrorType,
  HearingSlotsBookingPublicEventError
} from '../../../hearing-details/allocation/types/allocation';
import { getDurationValueFromMinutes } from '../../helpers';
import { createDraftResult, extendDraftResult } from '../../testing';
import { DraftResultActions } from '../draft-result.actions';
import { HearingSlotsBookingActions } from '../hearing-slots-booking.actions';
import { HearingSlotsBookingEffects } from '../hearing-slots-booking.effects';
import { resultsReducer } from '../index';

jest.mock('../../../hearing-details/allocation/services/provisionalBooking.service');

describe('HearingSlotsBookingEffects', () => {
  let actions$: Observable<Action>;
  let effects: HearingSlotsBookingEffects;
  let provisionalBookingService: ProvisionalBookingService;
  let schedulingService: SchedulingService;
  let store: Store;

  const draftResult = extendDraftResult(createDraftResult({ results: ['NHMC'] }));
  const resultLineId = Object.keys(draftResult.resultLines)[0];
  const courtScheduleBookings = [
    { courtScheduleId: '1', hearingStartTime: '2020-01-01T10:00:00.000Z', duration: 30 }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideState('results', resultsReducer, {
          initialState: {
            draftResult
          }
        }),
        HearingSlotsBookingEffects,
        ProvisionalBookingService,
        { provide: SchedulingService, useValue: { searchHearingSlots: jest.fn() } },
        provideMockActions(() => actions$)
      ],
      teardown: { destroyAfterEach: false }
    });

    effects = TestBed.inject(HearingSlotsBookingEffects);
    schedulingService = TestBed.inject(SchedulingService);
    store = TestBed.inject(Store);
    provisionalBookingService = TestBed.inject(ProvisionalBookingService);
  });

  describe('HearingSlotsBookingActions.bookHearingSlots', () => {
    const requestAction = HearingSlotsBookingActions.bookHearingSlots({
      hearingId: 'hearingId',
      resultLineId,
      courtScheduleBookings,
      promptRefToValueMap: {
        HDATE: '2020-01-01',
        timeOfHearing: '10:00',
        HCROOM: 'Courtroom 01',
        HTYPE: 'Hearing Type A',
        HEST: getDurationValueFromMinutes(30)
      },
      courtCentre: { oucode: 'OUCODEL32', oucodeL3Name: 'Courthouse B' } as OrganisationUnit,
      redirectTo: ['/manage', 'hearingId', 'enter-results']
    });

    it('should book the hearing slots and update the result prompts', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: { bookingId: 'bookingId' } });
      const expected$ = cold('--(bc)', {
        b: HearingSlotsBookingActions.bookHearingSlotsSuccess(),
        c: expect.objectContaining({
          type: DraftResultActions.updateResultPromptsForDraftResultLine.type,
          resultLineId,
          redirectTo: ['/manage', 'hearingId', 'enter-results']
        })
      });
      provisionalBookingService.bookProvisionalHearingSlots = jest.fn(() => response$);

      expect(effects.bookHearingSlots$).toBeObservable(expected$);
      expect(provisionalBookingService.bookProvisionalHearingSlots).toHaveBeenCalledWith({
        hearingId: 'hearingId',
        courtScheduleBookings
      });
    });

    it('should write the bookingId into the result prompts', () => {
      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: { bookingId: 'bookingId' } });
      provisionalBookingService.bookProvisionalHearingSlots = jest.fn(() => response$);

      const actions: Action[] = [];
      effects.bookHearingSlots$.subscribe(action => actions.push(action));
      getTestScheduler().flush();

      expect(actions[1]).toMatchSnapshot();
    });

    const bookingFailure = (error: HearingSlotsBookingPublicEventError['error']) => {
      const originalEvent = {
        _metadata: {
          id: HEARING_SLOTS_PROVISIONAL_BOOKING_REFUSED_PUBLIC_EVENT,
          name: HEARING_SLOTS_PROVISIONAL_BOOKING_REFUSED_PUBLIC_EVENT
        },
        bookingId: 'bookingId',
        error
      } as HearingSlotsBookingPublicEventError;

      return { status: -1, originalEvent, data: { bookingId: 'bookingId', error } } as CommandError;
    };

    it('should set the booking error when the booking is refused for a business reason', () => {
      const failure = bookingFailure({
        type: HearingSlotsBookingErrorType.BUSINESS,
        code: HearingSlotsBookingErrorCode.NO_CAPACITY,
        reason: 'courtscheduler returned 409'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, failure);
      const expected$ = cold('--b---', {
        b: HearingSlotsBookingActions.setHearingSlotsBookingError({
          hearingSlotsBookingError: failure.originalEvent as HearingSlotsBookingPublicEventError
        })
      });
      provisionalBookingService.bookProvisionalHearingSlots = jest.fn(() => response$);

      expect(effects.bookHearingSlots$).toBeObservable(expected$);
    });

    it('should handle a technical booking failure', () => {
      const failure = bookingFailure({
        type: HearingSlotsBookingErrorType.TECHNICAL,
        code: HearingSlotsBookingErrorCode.COURTSCHEDULER_ERROR,
        reason: 'courtscheduler returned 500'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, failure);
      const expected$ = cold('--b---', { b: new ApiError(failure) });
      provisionalBookingService.bookProvisionalHearingSlots = jest.fn(() => response$);

      expect(effects.bookHearingSlots$).toBeObservable(expected$);
    });

    it('should handle an unrecognised booking failure', () => {
      const failure = bookingFailure({
        type: HearingSlotsBookingErrorType.BUSINESS,
        code: 'UNKNOWN' as HearingSlotsBookingErrorCode,
        reason: 'unknown'
      });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, failure);
      const expected$ = cold('--b---', { b: new ApiError(failure) });
      provisionalBookingService.bookProvisionalHearingSlots = jest.fn(() => response$);

      expect(effects.bookHearingSlots$).toBeObservable(expected$);
    });

    it('should handle an error', () => {
      const error = new HttpErrorResponse({ status: 500 });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, error);
      const expected$ = cold('--b---', { b: new ApiError(error) });
      provisionalBookingService.bookProvisionalHearingSlots = jest.fn(() => response$);

      expect(effects.bookHearingSlots$).toBeObservable(expected$);
    });
  });

  describe('HearingSlotsBookingActions.setHearingSlotsBookingError', () => {
    const params = {
      ouCode: 'OUCODEL32',
      sessionStartDate: '2020-01-01',
      jurisdiction: 'MAGISTRATES',
      pageNumber: 2,
      pageSize: 10
    } as SearchHearingSlotsParams;
    const requestAction = HearingSlotsBookingActions.setHearingSlotsBookingError({
      hearingSlotsBookingError: {
        error: {
          type: HearingSlotsBookingErrorType.BUSINESS,
          code: HearingSlotsBookingErrorCode.NO_CAPACITY,
          reason: 'courtscheduler returned 409'
        }
      } as HearingSlotsBookingPublicEventError
    });

    beforeEach(() => {
      store.dispatch(loadHearingSlotsSuccess({ params, hearingSlots: [], totalResults: 1 }));
    });

    it('should search the hearing slots again with the current search', () => {
      const hearingSlots = [{ courtScheduleId: 'S2' }] as HearingSlot[];
      const notes: ListingNote[] = [];

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -(r|)', { r: { hearingSlots, totalResults: 1, notes } });
      const expected$ = cold('--(bc)', {
        b: loadHearingSlotsSuccess({ params, hearingSlots, totalResults: 1 }),
        c: loadListingNotes({ notes })
      });
      schedulingService.searchHearingSlots = jest.fn(() => response$);

      expect(effects.refreshHearingSlotsOnBookingRefused$).toBeObservable(expected$);
      expect(schedulingService.searchHearingSlots).toHaveBeenCalledWith(params);
    });

    it('should handle an error', () => {
      const error = new HttpErrorResponse({ status: 500 });

      actions$ = hot('        -a----', { a: requestAction });
      const response$ = cold(' -#   ', undefined, error);
      const expected$ = cold('--b---', { b: new ApiError(error) });
      schedulingService.searchHearingSlots = jest.fn(() => response$);

      expect(effects.refreshHearingSlotsOnBookingRefused$).toBeObservable(expected$);
    });
  });
});
