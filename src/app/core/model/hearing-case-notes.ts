import { CourtClerk } from './court-clerk';

export interface HearingCaseNotes {
  id: string;
  courtClerk: CourtClerk;
  note: string;
  noteDateTime: string;
  noteType: string;
  originatingHearingId: string;
  prosecutionCases: string[];
}
