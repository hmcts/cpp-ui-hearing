import { OrganisationUnit } from '@cpp/reference-data';
import { createAction, props } from '@ngrx/store';
import { HearingSlotsBookingPublicEventError } from '../../hearing-details/allocation/types/allocation';

const bookHearingSlots = createAction(
  'BOOK_HEARING_SLOTS',
  props<{
    hearingId: string;
    resultLineId: string;
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

const setHearingSlotsBookingError = createAction(
  'SET_HEARING_SLOTS_BOOKING_ERROR',
  props<{ hearingSlotsBookingError: HearingSlotsBookingPublicEventError }>()
);

const removeHearingSlotsBookingError = createAction('REMOVE_HEARING_SLOTS_BOOKING_ERROR');

const resetSessionBooked = createAction('RESET_SESSION_BOOKED');

export const HearingSlotsBookingActions = {
  bookHearingSlots,
  bookHearingSlotsSuccess,
  setHearingSlotsBookingError,
  removeHearingSlotsBookingError,
  resetSessionBooked
};
