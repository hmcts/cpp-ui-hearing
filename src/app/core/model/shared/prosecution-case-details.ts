import { Offence } from '..';
import { Defendant } from '../defendant';
import { ProsecutionCaseIdentifier } from './prosecution-case-identifier';
export interface ProsecutionCaseDetails {
  id: string;
  prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  defendants: Defendant[];
  originatingOrganisation: string;
  initiationCode: string;
  caseStatus: string;
  statementOfFacts: string;
  statementOfFactsWelsh: string;
  offences?: Offence[];
  isGroupMember?: boolean;
  isGroupMaster?: boolean;
  offenceType?: string;
  groupId?: string;
  isCivil?: true;
}
