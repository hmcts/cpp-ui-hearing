import { Counsel } from './counsel';

export interface DefendantCounsel extends Counsel {
  defendantIds: DefendantId[];
}

export interface DefendantId {
  defendantId: string;
}
