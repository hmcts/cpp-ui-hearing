import { TestBed } from '@angular/core/testing';
import { CppHttp } from '@cpp/core';
import { cold } from 'jasmine-marbles';
import { of, throwError } from 'rxjs';
import {
  BookingRefusedError,
  ProvisionalBookingService,
  refusalMessageKey
} from './provisionalBooking.service';

describe('ProvisionalBookingService', () => {
  let service: ProvisionalBookingService;
  let http: CppHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProvisionalBookingService,
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn()
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(ProvisionalBookingService);
  });

  /**
   * LPT-2592: on a re-pick the UI sends the booking id the line already carries, whatever state
   * it is in, and courtscheduler decides whether to keep it or book under a fresh one. The UI does
   * not look the booking up first, and writes back whichever id comes back.
   */
  describe('re-picking a session on a line that already has a booking', () => {
    const sentBody = () => (http.commandSync as jest.Mock).mock.calls[0][0].body;

    it("sends the line's booking id unchanged, without asking for its status first", () => {
      http.commandSync = jest.fn().mockReturnValue(of({ bookingId: 'existing-booking' }));

      service
        .bookProvisionalHearingSlots({
          hearingId: 'hearingId',
          bookingId: 'existing-booking',
          courtScheduleBookings: [{ courtScheduleId: 'session-2' }]
        })
        .subscribe();

      expect(http.commandSync).toHaveBeenCalledTimes(1);
      expect(sentBody().bookingId).toBe('existing-booking');
      expect(http.query).not.toHaveBeenCalled();
    });

    it('emits the booking id courtscheduler used, which may be a fresh one', () => {
      http.commandSync = jest
        .fn()
        .mockReturnValue(cold('-a|', { a: { bookingId: 'fresh-booking' } }));

      const booked$ = service.bookProvisionalHearingSlots({
        hearingId: 'hearingId',
        bookingId: 'shared-booking',
        courtScheduleBookings: [{ courtScheduleId: 'session-2' }]
      });

      expect(booked$).toBeObservable(cold('-b|', { b: { bookingId: 'fresh-booking' } }));
    });

    it('sends no booking id on a first pick', () => {
      http.commandSync = jest.fn().mockReturnValue(of({ bookingId: 'minted' }));

      service
        .bookProvisionalHearingSlots({
          hearingId: 'hearingId',
          courtScheduleBookings: [{ courtScheduleId: 'session-1' }]
        })
        .subscribe();

      expect(sentBody()).not.toHaveProperty('bookingId');
    });
  });

  describe('bookProvisionalHearingSlots()', () => {
    it('shoudld save the hearing slots', () => {
      const response = { bookingId: 'test-booking-reference' };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });

      http.commandSync = jest.fn().mockReturnValue(response$);

      const params = {
        hearingId: 'hearingId',
        courtScheduleBookings: [
          {
            courtScheduleId: '*',
            hearingStartTime: new Date().toISOString()
          }
        ]
      };
      const command$ = service.bookProvisionalHearingSlots(params);

      expect(command$).toBeObservable(expected$);

      expect(http.commandSync).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId/hearing-slots`,
        requestType: 'application/vnd.hearing.book-unconfirmed-hearing-slots+json',
        body: { slots: params.courtScheduleBookings },
        successEvent: 'public.hearing.hearing-slots-provisionally-booked',
        errorEvent: 'public.hearing.hearing-slots-provisional-booking-refused'
      });
    });

    /**
     * Refusals now arrive under their own event name, registered as commandSync's `errorEvent`,
     * so they reach this service as an observable ERROR shaped `{ status: -1, data }` rather
     * than as a resolved value. These helpers build that shape.
     */
    const commandError = (type: string, code: string, reason = 'because') => ({
      status: -1,
      data: { error: { type, code, reason } },
      originalEvent: {}
    });

    const bookAndCatch = (
      thrown: unknown,
      assertion: (error: unknown) => void,
      done: () => void
    ) => {
      http.commandSync = jest.fn().mockReturnValue(throwError(() => thrown));

      service
        .bookProvisionalHearingSlots({
          hearingId: 'hearingId',
          courtScheduleBookings: [{ courtScheduleId: '*' }]
        })
        .subscribe({
          error: (error: unknown) => {
            assertion(error);
            done();
          }
        });
    };

    it('produces an errored observable when the backend refuses the booking', () => {
      const response$ = cold('-#', {}, commandError('BUSINESS', 'NO_CAPACITY', 'no capacity'));
      const expected$ = cold('-#', {}, new BookingRefusedError('no capacity', 'NO_CAPACITY'));

      http.commandSync = jest.fn().mockReturnValue(response$);

      const params = {
        hearingId: 'hearingId',
        courtScheduleBookings: [{ courtScheduleId: '*' }]
      };
      const command$ = service.bookProvisionalHearingSlots(params);

      expect(command$).toBeObservable(expected$);
    });

    // Pins the contract the pickers rely on to tell a deliberate refusal from a
    // technical failure. If this stops being a BookingRefusedError, both pickers
    // silently fall back to the generic "technical problem" message and a genuine
    // "session is full" stops telling the clerk to choose another session.
    it('refuses with a BookingRefusedError carrying the code, not a plain Error', done => {
      bookAndCatch(
        commandError('BUSINESS', 'NO_CAPACITY', 'no capacity'),
        error => {
          expect(error).toBeInstanceOf(BookingRefusedError);
          expect((error as Error).message).toBe('no capacity');
          expect((error as BookingRefusedError).code).toBe('NO_CAPACITY');
        },
        done
      );
    });

    // Every BUSINESS code is a refusal shown on the page, whatever the code (LPT-2590).
    describe.each([['NO_CAPACITY'], ['NO_SESSION_AVAILABLE'], ['CONFIRMED_BOOKING_EXISTS']])(
      'BUSINESS %s',
      code => {
        it('is a refusal', done => {
          bookAndCatch(
            commandError('BUSINESS', code, `reason for ${code}`),
            error => {
              expect(error).toBeInstanceOf(BookingRefusedError);
              expect((error as BookingRefusedError).code).toBe(code);
            },
            done
          );
        });
      }
    );

    // The reason text is courtscheduler's, and it is what the BookingRefusedError carries.
    it('carries the backend reason as the refusal message', done => {
      bookAndCatch(
        commandError('BUSINESS', 'NO_CAPACITY', 'Session 7f2a has no remaining capacity'),
        error => expect((error as Error).message).toBe('Session 7f2a has no remaining capacity'),
        done
      );
    });

    // A refusal with no reason still needs a message - the pickers translate by code, but an
    // empty Error message makes the WildFly-side diagnosis impossible.
    it('falls back to a default message when the backend sends no reason', done => {
      bookAndCatch(
        {
          status: -1,
          data: { error: { type: 'BUSINESS', code: 'NO_CAPACITY' } },
          originalEvent: {}
        },
        error =>
          expect((error as Error).message).toBe('Provisional hearing slot booking was refused'),
        done
      );
    });

    /**
     * The other half of the split. None of these may become a BookingRefusedError: they go to the
     * standard technical error page, so the error must pass through UNTOUCHED for the pickers to
     * dispatch it as an ApiError. An unknown or missing type is technical too - the safe default.
     */
    describe.each([
      ['TECHNICAL', 'COURTSCHEDULER_ERROR'],
      ['SOMETHING_ADDED_AFTER_THIS_BUILD_SHIPPED', 'NO_CAPACITY'],
      [undefined, 'NO_CAPACITY']
    ])('type %s, code %s', (type, code) => {
      it('does not blame the session, and passes the error through untouched', done => {
        const thrown = {
          status: -1,
          data: { error: { type, code, reason: 'r' } },
          originalEvent: {}
        };
        bookAndCatch(
          thrown,
          error => {
            expect(error).not.toBeInstanceOf(BookingRefusedError);
            expect(error).toBe(thrown);
          },
          done
        );
      });
    });

    // commandSync's own 30s timeout errors with `{ status: 0 }` and no `data` at all; an HTTP
    // failure on the POST errors with an HttpErrorResponse. Neither carries a code, and neither
    // says anything about the session.
    it('passes a timeout through untouched rather than calling it a refusal', done => {
      const thrown = { status: 0 };
      bookAndCatch(
        thrown,
        error => {
          expect(error).not.toBeInstanceOf(BookingRefusedError);
          expect(error).toBe(thrown);
        },
        done
      );
    });

    it('produces a value when the backend accepts the booking', () => {
      const response = { bookingId: 'test-booking-reference' };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: response });

      http.commandSync = jest.fn().mockReturnValue(response$);

      const params = {
        hearingId: 'hearingId',
        courtScheduleBookings: [{ courtScheduleId: '*' }]
      };
      const command$ = service.bookProvisionalHearingSlots(params);

      expect(command$).toBeObservable(expected$);
    });
  });

  describe('refusalMessageKey()', () => {
    it('says the session is unavailable when it is full or gone', () => {
      expect(refusalMessageKey(new BookingRefusedError('r', 'NO_CAPACITY'))).toBe(
        'MANAGE_HEARING.SESSION_NOT_AVAILABLE'
      );
      expect(refusalMessageKey(new BookingRefusedError('r', 'NO_SESSION_AVAILABLE'))).toBe(
        'MANAGE_HEARING.SESSION_NOT_AVAILABLE'
      );
    });

    it('uses the generic refusal for any other business code', () => {
      expect(refusalMessageKey(new BookingRefusedError('r', 'CONFIRMED_BOOKING_EXISTS'))).toBe(
        'MANAGE_HEARING.SESSION_BOOKING_REFUSED'
      );
      expect(refusalMessageKey(new BookingRefusedError('r'))).toBe(
        'MANAGE_HEARING.SESSION_BOOKING_REFUSED'
      );
    });
  });

  describe('releaseProvisionalHearingSlots()', () => {
    it('should release the booked hearing slots', () => {
      const response$ = cold('-a|', { a: undefined });
      const expected$ = cold('-b|', { b: undefined });

      http.command = jest.fn().mockReturnValue(response$);

      const command$ = service.releaseProvisionalHearingSlots({
        hearingId: 'hearingId',
        bookingId: 'booking-1'
      });

      expect(command$).toBeObservable(expected$);

      expect(http.command).toHaveBeenCalledWith({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/hearingId/hearing-slots`,
        requestType: 'application/vnd.hearing.release-unconfirmed-hearing-slots+json',
        body: { bookingId: 'booking-1' }
      });
    });
  });
});
