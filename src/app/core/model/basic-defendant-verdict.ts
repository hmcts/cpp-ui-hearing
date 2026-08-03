import { OffenceVerdict } from './offence';

export interface BasicDefendantVerdict {
  id: string;
  personId: string;
  offences: OffenceVerdict[];
}
