import { TestBed } from '@angular/core/testing';
import { CppHttp } from '@cpp/core';
import { cold } from 'jasmine-marbles';
import { of, throwError } from 'rxjs';
import { ListingService } from '../../../../core/services/listing/listing.service';
import {
  BookingRefusedError,
  ProvisionalBookingService,
  refusalMessageKey
} from './provisionalBooking.service';

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
