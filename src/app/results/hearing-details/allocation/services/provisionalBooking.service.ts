import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ListingService } from '../../../../core/services/listing/listing.service';
import { isSharedBooking } from '../../../core/helpers/provisional-booking';

/**
 * The backend deliberately refused the reservation - typically the session filled up between the
 * search and the pick. This is the ONLY failure that may be reported to the clerk as "pick
 * another session". Anything else (HTTP error, rejected command, timeout waiting for the event)
 * is technical: the session may be fine, and blaming it sends the clerk off to re-pick for
 * nothing.
 */
export class BookingRefusedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingRefusedError';
    // Restores the prototype chain so `instanceof` works when targeting ES5 downlevel output.
    Object.setPrototypeOf(this, BookingRefusedError.prototype);
  }
}

@Injectable()
export class ProvisionalBookingService {
  constructor(private cppHttp: CppHttp, private listingService: ListingService) {}

  /**
   * Which bookingId, if any, a new reservation may be taken against.
   *
   * <p>Reusing the id is how a clerk changes their mind: courtscheduler releases the abandoned
   * hold and takes the new one under the same reference. That only works while it is still a
   * HOLD - once a share confirms it, guardAgainstConfirmedAllocation refuses, which is the amend
   * journey. Returning undefined makes the caller omit the id so a fresh one is minted.
   *
   * <p>A failed lookup reuses the id rather than minting: minting on every transient blip would
   * strand the old hold's capacity until the nightly purge.
   */
  private bookingIdToReuse(bookingId?: string): Observable<string | undefined> {
    if (!bookingId) {
      return of(undefined);
    }

    return this.listingService.getBookingStatus([bookingId]).pipe(
      map(({ bookings }) => (isSharedBooking(bookings, bookingId) ? undefined : bookingId)),
      catchError(() => of(bookingId))
    );
  }

  bookProvisionalHearingSlots({
    hearingId,
    bookingId,
    courtScheduleBookings,
    ...filters
  }: {
    hearingId: string;
    bookingId?: string;
    bookingType?: string;
    courtScheduleBookings: {
      courtScheduleId: string;
      hearingStartTime?: string;
      duration?: number;
    }[];
    priority?: string;
  }): Observable<{ bookingId: string }> {
    return this.bookingIdToReuse(bookingId).pipe(
      switchMap(reusableBookingId =>
        this.cppHttp.commandSync<{ bookingId?: string; error?: string }>({
          url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/hearing-slots`,
          requestType: 'application/vnd.hearing.book-unconfirmed-hearing-slots+json',
          successEvent: 'public.hearing.hearing-slots-provisionally-booked',
          body: {
            ...filters,
            ...(reusableBookingId ? { bookingId: reusableBookingId } : {}),
            slots: courtScheduleBookings
          }
        })
      )
    ).pipe(
        // The backend publishes the same event name for both a successful reservation and a
        // refusal, and commandSync resolves on the name alone - so a refusal (`{ error }`, no
        // `bookingId`) would otherwise flow through as an ordinary value. Not redundant: without
        // this, callers cannot tell a refusal from success.
        switchMap(response =>
          response.bookingId
            ? of(response as { bookingId: string })
            : throwError(
                () =>
                  new BookingRefusedError(
                    response.error || 'Provisional hearing slot booking was refused'
                  )
              )
        )
      );
  }

  /**
   * Releases a hold. Fire-and-forget: the backend treats an unknown or already-released
   * bookingId as a no-op and publishes no event, so `command` is used rather than `commandSync`,
   * which would wait forever for an event that never comes.
   */
  releaseProvisionalHearingSlots({
    hearingId,
    bookingId
  }: {
    hearingId: string;
    bookingId: string;
  }): Observable<void> {
    return this.cppHttp.command({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/hearing-slots`,
      requestType: 'application/vnd.hearing.release-unconfirmed-hearing-slots+json',
      body: { bookingId }
    });
  }
}
