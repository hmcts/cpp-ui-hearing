import { PersonDetails } from './person-details';
import { BailStatus } from './bail-status';
import { EmployerOrganisation } from './employer-organisation';
import { CustodyEstablishment } from './custody-establishment';

export interface PersonDefendant {
  personDetails: PersonDetails;
  bailStatus: BailStatus[];
  custodyTimeLimit: Date;
  perceivedBirthYear: number;
  observedEthnicityId: string;
  observedEthnicityCode: string;
  selfDefinedEthnicityId: string;
  selfDefinedEthnicityCode: string;
  driverNumber: string;
  pncId: string;
  arrestSummonsNumber: string;
  employerOrganisation: EmployerOrganisation;
  employerPayrollReference: string;
  custodialEstablishment?: CustodyEstablishment;
}
