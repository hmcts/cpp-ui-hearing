import { HearingType } from './shared/hearing-type';
import { CourtApplication } from './court-application';
import { ListingHearingDay } from './shared';
import { ListedCase } from './listed-case';

export interface SearchAvailableHearingsFormOptions {
  hearingId: string;
  caseUrns?: string[];
  jurisdictionType?: string;
  searchCriterias: SearchCriteriaAvailableHearingsType[];
  caseUrnForLinkedCases?: string[];
  returnAllHearings?: boolean;
}

export enum SearchCriteriaAvailableHearingsType {
  CASE_IN_HEARING = 'CASE_IN_HEARING',
  MATCHED_DEFENDANTS = 'MATCHED_DEFENDANTS'
}

export interface AvailableHearing {
  id: string;
  type: HearingType;
  courtApplications?: CourtApplication[];
  courtCentreId: string;
  courtRoomId?: string;
  startDate: string;
  endDate?: string;
  estimatedMinutes: number;
  allocated: boolean;
  jurisdictionType: 'MAGISTRATES' | 'CROWN';
  hearingLanguage: 'ENGLISH' | 'WELSH';
  sequence?: number;
  reportingRestrictionReason?: string;
  listedCases: ListedCase[];
  hearingDays: ListingHearingDay[];
  nonDefaultDays: NonDefaultDay[];
  nonSittingDays: string[];
  prosecutorDatesToAvoid?: string[];
  listingDirections?: string;
}

export interface NonDefaultDay {
  startTime: string;
  duration?: number;
}

export interface RelatedHearingSlot {
  startTime: string;
  courtCentreId: string;
  courtRoomId: string;
  estimatedMinutes?: number;
  hearingType: string;
  hearingId: string;
}
