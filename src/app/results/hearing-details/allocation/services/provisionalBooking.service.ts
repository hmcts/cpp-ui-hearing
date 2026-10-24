import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  constructor(private cppHttp: CppHttp) {}

  /**
   * Books the picked session(s) and emits the booking id they are held under.
   *
   * <p>A re-pick sends the booking id the result line already carries, whatever state it is in
   * (LPT-2592). Courtscheduler decides: it keeps the id while it is still an unconfirmed hold, so
   * the abandoned session is released in the same step, and otherwise - confirmed by a share,
   * released, expired - books under a fresh one. The emitted id is the one actually used, and the
   * caller writes exactly that back onto the line. The UI no longer asks for the booking's status
   * first, or decides which id to send.
   */
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
    return this.cppHttp
      .commandSync<{ bookingId: string }>({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/hearing-slots`,
        requestType: 'application/vnd.hearing.book-unconfirmed-hearing-slots+json',
        successEvent: BOOKING_BOOKED_EVENT,
        // A refusal now has its own event name, so commandSync can error the stream itself
        // rather than resolving with a payload we then have to inspect. The booked event is
        // success and nothing else.
        errorEvent: BOOKING_FAILED_EVENT,
        body: {
          ...filters,
          ...(bookingId ? { bookingId } : {}),
          slots: courtScheduleBookings
        }
      })
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
}
