import { JudicialMember } from '@cpp/reference-data';

export interface Judiciary {
  firstName: string;
  lastName: string;
  middleName: string;
  title: string;
  judicialId: string;
  judicialRoleType: string;
  judicialMember: JudicialMember;
  isDeputy: boolean;
  isBenchChairman: boolean;
}
