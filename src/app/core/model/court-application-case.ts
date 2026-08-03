import { Offence } from './offence';
import { ProsecutionCaseIdentifier } from './shared/prosecution-case-identifier';

export interface CourtApplicationCase {
  caseStatus?: string;
  prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  prosecutionCaseReference: string;
  offences?: Offence[];
  isSJP: boolean;
  prosecutionCaseId: string;
}
