import { CourtOrder } from './court-orders';
import { CourtApplicationType } from '@cpp/reference-data';
export interface BreachedApplication {
  courtOrder: CourtOrder;
  applicationType: CourtApplicationType;
}

export interface DefendantBreachApplication {
  hearingId: string;
  masterDefendantId: string;
  breachedApplications: BreachedApplication[];
}
