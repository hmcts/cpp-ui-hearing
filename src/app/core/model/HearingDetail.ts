import { CaseMarker } from './case-markers';
import { HearingType } from './shared/hearing-type';
import { HearingDay } from './shared/hearing-day';
import {
  CourtApplication,
  CourtCentre,
  ProsecutionCounsel,
  DefenceCounsel,
  DefendantAttendance,
  HearingCaseNotes,
  ApplicantCounsel,
  RespondentCounsel,
  CompanyRepresentative,
  Defendant
} from '.';
import { Judiciary } from './shared/judiciary';
import { DefendantReferralReason } from './shared/defendant-referral-reason';
import { ProsecutionCaseIdentifier } from './shared/prosecution-case-identifier';

export interface HearingDetail {
  id: string;
  type: HearingType;
  jurisdictionType: string;
  reportingRestrictionReason: string;
  hearingLanguage: string;
  hearingDays: HearingDay[];
  courtApplications: CourtApplication[];
  courtCentre: CourtCentre;
  judiciary: Judiciary[];
  prosecutionCases: ProsecutionCaseDetails[];
  hasSharedResults: boolean;
  defendantReferralReasons: DefendantReferralReason[];
  prosecutionCounsels: ProsecutionCounsel[];
  defenceCounsels: DefenceCounsel[];
  defendantAttendance: DefendantAttendance[];
  hearingCaseNotes: HearingCaseNotes[];
  applicantCounsels: ApplicantCounsel[];
  respondentCounsels: RespondentCounsel[];
  companyRepresentatives: CompanyRepresentative[];
}

export interface ProsecutionCaseDetails {
  id: string;
  caseMarkers: CaseMarker[];
  prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  defendants: Defendant[];
  originatingOrganisation: string;
  initiationCode: string;
  caseStatus: string;
  statementOfFacts: string;
  statementOfFactsWelsh: string;
  bulkCase?: boolean;
}
