import { CourtApplicationPartySummary } from './court-application-party-summary';
import { RespondentSummary } from './respondent-summary';
import { ProsecutionCaseSummary } from './prosecution-case-summary';

export interface CourtApplicationSummary {
  applicant?: CourtApplicationPartySummary;
  subject: CourtApplicationPartySummary;
  applicationReference?: string;
  caseSummaries?: Pick<ProsecutionCaseSummary, 'id' | 'prosecutionCaseIdentifier'>[];
  id?: string;
  respondentSummaries?: RespondentSummary[];
  parentApplicationId?: string;
}
