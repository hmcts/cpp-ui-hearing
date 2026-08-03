import { Cluster, HearingType, OrganisationUnit } from '@cpp/reference-data';
import { SearchHearingSlotsParams } from '@cpp/scheduling';

export interface MagistratesSchedulingFilters {
  oucodeL2Code?: string;
  organisationUnit?: OrganisationUnit;
  courtRoomId?: string;
  sessionStartDate: string;
  sessionEndDate?: string;
  courtSession: SearchHearingSlotsParams['courtSession'];
  panel: SearchHearingSlotsParams['panel'];
  rotaBusinessTypeCode?: string;
  availableDurationMins?: number;
  cluster?: Cluster;
  hearingType?: HearingType;
  specialRequirements: string[];
}
