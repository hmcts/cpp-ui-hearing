import { BasicDefendantVerdict } from './basic-defendant-verdict';

export interface VerdictUpdate {
  caseId: string;
  defendants: BasicDefendantVerdict[];
}
