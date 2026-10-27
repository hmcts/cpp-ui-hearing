import { OrganisationUnit } from '@cpp/reference-data';
import { createAction, props } from '@ngrx/store';

const bookHearingSlots = createAction(
  'BOOK_HEARING_SLOTS',
  props<{
    hearingId: string;
    resultLineId: string;
    bookingId?: string;
    courtScheduleBookings: {
      courtScheduleId: string;
      hearingStartTime?: string;
      duration?: number;
    }[];
    promptRefToValueMap: Record<string, unknown>;
    courtCentre?: OrganisationUnit;
    redirectTo: string[];
  }>()
);

const bookHearingSlotsSuccess = createAction('BOOK_HEARING_SLOTS_SUCCESS');

const setHearingSlotsBookingError = createAction('SET_HEARING_SLOTS_BOOKING_ERROR');

const removeHearingSlotsBookingError = createAction('REMOVE_HEARING_SLOTS_BOOKING_ERROR');

const resetSessionBookedNotification = createAction('RESET_SESSION_BOOKED_NOTIFICATION');

export const HearingSlotsBookingActions = {
  bookHearingSlots,
  bookHearingSlotsSuccess,
  setHearingSlotsBookingError,
  removeHearingSlotsBookingError,
  resetSessionBookedNotification
};
