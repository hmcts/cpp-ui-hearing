/**/
import { ApplicantCounsel } from './applicant-counsel';
import { CourtApplication } from './court-application';
import { DefenceCounsel } from './defence-counsel';
import { ProsecutionCounsel } from './prosecution-counsel';
import { RespondentCounsel } from './respondent-counsel';
import { DefendantReferralReason } from './shared/defendant-referral-reason';
import { HearingDay } from './shared/hearing-day';
import { HearingType } from './shared/hearing-type';
import { Judiciary } from './shared/judiciary';
import { CompanyRepresentative } from './company-representative';
import { IntermediaryCounsel } from './intermediaryCounsel';
import { CourtCentre } from './court-centre';
import { TierAndListType } from './shared/tier-and-list-type';
import { TrialType } from './shared/trial-type';
import { ProsecutionCaseDetails } from './shared/prosecution-case-details';
import { HearingCaseNotes } from './hearing-case-notes';
import { DefendantAttendance } from './defendants-attendance';
import { UserDetails } from '@cpp/users-groups';
import { ApprovalRequest } from './approval-request';

export interface HearingDetailRedux extends HearingDetailResponse {
  amendedByUser?: UserDetails;
  trackingStatus?: TrackingStatus[];
}

export interface ElectronicMonitoringDefendant {
  defendantId: string;
  trackingStatus: TrackingStatus[];
}

export interface TrackingStatus {
  offenceId: string;
  emStatus: boolean;
  emLastModifiedTime: string;
  woaStatus: boolean;
  woaLastModifiedTime: string;
}

export interface HearingDetailResponse {
  hearing: HearingDetail;
  draftHearing?: HearingDetail;
  hearingState: HearingLockState;
  amendedByUserId?: string;
  totalCases?: number;
  electronicMonitoring?: ElectronicMonitoringDefendant[];
  witnesses?: string[];
  firstSharedDate?: string;
  relatedApplicationId?: string;
  courtApplicationAdditionalFields?: Record<string, { allowAmendment: boolean }>;
}

export interface HearingBase {
  id: string;
  type: HearingType;
  jurisdictionType: JurisdictionType;
  reportingRestrictionReason?: string;
  hearingLanguage: string;
  hearingDays: HearingDay[];
  hasSharedResults: boolean;
  courtCentre?: CourtCentre;
}

export interface HearingDetail extends HearingBase {
  courtApplications?: CourtApplication[];
  courtCentre: CourtCentre;
  judiciary: Judiciary[];
  prosecutionCases: ProsecutionCaseDetails[];
  defendantReferralReasons: DefendantReferralReason[];
  prosecutionCounsels: ProsecutionCounsel[];
  intermediaries?: IntermediaryCounsel[];
  defenceCounsels: DefenceCounsel[];
  defendantAttendance: DefendantAttendance[];
  hearingCaseNotes: HearingCaseNotes[];
  applicantCounsels: ApplicantCounsel[];
  respondentCounsels: RespondentCounsel[];
  companyRepresentatives?: CompanyRepresentative[];
  isBoxHearing?: boolean;
  boxWorkAssignedUserId?: string;
  boxWorkTaskId?: string;
  boxWorkTaskStatus?: string;
  crackedIneffectiveTrial?: TrialType;
  tierAndListType?: TierAndListType;
  isEffectiveTrial?: boolean;
  isVacatedTrial?: boolean;
  approvalsRequested?: ApprovalRequest[];
  earliestNextHearingDate?: string;
  youthCourtDefendantIds: string[];
}

export enum HearingLockState {
  INITIALISED = 'INITIALISED',
  SHARED = 'SHARED',
  SHARED_AMEND_LOCKED_ADMIN_ERROR = 'SHARED_AMEND_LOCKED_ADMIN_ERROR',
  SHARED_AMEND_LOCKED_USER_ERROR = 'SHARED_AMEND_LOCKED_USER_ERROR',
  VALIDATED = 'VALIDATED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED'
}

export type JurisdictionType = 'CROWN' | 'MAGISTRATES' | 'YOUTH';

export interface HearingListFilters {
  hearingId?: string;
  hearingDate: string;
  courtCentreName: string;
  courtCentreId: string;
  courtRoomName: string;
  courtRoomId: string;
  startTimeFilter: string;
  endTimeFilter: string;
}
