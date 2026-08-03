import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable } from 'rxjs';

@Injectable()
export class ProvisionalBookingService {
  constructor(private cppHttp: CppHttp) {}

  bookProvisionalHearingSlots({
    hearingId,
    courtScheduleBookings,
    ...filters
  }: {
    hearingId: string;
    bookingType?: string;
    courtScheduleBookings: {
      courtScheduleId: string;
      hearingStartTime?: string;
    }[];
    priority?: string;
  }): Observable<{ bookingId: string }> {
    return this.cppHttp.commandSync<{ bookingId: string }>({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/hearing-slots`,
      requestType: 'application/vnd.hearing.book-provisional-hearing-slots+json',
      successEvent: 'public.hearing.hearing-slots-provisionally-booked',
      body: {
        ...filters,
        slots: courtScheduleBookings
      }
    });
  }
}
