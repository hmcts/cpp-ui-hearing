import { CourtApplicationResponseType } from './court-application-response-type';

export interface CourtApplicationResponse {
  applicationId: string;
  applicationResponseDate: string;
  applicationResponseType: CourtApplicationResponseType;
  originatingHearingId: string;
}
