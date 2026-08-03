import { CourtApplicationOutcomeType } from './court-application-outcome-type';

export interface CourtApplicationOutcome {
  applicationId: string;
  applicationOutcomeDate: string;
  applicationOutcomeType: CourtApplicationOutcomeType;
  originatingHearingId: string;
}
