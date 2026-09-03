import { ActivatedRouteSnapshot, RouterStateSnapshot, Params } from '@angular/router';
import { RouterStateSerializer } from '@ngrx/router-store';
import { AppState } from '../reducers';
import moment from 'moment';
import { Location } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import cleanDeep from 'clean-deep';
import {
  CourtApplication,
  Defendant,
  HearingCaseLink,
  HearingCaseLinkType,
  HearingDetail,
  JurisdictionType,
  Offence,
  ProsecutionCaseDetails,
  SubjectDefendant
} from '../model';
import { BailStatus } from '../model/bail-status';
import { cloneDeep, isUndefined, omitBy, sortBy, findIndex } from 'lodash-es';
import { CourtOrderOffence } from '../model/court-orders';
import { CourtApplicationCase } from '../model/court-application-case';

export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
}

export interface APIEndPoints {
  readonly progressionQuery: string;
  readonly progressionCommand: string;
  readonly resultQuery: string;
  readonly referenceDataQuery: string;
  readonly hearingCommand: string;
  readonly hearingQuery: string;
  readonly userGroupsQuery: string;
  readonly courtOrderQuery: string;
}

export class CustomRouterStateSerializer implements RouterStateSerializer<RouterStateUrl> {
  serialize(routerState: RouterStateSnapshot): RouterStateUrl {
    let params = {};
    let route = routerState.root;

    while (route.firstChild) {
      params = { ...params, ...route.params };
      route = route.firstChild;
    }

    const {
      url,
      root: { queryParams }
    } = routerState;
    return { url, queryParams, params };
  }
}

export const getFlattenedParams = (route: ActivatedRouteSnapshot): { [key: string]: string } => {
  let params = route.params;
  let nextRoute = route.parent;

  while (nextRoute) {
    params = { ...params, ...nextRoute.params };
    nextRoute = nextRoute.parent;
  }
  return params;
};

export const getRouteParams = (state: AppState) => {
  return (
    (state.router &&
      state.router.state &&
      (state.router.state.params as { [key: string]: string })) ||
    {}
  );
};

export function getMomentValue(value: unknown) {
  return (moment.utc(value, moment.ISO_8601).isValid() && moment.utc(value)) || null;
}

export const apiEndPoints: APIEndPoints = {
  progressionCommand: '/progression-command-api/command/api/rest/progression',
  progressionQuery: '/progression-query-api/query/api/rest/progression',
  resultQuery: '/results-query-api/query/api/rest/results/results',
  referenceDataQuery: '/referencedata-query-api/query/api/rest/referencedata',
  hearingCommand: '/hearing-command-api/command/api/rest/hearing',
  hearingQuery: '/hearing-query-api/query/api/rest/hearing',
  userGroupsQuery: '/usersgroups-query-api/query/api/rest/usersgroups',
  courtOrderQuery: '/applicationscourtorders-query-api/query/api/rest/courtorders'
};

/**
 * Use this method to construct a specific endpoint url needed.
 * The base end points for each service has been made available and are strongly typed to the first parameter
 * @example Result service using progression end point to download court pdf documents.
 */
export const constructApiEndPointUrl = <U extends keyof APIEndPoints>(
  apiCallBase: U,
  ...urlParts: string[]
) => {
  const baseUrl = apiEndPoints[apiCallBase];
  return urlParts.reduce((url, part) => {
    part = part.replace(/\s*\\+/g, '/').replace(/\s*\/{2,}/g, '/');
    return Location.joinWithSlash(url, part);
  }, baseUrl);
};

export const downloadResponse = (response: any) =>
  new Blob([response], { type: 'application/pdf' });

export const toHttpParams = (params: any): HttpParams => {
  const cleanedParams = removeEmptyProperties(params);
  return Object.getOwnPropertyNames(cleanedParams).reduce(
    (p, key) => p.set(key, params[key]),
    new HttpParams()
  );
};

export const omitUndefined = <T extends object>(value: T): T => {
  return omitBy(value, isUndefined) as T;
};

export const isNullOrUndefined = (value: any): value is null | undefined =>
  value === null || value === undefined;

const removeEmptyProperties = (options: any): any => {
  return cleanDeep(options);
};

export const getLastChildComponentTitle = (a: ActivatedRouteSnapshot): string => {
  if (a.children && a.children.length > 0) {
    return getLastChildComponentTitle(a.children[0]);
  }

  return a.data.title || '';
};

/**
 * Sorts defendants ascendingly by 1.lastName 2.firstName 3.dateOfBirth property
 * If defendant is an organisation we only consider its name for sorting
 * @param defendants unsorted defendants
 * @returns sorted defendants
 */
