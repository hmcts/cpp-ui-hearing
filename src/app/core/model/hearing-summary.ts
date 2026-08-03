import { ProsecutionCaseSummary } from './shared/prosecution-case-summary';
import { CourtApplicationSummary } from './shared/court-application-summary';
import { HearingBase } from './hearing-detail';

export interface HearingSummary extends HearingBase {
  prosecutionCaseSummaries: ProsecutionCaseSummary[];
  courtApplicationSummaries: CourtApplicationSummary[];
  numberOfGroupCases?: number;
}
