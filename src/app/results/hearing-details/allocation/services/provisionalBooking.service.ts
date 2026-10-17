import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable } from 'rxjs';
import { HEARING_SLOTS_BOOKING_REFUSED_PUBLIC_EVENT } from '../../../../core/constants';

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
      duration?: number;
    }[];
    priority?: string;
  }): Observable<{ bookingId: string }> {
    return this.cppHttp.commandSync<{ bookingId: string }>({
      url: `/hearing-command-api/command/api/rest/hearing/hearings/${hearingId}/hearing-slots`,
      requestType: 'application/vnd.hearing.book-unconfirmed-hearing-slots+json',
      successEvent: 'public.hearing.hearing-slots-provisionally-booked',
      errorEvent: HEARING_SLOTS_BOOKING_REFUSED_PUBLIC_EVENT,
      body: {
        ...filters,
        slots: courtScheduleBookings
      }
    });
  }
}