export const sortDefendants = (defendants: Defendant[]): Defendant[] => {
  return sortBy(defendants, ({ personDefendant, legalEntityDefendant }) => {
    if (personDefendant && personDefendant.personDetails) {
      const { firstName, lastName, dateOfBirth } = personDefendant.personDetails;
      return [lastName, firstName, moment(dateOfBirth, 'YYYY/MM/DD').unix()];
    }

    if (legalEntityDefendant && legalEntityDefendant.organisation) {
      const { name } = legalEntityDefendant.organisation;

      return [name];
    }

    return [];
  });
};

/**
 * Sorts offences by count and orderIndex
 * @param offences unsorted offences
 * @returns sorted offences
 */
export const sortOffences = (
  offences: Offence[],
  jurisdictionType: JurisdictionType
): Offence[] => {
  const clonedOffences = cloneDeep(offences);

  if (jurisdictionType === 'MAGISTRATES') {
    return sortBy(clonedOffences, ['orderIndex']);
  }

  const countInfinityOffences = clonedOffences.map(offence => {
    if (offence.count === 0) {
      offence.count = Infinity;
    }

    return offence;
  });
  const sortedOffences = sortBy(countInfinityOffences, ['count', 'orderIndex']);
  sortedOffences.forEach(sortedOffence => {
    if (sortedOffence.count === Infinity) {
      sortedOffence.count = 0;
    }
  });

  return sortedOffences;
};

/**
 * Eliminate defendants who are same person based on defendantId and masterDefendantId
 * @param defendants all defendants
 * @returns distinct defendants
 */
export const getDistinctDefendants = (defendants: Defendant[]): Defendant[] => {
  const groupedDefendants = new Map<string, Defendant>();

  for (const defendant of defendants) {
    const key = defendant.masterDefendantId;
    const rawBailStatus: BailStatus | BailStatus[] | undefined =
      defendant.personDefendant?.bailStatus;
    const currentBailStatuses = Array.isArray(rawBailStatus)
      ? rawBailStatus
      : rawBailStatus
      ? [rawBailStatus]
      : [];

    if (!groupedDefendants.has(key)) {
      const newDefendant: Defendant = {
        ...defendant,
        personDefendant: {
          ...defendant.personDefendant,
          bailStatus: currentBailStatuses
        }
      };
      groupedDefendants.set(key, newDefendant);
    } else {
      const existingDefendant = groupedDefendants.get(key)!;

      existingDefendant.personDefendant.bailStatus.push(...currentBailStatuses);
    }
  }

  return Array.from(groupedDefendants.values());
};

/**
 * Eliminate offences by its offenceDefinitionId to avoid duplicated offence to be in the array
 * @param defendants defendants that has offences
 * @returns distinct offences from all defendants
 */
export const getDistinctOffencesFromDefendants = (defendants: Defendant[]): Offence[] => {
  const offences = defendants.reduce(
    (acc, defendant) => acc.concat(defendant.offences),
    [] as Offence[]
  );

  return offences.reduce((acc, offence) => {
    const isOffenceInArray = acc.some(o => o.offenceDefinitionId === offence.offenceDefinitionId);

    if (!isOffenceInArray) {
      return acc.concat([offence]);
    }

    return acc;
  }, [] as Offence[]);
};

/**
 * @param defendants defendants that has offences
 * @returns offences regardless of duplication
 */
export const getFlattenOffencesFromDefendants = (defendants: Defendant[]): Offence[] => {
  return defendants.reduce((acc, defendant) => acc.concat(defendant.offences), [] as Offence[]);
};

/**
 * Returns cases by given defendant across all cases
 * @param defendant defendant to find cases who belongs to
 * @param hearing hearing detail, including all prosecution cases
 * @returns array of cases along with defendant
 */
export const getCasesByDefendant = (
  defendant: Defendant,
  hearing: HearingDetail
): Omit<ProsecutionCaseDetails, 'defendants'>[] => {
  const { prosecutionCases = [] } = hearing;

  const casesByDefendant: Omit<ProsecutionCaseDetails, 'defendants'>[] = [];

  for (const prosecutionCase of prosecutionCases) {
    if (
      prosecutionCase.defendants.some(
        defendantFromCase =>
          defendantFromCase.masterDefendantId === defendant.masterDefendantId ||
          defendantFromCase.id === defendant.masterDefendantId ||
          defendantFromCase.masterDefendantId === defendant.id
      )
    ) {
      const { defendants, ...rest } = prosecutionCase;
      const caseDefendant = defendants.find(
        defendantFromCase =>
          defendantFromCase.masterDefendantId === defendant.masterDefendantId ||
          defendantFromCase.id === defendant.masterDefendantId ||
          defendantFromCase.masterDefendantId === defendant.id
      );
      rest.offences = sortOffences(caseDefendant.offences, hearing.jurisdictionType);

      casesByDefendant.push(rest);
    }
  }

  return casesByDefendant;
};

