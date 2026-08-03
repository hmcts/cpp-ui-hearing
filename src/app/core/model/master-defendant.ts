import { PersonDefendant } from './person-defendant';
import { Organisation } from './organisation';
import { AssociatedPerson } from '.';

export interface MasterDefendant {
  masterDefendantId: string;
  personDefendant: PersonDefendant;
  legalEntityDefendant?: {
    organisation: Organisation;
  };
  defendantCase?: DefendantCase[];
  associatedPersons?: AssociatedPerson[];
  isYouth?: boolean;
  isGroupMaster?: boolean;
}

export interface DefendantCase {
  defendantId: string;
  caseId: string;
  caseReference: string;
}
