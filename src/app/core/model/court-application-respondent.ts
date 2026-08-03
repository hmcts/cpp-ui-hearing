import { CourtApplicationResponse } from './court-application-response';
import { CourtApplicationParty } from './court-application-party';

export interface CourtApplicationRespondent {
  applicationResponse: CourtApplicationResponse;
  partyDetails: CourtApplicationParty;
}