/**
 * Finds all applications by the given defendant across all cases
 * @param defendant defendant to get its all applications
 * @param hearing hearing details that contains applications
 * @returns applications belong to given defendant
 */
export const getApplicationsByDefendant = (
  defendant: Defendant,
  hearing: HearingDetail
): CourtApplication[] => {
  const { courtApplications = [] } = hearing;
  const courtApplicationsForCurrentDefendant: CourtApplication[] = [];
  const independentCourtApplications: CourtApplication[] = [];
  const clearCourtOrderIfAlreadyAdded = (courtOrderOffence: CourtOrderOffence) => {
    for (const courtApplication of courtApplicationsForCurrentDefendant) {
      if (courtApplication.courtOrder && courtApplication.courtOrder.courtOrderOffences) {
        const existingOffenceIndex = findIndex(courtApplication.courtOrder.courtOrderOffences, {
          offence: { id: courtOrderOffence.offence.id }
        });

        if (existingOffenceIndex !== -1) {
          courtApplication.courtOrder.courtOrderOffences.splice(existingOffenceIndex, 1);
          return;
        }
      }
    }
  };

  courtApplications.forEach(courtApplication => {
    if (
      courtApplication.subject &&
      courtApplication.subject.masterDefendant &&
      courtApplication.subject.masterDefendant.masterDefendantId === defendant.masterDefendantId
    ) {
      const { courtOrder, ...courtApplicationRest } = courtApplication;
      let courtApplicationToAdd: CourtApplication = courtApplicationRest;

      if (courtOrder && courtOrder.courtOrderOffences) {
        const courtOrderOffences: CourtOrderOffence[] = [];

        courtOrder.courtOrderOffences.forEach(co => {
          clearCourtOrderIfAlreadyAdded(co);

          courtOrderOffences.push(co);
        });

        if (courtOrderOffences.length) {
          courtApplicationToAdd = {
            ...courtApplication,
            courtOrder: { ...courtOrder, courtOrderOffences }
          };
        }
        courtApplicationsForCurrentDefendant.push(courtApplicationToAdd);
      } else {
        // This application is related to the current defendant but has no court orders
        // so its an independent application
        independentCourtApplications.push(courtApplicationRest);
      }
    }
  });

  // Make sure that independent applications appear last. i.e the same order as the "Enter Result" page
  return [...courtApplicationsForCurrentDefendant, ...independentCourtApplications];
};

/**
 * Gets defendants who have the given offence
 * @param offence offence to be searched across defendants
 * @param defendants searched across this defendants for given offence
 * @returns defendants that has the given offence
 */
export const getDefendantsContainsOffence = (
  offence: Offence,
  defendants: Defendant[]
): Defendant[] => {
  return defendants
    .filter(defendant =>
      defendant.offences.some(
        dOffence =>
          dOffence.offenceDefinitionId === offence.offenceDefinitionId &&
          dOffence.count === offence.count
      )
    )
    .map(({ offences, ...defendantWithoutOffence }) => ({
      ...defendantWithoutOffence,
      offences: offences.filter(
        o => o.offenceDefinitionId === offence.offenceDefinitionId && o.count === offence.count
      )
    }));
};

