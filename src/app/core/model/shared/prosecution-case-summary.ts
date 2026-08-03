import { ProsecutionCaseIdentifier } from './prosecution-case-identifier';
import { DefendantName } from '../defendant-name';

export interface ProsecutionCaseSummary {
  id: string;
  prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  defendants: DefendantName[];
  isGroupMaster?: boolean;
  isGroupMember?: boolean;
  offenceType?: string;
}
