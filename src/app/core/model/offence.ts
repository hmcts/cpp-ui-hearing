import { OffenceType, Verdict } from '.';
import { AllocationDecision, Plea, NotifiedPlea, IndicatedPlea } from './pleas';
import { CustodyTimeLimit } from './custody-time-limit';
import { ReportingRestriction } from './reporting-restriction';
import { OffenceFacts } from './shared/offence-facts';
export interface OffencePreview {
  offenceId: string;
  cjsOffenceCode: string;
  title: string;
  legislation: string;
}

export interface OffenceMap {
  [cjsoffencecode: string]: OffenceType;
}

export interface Offence {
  id: string;
  offenceDefinitionId: string;
  offenceCode: string;
  offenceTitle: string;
  offenceTitleWelsh: string;
  offenceLegislation: string;
  offenceLegislationWelsh: string;
  wording: string;
  wordingWelsh: string;
  startDate: string;
  endDate: string;
  arrestDate: string;
  chargeDate: string;
  orderIndex: number;
  convictionDate: string;
  count: number;
  index: number;
  plea: Plea;
  notifiedPlea: NotifiedPlea;
  verdict: Verdict;
  offenceFacts: OffenceFacts;
  custodyTimeLimit?: CustodyTimeLimit;
  modeOfTrial?: string;
  indictmentParticular?: string;
  indicatedPlea?: IndicatedPlea;
  allocationDecision?: AllocationDecision;
  reportingRestrictions?: ReportingRestriction[];
  isDisposed?: boolean;
  proceedingsConcluded?: boolean;
  statementOfOffence?: {
    title?: string;
    legislation?: string;
  };
  civilOffence?: {
    isExParte?: boolean;
  };
}

export interface OffenceVerdict {
  id: string;
  verdict: VerdictData;
}

export interface VerdictData {
  id: string;
  verdictDate: string;
  value: VerdictContent;
  numberOfJurors: number;
  numberOfSplitJurors: number;
  unanimous: boolean;
}

export interface VerdictContent {
  id: string;
  category: string;
  code: string;
  description: string;
}

export interface UpdateVerdictData {
  defendantId: string;
  offenceId: string;
  prosecutionCaseId: string;
  isDelegatedPowers?: boolean;
  date?: string;
  value?: string;
  verdict?: Verdict;
}
