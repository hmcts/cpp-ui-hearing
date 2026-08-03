import { Offence } from './offence';
import { Organisation } from './organisation';

export interface DefendantName {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  organisationName?: string;
  masterDefendantId?: string;
  courtProceedingsInitiated?: string;
  legalEntityDefendant?: {
    organisation: Organisation;
  };
  offences?: Offence[];
}
