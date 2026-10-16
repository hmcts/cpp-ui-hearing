import { TestBed } from '@angular/core/testing';
import { CppHttp } from '@cpp/core';
import { cold } from 'jasmine-marbles';
import { of, throwError } from 'rxjs';
import { ListingService } from '../../../../core/services/listing/listing.service';
import { BookingRefusedError, ProvisionalBookingService } from './provisionalBooking.service';

describe('ProvisionalBookingService', () => {
  let service: ProvisionalBookingService;
  let http: CppHttp;
  let listingService: ListingService;

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
        },
        {
          provide: ListingService,
          useValue: {
            getBookingStatus: jest.fn()
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    listingService = TestBed.inject(ListingService);
    service = TestBed.inject(ProvisionalBookingService);
  });

  /**
   * A result line whose booking has already been shared must NOT have that bookingId resent:
   * courtscheduler refuses to reserve against a confirmed allocation, and before this the clerk
   * was told "this session is fully booked" about a session that was free. See
   * ProvisionalBookingService.bookingIdToReuse.
   */
  describe('amending a result whose booking is already shared', () => {
    const bookSlot = (bookingId: string) =>
      service
        .bookProvisionalHearingSlots({
          hearingId: 'hearingId',
          bookingId,
          courtScheduleBookings: [{ courtScheduleId: 'session-1' }]
        })
        .subscribe({ error: () => undefined });

    const sentBody = () => (http.commandSync as jest.Mock).mock.calls[0][0].body;

    beforeEach(() => {
      http.commandSync = jest.fn().mockReturnValue(of({ bookingId: 'minted' }));
    });

    it('omits the bookingId so courtscheduler mints a new one when the booking is SHARED', () => {
      (listingService.getBookingStatus as jest.Mock).mockReturnValue(
        of({ bookings: [{ bookingId: 'shared-booking', status: 'SHARED' }] })
      );

      bookSlot('shared-booking');

      expect(listingService.getBookingStatus).toHaveBeenCalledWith(['shared-booking']);
      expect(sentBody()).not.toHaveProperty('bookingId');
    });

    it('reuses the bookingId when the booking is still an unconfirmed hold', () => {
      (listingService.getBookingStatus as jest.Mock).mockReturnValue(
        of({ bookings: [{ bookingId: 'held-booking', status: 'RESERVED' }] })
      );

      bookSlot('held-booking');

      expect(sentBody().bookingId).toBe('held-booking');
    });

    it('reuses the bookingId when the status lookup fails, rather than stranding the old hold', () => {
      (listingService.getBookingStatus as jest.Mock).mockReturnValue(
        throwError(() => new Error('listing unreachable'))
      );

      bookSlot('held-booking');

      expect(sentBody().bookingId).toBe('held-booking');
    });

    it('does not ask listing anything when the line carries no booking yet', () => {
      service
        .bookProvisionalHearingSlots({
          hearingId: 'hearingId',
          courtScheduleBookings: [{ courtScheduleId: 'session-1' }]
        })
        .subscribe({ error: () => undefined });

      expect(listingService.getBookingStatus).not.toHaveBeenCalled();
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
        errorEvent: 'public.hearing.hearing-slots-unconfirmed-booking-failed'
      });
    });

    /**
     * Refusals now arrive under their own event name, registered as commandSync's `errorEvent`,
     * so they reach this service as an observable ERROR shaped `{ status: -1, data }` rather
     * than as a resolved value. These helpers build that shape.
     */
    const commandError = (code: string, reason = 'because') => ({
      status: -1,
      data: { error: { code, reason } },
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
      const response$ = cold('-#', {}, commandError('NO_CAPACITY', 'no capacity'));
      const expected$ = cold('-#', {}, new BookingRefusedError('no capacity'));

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
    it('refuses with a BookingRefusedError, not a plain Error', done => {
      bookAndCatch(
        commandError('NO_CAPACITY', 'no capacity'),
        error => {
          expect(error).toBeInstanceOf(BookingRefusedError);
          expect((error as Error).message).toBe('no capacity');
        },
        done
      );
    });

    // The session was withdrawn between the search and the pick. Still the session's fault, so
    // still "pick another one" - the clerk's next action is the same.
    it('treats NO_SESSION as a refusal of the chosen session', done => {
      bookAndCatch(
        commandError('NO_SESSION', 'No session found for sessionId abc'),
        error => expect(error).toBeInstanceOf(BookingRefusedError),
        done
      );
    });

    // The reason text is courtscheduler's, and it is what the BookingRefusedError carries.
    it('carries the backend reason as the refusal message', done => {
      bookAndCatch(
        commandError('NO_CAPACITY', 'Session 7f2a has no remaining capacity'),
        error => expect((error as Error).message).toBe('Session 7f2a has no remaining capacity'),
        done
      );
    });

    // A refusal with no reason still needs a message - the pickers translate by code, but an
    // empty Error message makes the WildFly-side diagnosis impossible.
    it('falls back to a default message when the backend sends no reason', done => {
      bookAndCatch(
        { status: -1, data: { error: { code: 'NO_CAPACITY' } }, originalEvent: {} },
        error =>
          expect((error as Error).message).toBe('Provisional hearing slot booking was refused'),
        done
      );
    });

    /**
     * The other half of the split, and the reason the codes exist at all. None of these may
     * become a BookingRefusedError: the session may be perfectly free, and telling the clerk to
     * pick another one sends them off for nothing. The error must also pass through UNTOUCHED,
     * so the pickers' `instanceof` check falls to the generic technical message.
     *
     * <p>Every backend failure code that is NOT in SESSION_REFUSAL_CODES is listed here. If a
     * code is added to ProvisionalBookingFailureCode and nobody decides which side of the line it
     * belongs on, it is absent from both this list and the allowlist - so add it here, or to
     * SESSION_REFUSAL_CODES with a reason.
     */
    describe.each([
      // Our request was malformed - courtscheduler's validator rejected what hearing built.
      ['BAD_REQUEST'],
      // courtscheduler reached its own code and that code threw.
      ['INTERNAL_SERVER_ERROR'],
      // Something answered instead of courtscheduler, or its own upstream call failed.
      ['BAD_GATEWAY'],
      // Never reached courtscheduler's logic at all: 503/504 or a connection failure.
      ['SERVICE_UNAVAILABLE'],
      // Answered, but not in a way the contract allows.
      ['UNEXPECTED_RESPONSE'],
      // Re-picking cannot help: the booking being reused is already shared. bookingIdToReuse
      // should stop this reaching courtscheduler at all, but if one slips past, the generic
      // message is the honest one.
      ['BOOKING_ALREADY_CONFIRMED'],
      // A code added to the backend after this build shipped. Falling back to the generic
      // message is the safe default; guessing "pick another session" is not.
      ['SOMETHING_ADDED_AFTER_THIS_BUILD_SHIPPED']
    ])('%s', code => {
      it('does not blame the session, and passes the error through untouched', done => {
        const thrown = commandError(code, `reason for ${code}`);
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
