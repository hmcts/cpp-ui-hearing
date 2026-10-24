import { Offence } from './offence';

export interface HearingPersonDetails {
  firstName: string;
  lastName: string;
  defendantId?: string;
  offences?: Offence[];
  masterDefendantId?: string;
  title?: string;
}
