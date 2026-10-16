import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ListingService } from '../../../../core/services/listing/listing.service';
import { isSharedBooking } from '../../../core/helpers/provisional-booking';

/** Success. Carries only the bookingId - see BOOKING_FAILED_EVENT for why that is now true. */
const BOOKING_BOOKED_EVENT = 'public.hearing.hearing-slots-provisionally-booked';

/**
 * Failure. The backend used to publish refusals under the booked name above, discriminated only
 * by whether the payload carried a `bookingId` or an `error`. commandSync resolves on the event
 * NAME, so a refusal arrived here as an ordinary success value and had to be turned back into an
 * error by re-inspecting the payload.
 *
 * <p>With its own name it can be handed to commandSync as `errorEvent`, which errors the
 * observable for us: the thrown object is `{ status: -1, data, originalEvent }` (CommandError),
 * where `data` is the event payload.
 */
const BOOKING_FAILED_EVENT = 'public.hearing.hearing-slots-unconfirmed-booking-failed';

/** Payload of BOOKING_FAILED_EVENT. `code` is the only field worth branching on. */
interface BookingFailure {
  error?: { code?: string; reason?: string };
}

/**
 * The failure codes that mean courtscheduler deliberately refused THIS SESSION, as opposed to
 * something going wrong on the way. Only these may be reported to the clerk as "pick another
 * session" - see BookingRefusedError.
 *
 * <p>BOOKING_ALREADY_CONFIRMED is deliberately NOT here. It is a deliberate refusal, but the
 * session is irrelevant to it: the booking being reused is already shared, so re-picking cannot
 * succeed however many sessions the clerk tries. bookingIdToReuse below exists to stop that
 * reaching courtscheduler at all; if one slips past, the generic message is the honest one.
 *
 * <p>Every other backend code - BAD_REQUEST, INTERNAL_SERVER_ERROR, BAD_GATEWAY,
 * SERVICE_UNAVAILABLE, UNEXPECTED_RESPONSE - and any code this build has never heard of also fall
 * through to the generic message, which is the safe default: blaming a session that may be
 * perfectly free sends the clerk round a loop for nothing. Deliberately an ALLOWLIST and not a
 * denylist, so a code added to the backend later is technical here until someone decides
 * otherwise, rather than silently becoming "pick another session".
 */
const SESSION_REFUSAL_CODES: ReadonlySet<string> = new Set(['NO_CAPACITY', 'NO_SESSION']);

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

/**
 * Pulls the failure payload out of whatever commandSync threw.
 *
 * <p>commandSync wraps an errorEvent as `{ status: -1, data, originalEvent }`, but the same
 * stream also errors with a plain `{ status: 0 }` on timeout and with an HttpErrorResponse if the
 * POST itself fails. Those carry no `data` and are technical by definition, so anything without a
 * recognisable `error.code` yields undefined and is treated as technical below.
 */
function failureCodeOf(error: unknown): string | undefined {
  const data = (error as { data?: BookingFailure } | undefined)?.data;
  return data?.error?.code;
}

function failureReasonOf(error: unknown): string | undefined {
  const data = (error as { data?: BookingFailure } | undefined)?.data;
  return data?.error?.reason;
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
        // Everything reaching here is already an error; this only decides WHICH error, and the
        // distinction is the whole point - see BookingRefusedError. A deliberate refusal of the
        // chosen session becomes BookingRefusedError ("pick another session"); a technical
        // failure, an unrecognised code, a timeout and an HTTP error all pass through unchanged
        // so the pickers show the generic message.
        catchError(error => {
          const code = failureCodeOf(error);
          if (code !== undefined && SESSION_REFUSAL_CODES.has(code)) {
            return throwError(
              () =>
                new BookingRefusedError(
                  failureReasonOf(error) || 'Provisional hearing slot booking was refused'
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
