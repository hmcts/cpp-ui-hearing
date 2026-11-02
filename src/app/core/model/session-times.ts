import { UserDetails } from './shared/user-details';
import { JudicialMember } from './judicial-member';
import { OrganisationUnit } from '@cpp/reference-data';

export interface SessionTimesCourt {
  courtHouseId: string;
  courtRoomId: string;
  amCourtSession?: CourtSession;
  pmCourtSession?: CourtSession;
  courtSessionId?: string;
  courtSessionDate: string;
}

export interface CourtSession {
  startTime?: string;
  endTime?: string;
  judiciaries?: CourtSessionJudiciary[];
  courtClerkId?: string;
  courtAssociateId?: string;
  legalAdviserId?: string;
}

export interface CourtSessionJudiciary {
  judiciaryId?: string;
  judiciaryName?: string;
  benchChairman: boolean;
  index?: number;
  judicialMember?: JudicialMember;
}

export enum SessionTypeEnum {
  AM = 'am',
  PM = 'pm'
}

export interface SelectedJudiciary {
  index: number;
  isEnabled: boolean;
  value: any;
}

export interface SessionTimesCourtForm {
  chairman: number;
  judiciaries: { [index: string]: JudicialMember };
  otherJudiciaries: string[];
  courtClerk: TypeaheadOption;
  courtAssociate: TypeaheadOption;
  legalAdviser: TypeaheadOption;
  startTime: string;
  endTime: string;
}

export type CourtType = 'C' | 'B';

export type CourtOfficersByRole = { [role in CourtOfficerRole]: UserDetails[] };

export type CourtOfficerRole = 'courtClerks' | 'courtAssociate' | 'legalAdvisers';

export interface CourtFilterOptions {
  courtCentre: OrganisationUnit;
  courtRoomId: string;
  sessionDate: string;
}

export type CourtOfficerTypeaheadOptions = { [role in CourtOfficerRole]: TypeaheadOption[] };

export interface TypeaheadOption {
  id: string;
  label: string;
}

export const COURT_CLERKS = 'Court Clerks';
export const COURT_ASSOCIATE = 'Court Associate';
export const LEGAL_ADVISERS = 'Legal Advisers';