type CasesOrCourtOrderOffences = CourtApplicationCase | CourtOrderOffence;
export const groupApplicantRespondentOrAppellantFromCourtApplication = (
  hearing: HearingDetail,
  relatedAppId?: string
) => {
  if (hearing?.courtApplications?.length === 0) {
    return {};
  }

  return (hearing.courtApplications || []).reduce(
    (acc, { applicant, subject, type, courtApplicationCases, courtOrder, id: applicationId }) => {
      if (!subject.masterDefendant || !subject.masterDefendant.masterDefendantId) {
        return acc;
      }

      const { masterDefendant } = subject;
      const masterDefendantId = masterDefendant.masterDefendantId;
      const id = masterDefendantId;

      if (acc[id] && relatedAppId && acc[id].applicationId === relatedAppId) {
        return acc;
      }

      const isYouth = masterDefendant.isYouth;
      const { associatedPersons } = masterDefendant;
      const personDefendant = masterDefendant.personDefendant;
      const offences = courtApplicationCases?.length > 0 ? courtApplicationCases[0]?.offences : [];
      const isForApplication = applicant?.masterDefendant ? true : false;

      // i do not see the need for the id being added here but upon removal , UI seems to be failing
      // This will require further investigation
      // The previous code mapped the prosecutionCaseId to attribute id which was confusing
      // so to maintain functionality , that implementation is kept here.
      const prosecutionCases = (
        (courtApplicationCases ??
          courtOrder?.courtOrderOffences ??
          []) as CasesOrCourtOrderOffences[]
      ).reduce((cases, caseOrCourtOrderOffence) => {
        if (
          caseOrCourtOrderOffence.prosecutionCaseId ===
          (masterDefendant?.defendantCase ?? [])[0]?.caseId
        ) {
          return [
            ...cases,
            { ...caseOrCourtOrderOffence, id: caseOrCourtOrderOffence.prosecutionCaseId }
          ];
        }
        return cases;
      }, [] as (CasesOrCourtOrderOffences & { id: string })[]);

      const legalEntityDefendant = masterDefendant.legalEntityDefendant;
      const label = id == applicant.masterDefendant?.masterDefendantId ? 'applicant' : 'respondent';

      if (legalEntityDefendant) {
        return {
          ...acc,
          [id]: {
            id,
            applicationId,
            associatedPersons,
            isYouth,
            legalEntityDefendant,
            masterDefendantId,
            type,
            prosecutionCases,
            offences,
            label,
            isForApplication
          } as SubjectDefendant
        };
      }

      return {
        ...acc,
        [id]: {
          id,
          applicationId,
          associatedPersons,
          isYouth,
          personDefendant,
          masterDefendantId,
          type,
          prosecutionCases,
          offences,
          label,
          isForApplication
        } as SubjectDefendant
      };
    },
    {} as Record<string, SubjectDefendant>
  );
};

export const resolveProceedingsConcluded = (hearing?: HearingDetail | null): boolean => {
  if (!hearing) {
    return false;
  }

  const { courtApplications = [], prosecutionCases = [] } = hearing;

  // Offences under court applications
  const courtApplicationOffences = courtApplications.reduce(
    (acc, application) =>
      (application.courtApplicationCases || []).reduce(
        (caseAcc, courtCase) => caseAcc.concat(courtCase.offences || []),
        acc
      ),
    [] as Offence[]
  );
  if (courtApplicationOffences.length > 0) {
    return isAnyOffenceConcluded(courtApplicationOffences);
  }

  // A court order with no offences is treated as an active offence
  if (courtApplications.some(application => !!application.courtOrder)) {
    return false;
  }

  // Offences under prosecution cases (nested under defendants, plus any case-level offences)
  const prosecutionCaseOffences = prosecutionCases.reduce(
    (acc, prosecutionCase) =>
      acc
        .concat(getFlattenOffencesFromDefendants(prosecutionCase.defendants || []))
        .concat(prosecutionCase.offences || []),
    [] as Offence[]
  );
  if (prosecutionCaseOffences.length > 0) {
    return isAnyOffenceConcluded(prosecutionCaseOffences);
  }

  return false;
};

const isAnyOffenceConcluded = (offences: Offence[]): boolean =>
  offences.some(offence => offence?.proceedingsConcluded === true);

export const getHearingCaseUrl = (hearingId: string, hearingCaseLink: HearingCaseLink) => {
  const { caseId, applicationId, type } = hearingCaseLink;

  switch (type) {
    case HearingCaseLinkType.APPLICATION_MATERIAL:
      return `case-materials?applicationId=${applicationId}&hearingId=${hearingId}`;

    case HearingCaseLinkType.CASE_MATERIAL:
      return `case-materials?caseId=${caseId}&hearingId=${hearingId}`;

    case HearingCaseLinkType.APPLICATION_AT_A_GLANCE:
      return `application-at-a-glance/${applicationId}`;

    case HearingCaseLinkType.CASE_AT_A_GLANCE:
      return `case-at-a-glance/${caseId}`;

    case HearingCaseLinkType.ADD_APPLICATION:
      //TODO: This needs to be re-visited
      if (!caseId) {
        return `application/select-type?hearingId=${hearingId}`;
      }

      // With active cases
      return `application/select-type?hearingId=${hearingId}&caseId=${caseId}`;

    case HearingCaseLinkType.ADD_CHILD_APPLICATION:
      return `application/select-type?caseId=${caseId}&hearingId=${hearingId}&parentApplicationId=${applicationId}`;

    default:
      return '';
  }
};
