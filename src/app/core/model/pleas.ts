import { PleaType } from '@cpp/reference-data';
import { Defendant, LesserOrAlternativeOffence } from './defendant';
import { Offence } from './offence';

export interface PleaWithIndicatedFlag extends PleaType {
  indicatedPlea?: boolean;
}

export interface NotifiedPlea {
  offenceId: string;
  notifiedPleaDate: string;
  notifiedPleaValue: string;
}

export interface PleaData {
  defendantId: string;
  offenceId: string;
  prosecutionCaseId: string;
  allocationDecision?: AllocationDecision;
  plea?: Plea;
  indicatedPlea?: IndicatedPlea;
  isDelegatedPowers?: boolean;
  date?: string;
  value?: string;
}

export interface ClearPleaInfo {
  offence: Offence;
  defendant: Defendant;
  isIndicatedPlea: boolean;
}

export const allocationCodesIndicatedPleaOnly = ['02', '04', '05'];
export interface IndicatedPleaData extends PleaData {
  hearingId?: string;
  applicationId?: string;
}

export interface GroupedPlea {
  caseURN: string;
  withCount: {
    defendants: Defendant[];
    count: number;
    offenceTitle: string;
    offenceLegislation: string;
    wording: string;
    indictmentParticular: string;
  }[];
  withoutCount: Defendant[];
}

export interface SelectOption {
  id: string;
  value: string;
  label: string;
  code?: string;
  sequenceNumber?: number;
  default?: boolean;
}

export interface UpdatePlea {
  pleas: Plea[];
}

export interface Plea {
  delegatedPowers?: DelegatedPowers;
  originatingHearingId: string;
  pleaDate: string;
  pleaValue: string;
  offenceId?: string;
  applicationId?: string;
  lesserOrAlternativeOffence?: LesserOrAlternativeOffence;
  isDelegatedPowers?: boolean;
}

export interface CourtIndicatedSentence {
  courtIndicatedSentenceTypeId?: string;
  courtIndicatedSentenceDescription?: string;
}
export interface IndicatedPlea {
  indicatedPleaValue: string;
  indicatedPleaDate: string;
  offenceId: string;
  originatingHearingId: string;
  source?: string;
}

export interface AllocationDecision {
  offenceId?: string;
  applicationId?: string;
  allocationDecisionDate?: string;
  originatingHearingId?: string;
  motReasonCode?: string;
  motReasonDescription?: string;
  motReasonId?: string;
  sequenceNumber?: number;
  courtIndicatedSentence?: CourtIndicatedSentence;
  courtDecision?: string;
  prosecutionRepresentation?: string;
  defendantRepresentation?: string;
  indicationOfSentence?: string;
}

interface DelegatedPowers {
  userId: string;
  firstName: string;
  lastName: string;
}

export interface PleaOption {
  value: string;
  label: string;
}

export interface ApplyDecisionPayload {
  offence: Offence;
  defendant: Defendant;
}
