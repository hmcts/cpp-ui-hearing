import { TestBed } from '@angular/core/testing';
import { CppHttp } from '@cpp/core';
import { cold } from 'jasmine-marbles';
import { of, throwError } from 'rxjs';
import { BookingRefusedError, ProvisionalBookingService } from './provisionalBooking.service';

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
     * Refusals arrive under their own event name, registered as commandSync's `errorEvent`, so
     * they reach this service as an observable ERROR shaped `{ status: -1, data }` rather than as
     * a resolved value. `data.error` is courtscheduler's answer as hearing passed it on:
     * `{ status?, message }`.
     */
    const commandError = (status: number | undefined, message = 'because') => ({
      status: -1,
      data: { error: { status, message } },
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

    it('produces an errored observable when courtscheduler refuses the booking', () => {
      const response$ = cold('-#', {}, commandError(422, 'no capacity'));
      const expected$ = cold('-#', {}, new BookingRefusedError('no capacity'));

      http.commandSync = jest.fn().mockReturnValue(response$);

      const params = {
        hearingId: 'hearingId',
        courtScheduleBookings: [{ courtScheduleId: '*' }]
      };
      const command$ = service.bookProvisionalHearingSlots(params);

      expect(command$).toBeObservable(expected$);
    });

    // Pins the contract the pickers rely on to tell a deliberate refusal from a technical
    // failure. If this stops being a BookingRefusedError, both pickers send a full session to
    // the technical error page instead of telling the clerk to choose another session - which is
    // what happened while this still read the pre-21-October { type, code, reason } shape.
    it('turns a 422 into a BookingRefusedError, not a plain Error', done => {
      bookAndCatch(
        commandError(422, 'courtscheduler returned 422: {"error":"no capacity"}'),
        error => {
          expect(error).toBeInstanceOf(BookingRefusedError);
          expect((error as Error).message).toBe(
            'courtscheduler returned 422: {"error":"no capacity"}'
          );
        },
        done
      );
    });

    // The message is for logs; a refusal without one still needs some text for the diagnosis.
    it('falls back to a default message when the refusal carries none', done => {
      bookAndCatch(
        { status: -1, data: { error: { status: 422 } }, originalEvent: {} },
        error =>
          expect((error as Error).message).toBe('Provisional hearing slot booking was refused'),
        done
      );
    });

    /**
     * The other half of the split. None of these may become a BookingRefusedError: they go to the
     * standard technical error page, so the error must pass through UNTOUCHED for the pickers to
     * dispatch it as an ApiError. 400 is a bad request - a UI bug, not the session; no status
     * means courtscheduler never answered. The old BUSINESS shape is technical too: no hearing
     * sends it any more, and an unrecognised failure must never blame the session.
     */
    describe.each([
      ['400', commandError(400)],
      ['500', commandError(500)],
      ['no status', commandError(undefined, 'Connect to courtscheduler:8080 failed')],
      [
        'the old BUSINESS shape',
        {
          status: -1,
          data: { error: { type: 'BUSINESS', code: 'NO_CAPACITY' } },
          originalEvent: {}
        }
      ]
    ])('%s', (_, thrown) => {
      it('does not blame the session, and passes the error through untouched', done => {
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
    // failure on the POST errors with an HttpErrorResponse. Neither says anything about the
    // session.
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
});
