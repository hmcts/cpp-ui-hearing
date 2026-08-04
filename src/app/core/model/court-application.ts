import { CourtApplicationType } from '@cpp/reference-data';
import { CourtApplicationOutcome } from './court-application-outcome';
import { CourtApplicationParty } from './court-application-party';
import { CourtApplicationPayment } from './court-application-payment';
import { JudicialResult } from './judicial-result';
import { CourtOrder } from './court-orders';
import { CourtCentre } from './court-centre';
import { Judiciary } from './shared/judiciary';
import {
  AllocationDecision,
  AssociatedPerson,
  IndicatedPlea,
  Offence,
  Organisation,
  Plea,
  Verdict,
} from '.';
import { PersonDefendant } from './person-defendant';
import { CourtApplicationCase } from './court-application-case';

export interface CourtApplication {
  defendantASN?: string;
  name?: string;
  legislation?: string;
  applicant: CourtApplicationParty;
  subject: CourtApplicationParty;
  applicationDecisionSoughtByDate?: string;
  applicationOutcome?: CourtApplicationOutcome;
  applicationParticulars?: string;
  applicationReceivedDate: string;
  applicationReference: string;
  applicationStatus: string;
  courtApplicationPayment?: CourtApplicationPayment;
  id: string;
  dueDate?: string;
  judicialResults?: JudicialResult[];
  linkedApplicationId: string;
  linkedCaseId: string;
  outOfTimeReasons: string;
  respondents: CourtApplicationParty[];
  courtApplicationCases?: CourtApplicationCase[];
  courtOrder?: CourtOrder;
  respondentsNA: boolean;
  type: CourtApplicationType;
  isStandaloneApplication?: boolean;
  parentApplicationId?: string;
  allegationOrComplaintStartDate?: string;
  allegationOrComplaintEndDate?: string;
  commissionerOfOath?: boolean;
  hasSummonsSupplied?: boolean;
  summonsAgreedHearingDate?: string;
  futureSummonsHearing?: FutureSummonsHearing;
  plea?: Plea;
  indicatedPlea?: IndicatedPlea;
  convictionDate?: string;
  verdict?: Verdict;
  modeOfTrial?: string;
  allocationDecision?: AllocationDecision;
  isGroupCaseApplication?: boolean;
  amendmentAllowed?: boolean;
}

export type SubjectCourtApplicationCase = CourtApplicationCase | CourtOrder;
export interface SubjectDefendant {
  id?: string;
  label?: string;
  applicationId: string;
  masterDefendantId: string;
  offences?: Offence[];
  personDefendant: PersonDefendant;
  legalEntityDefendant?: {
    organisation: Organisation;
  };
  prosecutionCases: Array<SubjectCourtApplicationCase & { id: string }>;
  type: CourtApplicationType;
  associatedPersons?: AssociatedPerson[];
  isYouth?: boolean;
  isForApplication?: boolean;
}

export interface FutureSummonsHearing {
  courtCentre: CourtCentre;
  jurisdictionType: 'MAGISTRATES' | 'CROWN';
  judiciary: Judiciary;
  earliestStartDateTime: string;
  weekCommencingDate: WeekCommencing;
  estimatedMinutes: number;
}

export interface WeekCommencing {
  startDate: string;
  // Number of weeks
  duration?: number;
}
