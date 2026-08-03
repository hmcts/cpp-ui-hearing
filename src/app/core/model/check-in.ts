import { DefenceCounsel } from './defence-counsel';
import { ProsecutionCounsel } from './prosecution-counsel';

export interface CheckInAsDefence {
  hearingId: string;
  defenceCounsel: DefenceCounsel;
}

export interface CheckinProsecutionPayload {
  hearingId: string;
  prosecutionCounsel: ProsecutionCounsel;
}

export interface CheckInPayload {
  defence: CheckInAsDefence[];
  prosecution: CheckinProsecutionPayload[];
}

export interface CheckInAsProsecutor {
  hearingId: string;
  prosecutionCases: string[];
}

export interface HearingSummariesGroupedByCaseId {
  courtroomName: string;
  cases: HearingSummariesGroupedByCaseIdCase[];
}

export interface HearingSummariesGroupedByCaseIdCase {
  caseReference: string;
  caseId: string;
  defendants: {
    hearingId: string;
    name: string;
    id: string;
  }[];
  courtroomName: string;
  hearingId: string;
}

export interface CheckInProsecutorResult {
  error?: {
    data: {
      hearingId: string;
      caseURN: string;
      reason: string;
      prosecutionCounsel: ProsecutionCounsel;
    };
  };
  isError?: boolean;
  hearingId?: string;
}
export interface CheckInOutcomeQueryParams {
  courtHouse: string;
  role: string;
  failedCases?: string;
  numberOfSuccessfulHearings?: number;
}
