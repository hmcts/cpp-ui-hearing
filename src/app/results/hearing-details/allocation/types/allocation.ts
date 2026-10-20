import { NotificationEvent } from '@cpp/core';
import { Cluster, HearingType, OrganisationUnit } from '@cpp/reference-data';
import { SearchHearingSlotsParams } from '@cpp/scheduling';

export interface MagistratesSchedulingFilters {
  oucodeL2Code?: string;
  organisationUnit?: OrganisationUnit;
  courtRoomId?: string;
  sessionStartDate: string;
  sessionEndDate?: string;
  courtSession: SearchHearingSlotsParams['courtSession'];
  panel: SearchHearingSlotsParams['panel'];
  rotaBusinessTypeCode?: string;
  availableDurationMins?: number;
  cluster?: Cluster;
  hearingType?: HearingType;
  specialRequirements: string[];
}

export enum HearingSlotsBookingErrorType {
  BUSINESS = 'BUSINESS',
  TECHNICAL = 'TECHNICAL'
}

export enum HearingSlotsBookingErrorCode {
  NO_CAPACITY = 'NO_CAPACITY',
  NO_SESSION_AVAILABLE = 'NO_SESSION_AVAILABLE',
  COURTSCHEDULER_ERROR = 'COURTSCHEDULER_ERROR'
}

export interface HearingSlotsBookingPublicEventError extends NotificationEvent {
  bookingId?: string;
  error: {
    type: HearingSlotsBookingErrorType;
    code: HearingSlotsBookingErrorCode;
    reason: string;
  };
}

export const HEARING_SLOTS_BOOKING_ERROR_MESSAGE_KEYS: Partial<
  Record<HearingSlotsBookingErrorCode, string>
> = {
  [HearingSlotsBookingErrorCode.NO_CAPACITY]: 'MANAGE_HEARING.SESSION_NOT_AVAILABLE',
  [HearingSlotsBookingErrorCode.NO_SESSION_AVAILABLE]: 'MANAGE_HEARING.SESSION_NOT_AVAILABLE'
};
