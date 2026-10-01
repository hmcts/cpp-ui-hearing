import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ListingService } from '../../../../core/services/listing/listing.service';
import { isSharedBooking } from '../../../core/helpers/provisional-booking';

/**
 * The backend deliberately refused the reservation - typically because the session filled up
 * between the search and the pick. This is a business outcome the clerk can act on by choosing
 * another session, and it is the ONLY case that may be reported as such.
 *
 * <p>Anything else that fails this call - an HTTP error, a rejected command, a rolled-back
 * transaction, a timeout waiting for the success event - is a technical failure. The session
 * itself may be perfectly available, so telling the clerk it is "fully booked" sends them off to
 * re-pick a session that was never the problem. Observed on STE02: a JSON-schema rejection of
 * `bookingId` in the command handler rolled the transaction back, no event was ever published,
 * commandSync timed out, and the picker reported the session as fully booked.
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
   * Decides which bookingId, if any, a new reservation may be taken against.
   *
   * <p>Reusing the id is how a clerk changes their mind about a session: courtscheduler releases
   * the abandoned hold and takes the new one under the same reference, in one transaction. But
   * that only works while the booking is still a HOLD. Once a share has confirmed it, the id
   * belongs to a real listing and `guardAgainstConfirmedAllocation` refuses to reserve against
   * it - which is exactly the amend journey: share a result, amend it, pick a different session.
   * Before this check that refusal surfaced to the clerk as "this session is fully booked", about
   * a session that was free.
   *
   * <p>Returning undefined makes the caller omit `bookingId` so courtscheduler mints a fresh one.
   * The old confirmed listing is deliberately left alone - the amended share reconciles it, and
   * that release is keyed on hearing_id, not on bookingId.
   *
   * <p>On a failed status lookup this keeps TODAY'S behaviour and reuses the id, rather than
   * minting a new one. Minting on every transient blip would strand the previous hold's capacity
   * until the nightly purge, on a session another clerk may be waiting for; reusing at worst
   * reproduces the refusal the clerk already knows how to read.
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
        // The backend publishes the SAME event name -
        // `public.hearing.hearing-slots-provisionally-booked` - for both a
        // successful reservation and a refusal (e.g. the session is now full).
        // Because commandSync resolves as soon as that event name arrives, a
        // refusal (`{ error }`, no `bookingId`) would otherwise flow through
        // this method as an ordinary value rather than an observable error.
        // This guard turns that refusal into an errored observable so the
        // declared return type - `Observable<{ bookingId: string }>` - stays
        // true: a value always has a bookingId. Do not remove this as
        // redundant; without it, callers cannot tell a refusal from success.
        //
        // It is thrown as a BookingRefusedError specifically so callers can tell
        // a DELIBERATE refusal apart from a technical failure of the same call
        // (HTTP error, rejected command, timeout waiting for the event). Only a
        // refusal means "pick another session" - see BookingRefusedError.
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
   * Releases a previously booked provisional hearing slot hold. This is
   * fire-and-forget: per `hearing.release-unconfirmed-hearing-slots` (see
   * hearing-command-api.raml), the backend treats an unknown or
   * already-released bookingId as a no-op, never an error, and it does not
   * publish a public event on completion - so `command` is used here rather
   * than `commandSync`, which would otherwise wait indefinitely for a
   * successEvent that is never emitted.
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
