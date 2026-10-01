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
        successEvent: 'public.hearing.hearing-slots-provisionally-booked'
      });
    });

    // The backend publishes the same event name for both a successful and a
    // refused reservation, so a refusal arrives at commandSync as a resolved
    // value (`{ error }`) rather than an observable error. Without the guard
    // added in bookProvisionalHearingSlots(), this test fails: the unguarded
    // `map` lets the `{ error }` payload through as a value with no
    // `bookingId`, so `command$` never errors.
    it('produces an errored observable when the backend refuses the booking', () => {
      const response$ = cold('-a|', { a: { error: 'no capacity' } });
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
      http.commandSync = jest.fn().mockReturnValue(of({ error: 'no capacity' }));

      service
        .bookProvisionalHearingSlots({
          hearingId: 'hearingId',
          courtScheduleBookings: [{ courtScheduleId: '*' }]
        })
        .subscribe({
          error: (error: unknown) => {
            expect(error).toBeInstanceOf(BookingRefusedError);
            expect((error as Error).message).toBe('no capacity');
            done();
          }
        });
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
