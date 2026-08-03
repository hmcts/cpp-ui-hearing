import { createSelector } from '@ngrx/store';
import {
  extractApplicantRespondentOrAppellantFromCourtApplication,
  getCasesAndApplicationsGroupedByDefendant,
  getCurrentHearing
} from './hearing';
import { SubjectDefendant, CourtApplication, CourtApplicationParty, HearingDetail } from '../model';
import { ProsecutionCaseSummary } from '../model/shared/prosecution-case-summary';

export interface ApplicationSubject extends CourtApplicationParty {
  applicationId: string;
}

export const getSubjectsFromCurrentHearing = createSelector(
  getCurrentHearing,
  getCasesAndApplicationsGroupedByDefendant,
  (hearing, groupedDefendants) => {
    if (!hearing) {
      return [];
    }
    const hasCase = !!hearing.prosecutionCases && hearing.prosecutionCases.length > 0;
    const defendantIds = (groupedDefendants || []).map(
      ({ masterDefendantId }) => masterDefendantId
    );
    return (hearing.courtApplications || []).reduce((subjects, application) => {
      if (
        hasCase &&
        application.subject &&
        application.subject.masterDefendant &&
        defendantIds.includes(application.subject.masterDefendant.masterDefendantId)
      ) {
        return subjects;
      }

      return [...subjects, { ...application.subject, applicationId: application.id }];
    }, [] as ApplicationSubject[]);
  }
);

export const getApplicationsFromCurrentHearing = createSelector(getCurrentHearing, hearing => {
  return (hearing.courtApplications || []).reduce<Record<string, CourtApplication>>(
    (map, application) => {
      return { ...map, [application.id]: application };
    },
    {}
  );
});

export const deriveApplicationCaseSummaries = (
  applications: CourtApplication[]
): ProsecutionCaseSummary[] =>
  (applications || []).reduce(
    (summaries: ProsecutionCaseSummary[], application) =>
      summaries.concat(
        (application.courtApplicationCases || []).map(
          (courtApplicationCase): ProsecutionCaseSummary => ({
            id: courtApplicationCase.prosecutionCaseId || application.id,
            prosecutionCaseIdentifier: courtApplicationCase.prosecutionCaseIdentifier,
            defendants: [],
            isGroupMaster: application.isGroupCaseApplication || undefined
          })
        )
      ),
    []
  );

const allApplicationCaseOffencesConcluded = (applications: CourtApplication[]): boolean =>
  applications.every(application =>
    (application.courtApplicationCases || []).every(applicationCase =>
      (applicationCase.offences || []).every(offence => offence.proceedingsConcluded === true)
    )
  );

const hasCourtApplications = (hearing: HearingDetail): boolean =>
  !!hearing && !!hearing.courtApplications && hearing.courtApplications.length > 0;

const hasNoActiveProsecutionCases = (hearing: HearingDetail): boolean =>
  !hearing.prosecutionCases?.length;

const hasLinkedApplicationCases = (hearing: HearingDetail): boolean =>
  (hearing.courtApplications || []).some(
    application => (application.courtApplicationCases || []).length > 0
  );

export const isStandAloneApplication = (hearing: HearingDetail): boolean =>
  hasCourtApplications(hearing) &&
  hasNoActiveProsecutionCases(hearing) &&
  !hasLinkedApplicationCases(hearing);

export const isConcludedLinkedApplication = (hearing: HearingDetail): boolean =>
  hasCourtApplications(hearing) &&
  hasNoActiveProsecutionCases(hearing) &&
  hasLinkedApplicationCases(hearing) &&
  allApplicationCaseOffencesConcluded(hearing.courtApplications);

export interface ApplicationAggregate {
  applications: CourtApplication[];
  subject: CourtApplicationParty;
  masterDefendant?: SubjectDefendant;
}

export const getFilteredApplications = createSelector(
  getSubjectsFromCurrentHearing,
  getApplicationsFromCurrentHearing,
  extractApplicantRespondentOrAppellantFromCourtApplication,
  (subjects, applicationsMap, subjectDefendants: Record<string, SubjectDefendant>) => {
    const subjectMap = subjects.reduce((appMap, subject) => {
      const application = applicationsMap[subject.applicationId];

      const masterDefendantId = subject.masterDefendant?.masterDefendantId;
      if (masterDefendantId) {
        if (appMap[masterDefendantId]) {
          // Show all applications for the same defendant
          appMap[masterDefendantId].applications.push(application);
        } else {
          appMap[masterDefendantId] = {
            applications: [application],
            subject,
            masterDefendant: subjectDefendants[masterDefendantId]
          };
        }
      } else {
        // Just in case there masterDefendantId is same as the subject id
        appMap[`other-${subject.id}`] = {
          applications: [application],
          subject
        };
      }

      return appMap;
    }, {} as Record<string, ApplicationAggregate>);

    return Object.values(subjectMap);
  }
);
