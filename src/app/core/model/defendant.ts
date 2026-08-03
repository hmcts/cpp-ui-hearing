import { Offence } from './offence';
import { AssociatedPerson, MasterDefendant } from '.';
import { AttendanceTypeEnum } from './defendants-attendance';

export interface Defendant extends MasterDefendant {
  id: string;
  defendantId?: string;
  firstName?: string;
  lastName?: string;
  homeTelephone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  address?: Address;
  dateOfBirth?: string;
  bailStatus?: BailStatus;
  prosecutionCaseId: string;
  numberOfPreviousConvictionsCited: number;
  prosecutionAuthorityReference: string;
  witnessStatement: string;
  witnessStatementWelsh: string;
  mitigation: string;
  mitigationWelsh: string;
  offences: Offence[];
  associatedPersons: AssociatedPerson[];
  isYouth?: boolean;
  attendanceType?: AttendanceTypeEnum;
  legalAidStatus?: string;
  courtProceedingsInitiated?: string;
  bulkDefendant?: boolean;
}

export interface BailStatus {
  code: string;
  id: string;
  description: string;
}

export interface Address {
  formatedAddress: string;
  address1: string;
  address2: string;
  address3: string;
  address4: string;
  address5?: string;
  postcode: string;
}

export interface Verdict {
  originatingHearingId: string;
  verdictDate: string;
  verdictType: VerdictType;
  lesserOrAlternativeOffence: LesserOrAlternativeOffence;
  jurors: JurorsInformation;
  offenceId?: string;
  applicationId?: string;
  value?: any;
  isDeleted?: boolean;
}

export interface VerdictType {
  id?: string;
  code?: string;
  category?: string;
  categoryType?: string;
  description?: string;
  sequence?: number;
  validFrom?: string;
  validTo?: string;
  jurisdiction?: string;
  cjsVerdictCode?: string;
}

export interface LesserOffence {
  offenceDefinitionId: string;
  cjsOffenceCode: string;
  title: string;
  legislation: string;
}

export const LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE = 'A';

export interface LesserOrAlternativeOffence {
  offenceDefinitionId: string;
  offenceCode: string;
  offenceTitle: string;
  offenceLegislation?: string;
  description?: string;
}

export interface JurorsInformation {
  numberOfJurors: number;
  numberOfSplitJurors: number;
  unanimous: boolean;
}
