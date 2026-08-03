import { ProsecutionCaseIdentifier } from '../../core/model/shared/prosecution-case-identifier';
import { HearingDay } from '../../core/model/shared/hearing-day';
import { HearingType } from '../../core/model/shared/hearing-type';
import { CourtApplicationSummary } from '../../core/model/shared/court-application-summary';
import { RespondentSummary } from '../../core/model/shared/respondent-summary';

export interface ProsecutionCaseSummary {
  id: string;
  prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  defendants: Defendant[];
}

export interface Application extends CourtApplicationSummary {
  respondents?: RespondentSummary[];
  respondentName?: string;
  prosecutor?: string;
  firstName?: string;
  lastName?: string;
  organisationName?: string;
  sequence?: number;
  typeDescription?: string;
  sittingDay?: string;
  isChildApplication?: boolean;
  isParentApplication?: boolean;
  applicationId?: string;
  hearingId?: string;
  type: {
    legislation: string;
    type: string;
  };
}

export interface HearingSummary {
  courtApplicationSummaries?: Application[];
  applicationId?: string;
  courtCentreId: string;
  roomId: string;
  id: string;
  type: HearingType;
  prosecutionCaseSummaries: ProsecutionCaseSummary[];
  hearingDays?: HearingDay[];
  sittingDay?: string;
  totalCases?: number;
}

export interface ProsecutionCase {
  id: string;
  prosecutionAuthorityCode: string;
  caseURN?: string;
  prosecutionAuthorityReference?: string;
}
export interface CourtApplicationCase {
  caseStatus?: string;
  isSjp?: string;
  offences?: Offence[];
  prosecutionCaseId?: string;
  prosecutionCaseIdentifier?: ProsecutionCaseIdentifier;
}

export interface Defendant {
  dateOfBirth: string;
  firstName?: string;
  id: string;
  lastName: string;
  middleName: string;
  organisationName?: string;
  offences: Offence[];
  application?: Application;
}

export interface Offence {
  id: string;
  offenceTitle: string;
  wording?: string;
  wordingWelsh?: string;
}

export interface MagistratesHearingSummary {
  courtCentreId: string;
  roomId: string;
  id: string;
  typeDescription: string;
  prosecutionCase?: ProsecutionCase;
  sittingDay: string;
  defendant?: Defendant;
  sequence: string;
  application?: Application;
  totalCases?: number;
}

export interface MagistratesHearing {
  summaries: MagistratesHearingSummary[];
  courtRoomName: string;
  courtCentreName: string;
}
