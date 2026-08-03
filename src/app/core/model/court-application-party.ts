import { Organisation } from './organisation';
import { Person } from './person';
import { AssociatedPerson } from './associated-person';
import { ProsecutingAuthority } from './prosecuting-authority';
import { MasterDefendant } from './master-defendant';

export interface CourtApplicationParty {
  id: string;
  masterDefendant?: MasterDefendant;
  organisationPersons?: AssociatedPerson[];
  prosecutingAuthority?: ProsecutingAuthority;
  organisation?: Organisation;
  personDetails?: Person;
  representationOrganisation?: Organisation;
  synonym?: string;
  notificationRequired?: boolean;
  summonsRequired?: boolean;
  type?: string;
}
