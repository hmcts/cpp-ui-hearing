import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ListingService } from '../../../../core/services/listing/listing.service';
import { isSharedBooking } from '../../../core/helpers/provisional-booking';

/** Success. Carries only the bookingId - see BOOKING_FAILED_EVENT for why that is now true. */
const BOOKING_BOOKED_EVENT = 'public.hearing.hearing-slots-provisionally-booked';

/**
 * Failure (LPT-2590). With its own name it can be handed to commandSync as `errorEvent`, which
 * errors the observable for us: the thrown object is `{ status: -1, data, originalEvent }`
 * (CommandError), where `data` is the event payload.
 */
const BOOKING_FAILED_EVENT = 'public.hearing.hearing-slots-provisional-booking-refused';

/**
 * Payload of BOOKING_FAILED_EVENT, shaped like public.hearing.manage-results-failed. `type` is
 * what decides the reaction; `reason` is courtscheduler's own text, for logs only. `bookingId`
 * is present only when the request carried one.
 */
interface BookingFailure {
  bookingId?: string;
  error?: { type?: string; code?: string; reason?: string };
}

/** The codes that mean the chosen session itself is unavailable, so "select another" is right. */
const SESSION_UNAVAILABLE_CODES: ReadonlySet<string> = new Set([
  'NO_CAPACITY',
  'NO_SESSION_AVAILABLE'
]);

/**
 * The backend deliberately refused the booking: `error.type` BUSINESS. Only this is shown to the
 * clerk as a message on the page. Everything else - a TECHNICAL failure, an unknown type, a
 * timeout, an HTTP error - is technical and goes to the standard error page.
 */
export class BookingRefusedError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = 'BookingRefusedError';
    // Restores the prototype chain so `instanceof` works when targeting ES5 downlevel output.
    Object.setPrototypeOf(this, BookingRefusedError.prototype);
  }
}

/** The translation key for a refusal's message on the page. */
export const refusalMessageKey = (error: BookingRefusedError): string =>
  error.code !== undefined && SESSION_UNAVAILABLE_CODES.has(error.code)
    ? 'MANAGE_HEARING.SESSION_NOT_AVAILABLE'
    : 'MANAGE_HEARING.SESSION_BOOKING_REFUSED';

/**
 * Pulls the failure out of whatever commandSync threw.
 *
 * <p>commandSync wraps an errorEvent as `{ status: -1, data, originalEvent }`, but the same
 * stream also errors with a plain `{ status: 0 }` on timeout and with an HttpErrorResponse if the
 * POST itself fails. Those carry no `data` and are technical by definition.
 */
function failureOf(error: unknown): BookingFailure['error'] {
  return (error as { data?: BookingFailure } | undefined)?.data?.error;
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
    return this.bookingIdToReuse(bookingId)
      .pipe(
        switchMap(reusableBookingId =>
          this.cppHttp.commandSync<{ bookingId: string }>({
            url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/hearing-slots`,
            requestType: 'application/vnd.hearing.book-unconfirmed-hearing-slots+json',
            successEvent: BOOKING_BOOKED_EVENT,
            // A refusal now has its own event name, so commandSync can error the stream itself
            // rather than resolving with a payload we then have to inspect. The booked event is
            // success and nothing else.
            errorEvent: BOOKING_FAILED_EVENT,
            body: {
              ...filters,
              ...(reusableBookingId ? { bookingId: reusableBookingId } : {}),
              slots: courtScheduleBookings
            }
          })
        )
      )
      .pipe(
        // Everything reaching here is already an error; this only decides WHICH error - see
        // BookingRefusedError. A BUSINESS refusal becomes BookingRefusedError, carrying its code;
        // anything else passes through unchanged and the pickers treat it as technical.
        catchError(error => {
          const failure = failureOf(error);
          if (failure?.type === 'BUSINESS') {
            return throwError(
              () =>
                new BookingRefusedError(
                  failure.reason || 'Provisional hearing slot booking was refused',
                  failure.code
                )
            );
          }
          return throwError(() => error);
        })
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
