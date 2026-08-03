import { CourtApplication } from './court-application';
import { Defendant } from './defendant';
import { Organisation } from './organisation';
import { ProsecutionCaseDetails } from './shared/prosecution-case-details';

export interface DefendantCasesApplications extends Omit<Defendant, 'offences'> {
  courtApplications?: CourtApplication[];
  prosecutionCases?: Omit<ProsecutionCaseDetails, 'defendants'>[];
  defenceOrganisation?: Organisation;
}
