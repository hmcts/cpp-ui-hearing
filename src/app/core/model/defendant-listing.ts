import { Offence } from './offence';
import { BailStatus } from './bail-status';

export interface DefendantListing {
  id: string;
  datesToAvoid?: string;
  hearingLanguageNeeds?: string;
  specificRequirements?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  custodyTimeLimit?: string;
  organisationId?: string;
  organisationName?: string;
  defenceOrganisation?: string;
  offences: Offence[];
  bailStatus: BailStatus;
  restrictFromCourtList?: boolean;
  isYouth?: boolean;
}
