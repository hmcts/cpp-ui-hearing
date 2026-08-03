import { CourtApplication, CourtApplicationResponseType } from '.';
import { CourtApplicationOutcomeType } from './court-application-outcome-type';

interface ApplicationTypeMap {
  name: string;
  legislation: string;
  applications: CourtApplication[];
}

export interface ApplicationByTypeMap {
  [key: string]: ApplicationTypeMap;
}

export interface ApplicationOutcomeTypeByApplicationMap {
  [key: string]: CourtApplicationOutcomeType[];
}

export interface ApplicationResponseTypeByApplicationMap {
  [key: string]: CourtApplicationResponseType[];
}
