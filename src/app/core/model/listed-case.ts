import { CaseMarker } from './case-markers';
import { DefendantListing } from './defendant-listing';

export interface ListedCase {
  id: string;
  caseIdentifier: CaseIdentifier;
  markers?: CaseMarker[];
  defendants: DefendantListing[];
  restrictFromCourtList?: boolean;
  isCivil?: boolean;
}

export interface CaseIdentifier {
  authorityId: string;
  authorityCode: string;
  caseReference: string;
}
