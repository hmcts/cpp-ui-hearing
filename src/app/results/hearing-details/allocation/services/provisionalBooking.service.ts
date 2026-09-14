import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable()
export class ProvisionalBookingService {
  constructor(private cppHttp: CppHttp) {}

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
      .commandSync<{ bookingId?: string; error?: string }>({
        url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/hearing-slots`,
        requestType: 'application/vnd.hearing.book-provisional-hearing-slots+json',
        successEvent: 'public.hearing.hearing-slots-provisionally-booked',
        body: {
          ...filters,
          ...(bookingId ? { bookingId } : {}),
          slots: courtScheduleBookings
        }
      })
      .pipe(
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
        switchMap(response =>
          response.bookingId
            ? of(response as { bookingId: string })
            : throwError(
                () => new Error(response.error || 'Provisional hearing slot booking was refused')
              )
        )
      );
  }

  /**
   * Releases a previously booked provisional hearing slot hold. This is
   * fire-and-forget: per `hearing.release-provisional-hearing-slots` (see
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
      requestType: 'application/vnd.hearing.release-provisional-hearing-slots+json',
      body: { bookingId }
    });
  }
}
