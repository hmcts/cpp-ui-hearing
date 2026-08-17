import { createSelector } from '@ngrx/store';
import { groupBy, uniqBy, sortBy } from 'lodash-es';
import moment from 'moment';
import {
  Offence,
  HearingPersonDetails,
  HearingDetail,
  Defendant,
  HearingSummariesGroupedByCaseId,
  HearingSummary,
  CheckInHearingSummary,
  DefendantCasesApplications,
  ProsecutionCaseDetails,
  PleaOption,
  PleaWithIndicatedFlag,
  HearingBase,
  GroupedPlea,
  IndividualDefendant,
  CourtApplicationParty,
  AttendanceTypeEnum,
  HearingSummariesGroupedByCaseIdCase,
  AmendmentReason,
  ADMIN_ERROR_REASON_CODE,
  ProsecutionCounsel,
  DefenceCounsel,
  CompanyRepresentative,
  IntermediaryCounsel
} from '../model';
import { HearingLockState } from '../model/hearing-detail';
import { AppState } from '../reducers';
import {
  getApplicationsByDefendant,
  getCasesByDefendant,
  getDefendantsContainsOffence,
  getDistinctDefendants,
  getFlattenOffencesFromDefendants,
  getRouteParams,
  groupApplicantRespondentOrAppellantFromCourtApplication,
  sortDefendants,
  sortOffences
} from '../utils/utils';
import { CourtApplication } from '../model/court-application';
import { getCPPDate } from '../utils/cpp-date';
import { getRouteQueryParams } from './route';
import { getPleaTypes } from './reference-data';
import { getOrganisationUnits, PleaType, SummonsTemplateType } from '@cpp/reference-data';
import { getUserDetails } from '@cpp/users-groups';
import { ListingNote } from '@cpp/scheduling';
import { canAmendApplication } from './user-groups';
import { CrackedIneffectiveSubReason } from '../model/shared/cracked-ineffective-sub-reason';
import { TierAndListType } from '../model/shared/tier-and-list-type';

const byPersonLastName = (a: Defendant, b: Defendant) => {
  if (a.personDefendant && b.personDefendant) {
    return a.personDefendant.personDetails.lastName > b.personDefendant.personDetails.lastName
      ? 1
      : -1;
  } else if (a.legalEntityDefendant && b.legalEntityDefendant) {
    return a.legalEntityDefendant.organisation.name > b.legalEntityDefendant.organisation.name
      ? 1
      : -1;
  }

  return 0;
};

const extractIndividualDefendantsFromHearing = (defendants: Defendant[]): IndividualDefendant[] => {
  const individualDefendants: IndividualDefendant[] = [];

  const sortedDefendants = [...defendants];
  sortedDefendants.sort(byPersonLastName);
  sortedDefendants
    .filter(defendant => !!defendant.personDefendant && !!defendant.personDefendant.personDetails)
    .forEach(defendant => {
      individualDefendants.push({
        ...defendant.personDefendant.personDetails,
        defendantId: defendant.id,
        masterDefendantId: defendant.masterDefendantId
      });
    });
  return individualDefendants;
};

const extractIndividualDefendantsFromApplication = (
  applications: CourtApplication[]
): IndividualDefendant[] => {
  const individualDefendants: IndividualDefendant[] = [];

  applications
    .filter(
      ({ subject }) =>
        !!subject.masterDefendant &&
        !!subject.masterDefendant.personDefendant &&
        !!subject.masterDefendant.personDefendant.personDetails
    )
    .forEach(({ subject }) => {
      individualDefendants.push({
        ...subject.masterDefendant.personDefendant.personDetails,
        defendantId: subject.id,
        masterDefendantId: subject.masterDefendant.masterDefendantId
      });
    });

  return individualDefendants;
};

const extractHearingPersonDetailsFromDefendants = (defendants: Defendant[]) => {
  const hearingPersonDetails: HearingPersonDetails[] = [];

  const sortedDefendants = [...defendants];
  sortedDefendants.sort(byPersonLastName);
  sortedDefendants.forEach(defendant => {
    hearingPersonDetails.push({
      firstName: defendant.personDefendant
        ? defendant.personDefendant.personDetails.firstName
        : defendant.legalEntityDefendant.organisation.name,
      lastName: defendant.personDefendant ? defendant.personDefendant.personDetails.lastName : '',
      defendantId: defendant.id,
      offences: defendant.offences,
      masterDefendantId: defendant.masterDefendantId
    });
  });
  return hearingPersonDetails;
};

const extractDefendants = (hearing: HearingDetail) => {
  let defendants: HearingPersonDetails[] = [];
  if (!hearing || !hearing.prosecutionCases) {
    return [];
  }
  if (hearing?.prosecutionCases && hearing?.prosecutionCases.length > 0) {
    hearing.prosecutionCases.forEach(aCase => {
      const sortedDefendants = [...aCase.defendants];
      sortedDefendants.sort(byPersonLastName);
      sortedDefendants.forEach(defendant => {
        defendants.push({
          firstName: defendant.personDefendant
            ? defendant.personDefendant.personDetails.firstName
            : defendant.legalEntityDefendant.organisation.name,
          lastName: defendant.personDefendant
            ? defendant.personDefendant.personDetails.lastName
            : '',
          defendantId: defendant.id,
          offences: defendant.offences
        });
      });
    });
  }

  if (!!hearing.courtApplications && hearing.courtApplications.length > 0) {
    const courtApplication = hearing.courtApplications[0];
    const hasCourtAppllicationCases =
      !!courtApplication.courtApplicationCases &&
      courtApplication.courtApplicationCases.length > 0 &&
      courtApplication.courtApplicationCases[0].caseStatus === 'INACTIVE';
    if (hasCourtAppllicationCases || !!courtApplication.courtOrder) {
      defendants.push(...getApplicationSubjectAsCaseDefendant(hearing.courtApplications));
    }
  }
  return defendants;
};

const extractRespondents = (hearing: HearingDetail) => {
  const respondents: HearingPersonDetails[] = [];
  if (!hearing || !hearing.courtApplications) {
    return [];
  }
  // TODO: refactor this when BE sends the data in consistent format across different types of cases
  hearing.courtApplications.forEach((courtApplication: CourtApplication) => {
    if (courtApplication.respondents) {
      courtApplication.respondents.forEach(respondent => {
        if (respondent) {
          if (respondent.masterDefendant) {
            respondents.push({
              firstName: respondent.masterDefendant.personDefendant
                ? respondent.masterDefendant.personDefendant.personDetails.firstName
                : respondent.masterDefendant.legalEntityDefendant.organisation.name,
              lastName: respondent.masterDefendant.personDefendant
                ? respondent.masterDefendant.personDefendant.personDetails.lastName
                : ''
            });
          } else if (respondent.personDetails) {
            respondents.push({
              firstName: respondent.personDetails.firstName,
              lastName: respondent.personDetails.lastName
            });
          }
        }
      });
    }
  });
  return respondents;
};

const extractOffences = (hearing: HearingDetail): Offence[] => {
  const prosecutionCaseOffences = (hearing.prosecutionCases || [])
    .reduce(
      (mergedDefendants: Defendant[], { defendants }) => [...mergedDefendants, ...defendants],
      []
    )
    .reduce((mergedOffences: Offence[], { offences }) => [...mergedOffences, ...offences], []);

  const applicationOffences = (hearing.courtApplications || []).reduce((offences, application) => {
    const offencesFromCases = (application.courtApplicationCases || []).reduce(
      (relatedOffences, applicationCase) => [
        ...relatedOffences,
        ...(applicationCase.offences || [])
      ],
      offences
    );

    if (application.courtOrder) {
      return [
        ...offencesFromCases,
        ...application.courtOrder.courtOrderOffences.map(({ offence }) => offence)
      ];
    }

    return offencesFromCases;
  }, [] as Offence[]);

  return [...prosecutionCaseOffences, ...applicationOffences];
};

const extractDefenceCouncils = (hearing: HearingDetail, selectedHearindDate: string) => {
  if (!hearing || !hearing.prosecutionCases) {
    return [];
  }

  return hearing.defenceCounsels
    .filter(c => (c.attendanceDays || []).includes(selectedHearindDate))
    .map(dCounsel => ({
      firstName: dCounsel.firstName,
      lastName: dCounsel.lastName
    }));
};

const extractUrns = (hearing: HearingDetail) => {
  if (!hearing) {
    return undefined;
  }

  const urns: Set<string> = new Set();
  if (hearing.prosecutionCases && !!hearing.prosecutionCases.length) {
    hearing.prosecutionCases
      .filter(kase => !kase.isGroupMaster)
      .forEach(aCase => {
        let identifier = aCase.prosecutionCaseIdentifier.caseURN;
        if (!identifier) {
          identifier = aCase.prosecutionCaseIdentifier.prosecutionAuthorityReference;
          if (!identifier) {
            identifier = aCase.prosecutionCaseIdentifier.prosecutionAuthorityCode;
          }
        }
        urns.add(identifier);
      });
  } else {
    hearing.courtApplications.forEach(application => {
      const identifier = application.applicationReference;
      urns.add(identifier);
    });
  }

  return Array.from(urns);
};

export const getCurrentHearing = (state: AppState) => state.hearings.current.hearing;
export const getRelatedAppId = (state: AppState) => state.hearings.current?.relatedApplicationId;

export const getCurrentHearingState = (state: AppState) => state.hearings.current.hearingState;

export const getFirstSharedDate = (state: AppState) => state.hearings.current.firstSharedDate;

export const getTotalNumberOfCases = (state: AppState) => state.hearings.current.totalCases;

export const getCurrentHearingAmendedByUserId = (state: AppState) =>
  state.hearings.current.amendedByUserId;

export const getCurrentHearingAmendedByUserDetails = (state: AppState) =>
  state.hearings.current.amendedByUser;

export const getHearingSummaries = (state: AppState) => state.hearings.summaries || [];

export const getCheckInHearingSummaries = (state: AppState) =>
  state.hearings.checkInSummaries || [];

export const getCurrentHearingDay = createSelector(
  getCurrentHearing,
  hearing => hearing.hearingDays[0]
);
export const getCurrentHearingDate = (state: AppState) =>
  state.hearings.current.hearing.hearingDays[0];

export const getCurrentHearingType = (state: AppState) =>
  state.hearings.current.hearing.jurisdictionType;

export const getIsSelectedCaseBulk = (state: AppState) => state.hearings.isSelectedCaseBulk;

export const getHearingHasBulkCaseOnly = createSelector(
  getCurrentHearing,
  hearing =>
    hearing &&
    hearing.prosecutionCases &&
    hearing.prosecutionCases.length < 2 &&
    hearing.prosecutionCases.some(kase => kase.isGroupMaster)
);

export const getHearingHasCivilCase = createSelector(
  getCurrentHearing,
  hearing =>
    hearing && hearing.prosecutionCases && hearing.prosecutionCases.some(kase => kase.isCivil)
);

export const getAvailableHearings = (state: AppState) => state.hearings.available;

export const getListingNotes = (state: AppState) => state.hearings.listingNotes;

export const isCurrentHearingRestricted = (state: AppState) => state.hearings.isRestricted;

export const isCurrentHearingInWelshCourt = createSelector(
  getCurrentHearing,
  getOrganisationUnits,
  (hearing, organisationUnits) => {
    const courtCentreId = hearing && hearing.courtCentre && hearing.courtCentre.id;
    const ou =
      courtCentreId &&
      organisationUnits &&
      organisationUnits.find(orgUnit => orgUnit.id === courtCentreId);

    return !!(ou && ou.isWelsh);
  }
);

export const currentHearingIsBoxHearing = createSelector(
  getCurrentHearing,
  hearing => !!hearing && hearing.isBoxHearing
);

export const getHearingProsecutionCases = createSelector(
  getCurrentHearing,
  hearing => (hearing && hearing.prosecutionCases) || []
);

export const getHearingCourtApplications = createSelector(
  getCurrentHearing,
  hearing => (hearing && hearing.courtApplications) || []
);

export const getIsGroupCaseApplication = createSelector(
  getHearingCourtApplications,
  courtApplications =>
    !!courtApplications.length &&
    courtApplications.every(courtApplication => courtApplication.isGroupCaseApplication)
);

export const canUserAmendHearing = createSelector(
  getCurrentHearingState,
  getCurrentHearingAmendedByUserId,
  getUserDetails,
  (hearingState, amendedByUserId, loggedInUser) => {
    const isAmendmentDisabledForAllUser =
      hearingState === HearingLockState.APPROVAL_REQUESTED ||
      hearingState === HearingLockState.VALIDATED;

    const isHearingInAmendmentByAnyUser =
      hearingState === HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR ||
      hearingState === HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR;

    const isLoggedUserIsAmending = loggedInUser.userId === amendedByUserId;

    if (isHearingInAmendmentByAnyUser) {
      return isLoggedUserIsAmending;
    }

    if (isAmendmentDisabledForAllUser) {
      return false;
    }

    return true;
  }
);

export const getIsHearingLockedBySomeoneElse = createSelector(
  getCurrentHearingState,
  getCurrentHearingAmendedByUserId,
  getUserDetails,
  (hearingState, amendedByUserId, loggedInUser): boolean => {
    const isLoggedUserIsAmending = loggedInUser.userId === amendedByUserId;

    return (
      !isLoggedUserIsAmending &&
      ![HearingLockState.INITIALISED, HearingLockState.SHARED].includes(hearingState)
    );
  }
);

export const getAmendmentMessage = createSelector(
  getCurrentHearingState,
  getCurrentHearingAmendedByUserDetails,

  getIsHearingLockedBySomeoneElse,
  (
    hearingState,
    amendedByUser,
    isHearingLockedBySomeoneElse
  ): { message: string; user?: string } => {
    if (hearingState === HearingLockState.APPROVAL_REQUESTED) {
      return { message: 'PAGE_HEADER.APPROVAL_REQUESTED' };
    }

    if (hearingState === HearingLockState.VALIDATED) {
      return { message: 'PAGE_HEADER.VALIDATED' };
    }

    if (isHearingLockedBySomeoneElse) {
      return {
        message: 'PAGE_HEADER.LOCKED_BY_SOMEONE_ELSE',
        user: `${amendedByUser && amendedByUser.firstName ? amendedByUser.firstName : ''} ${
          amendedByUser && amendedByUser.lastName ? amendedByUser.lastName : ''
        }`
      };
    }

    return { message: '' };
  }
);
export const getApplicantEmailForSummonsApplication = (applicationId: string) =>
  createSelector(getHearingCourtApplications, courtApplications => {
    if (!applicationId) {
      return undefined;
    }

    const courtApplication = courtApplications.find(c => c.id === applicationId);

    if (
      courtApplication &&
      courtApplication.type.summonsTemplateType !== SummonsTemplateType.NOT_APPLICABLE
    ) {
      const { organisation, prosecutingAuthority, personDetails, masterDefendant } =
        courtApplication.applicant;

      if (masterDefendant) {
        const { legalEntityDefendant, personDefendant } = masterDefendant;

        if (
          legalEntityDefendant &&
          legalEntityDefendant.organisation &&
          legalEntityDefendant.organisation.contact
        ) {
          return legalEntityDefendant.organisation.contact.primaryEmail;
        }
        if (
          personDefendant &&
          personDefendant.personDetails &&
          personDefendant.personDetails.contact
        ) {
          return personDefendant.personDetails.contact.primaryEmail;
        }
      }
      if (personDetails && personDetails.contact) {
        return personDetails.contact.primaryEmail;
      }

      if (organisation && organisation.contact) {
        return organisation.contact.primaryEmail;
      }
      if (prosecutingAuthority && prosecutingAuthority.contact) {
        return prosecutingAuthority.contact.primaryEmail;
      }
    }

    return undefined;
  });

export const getDefendantsFromAllCases = createSelector(
  getHearingProsecutionCases,
  (prosecutionCases): Defendant[] =>
    prosecutionCases.reduce(
      (defendants: Defendant[], kase) => defendants.concat(kase.defendants),
      []
    )
);

export const getDefendantOffencesIds = createSelector(getDefendantsFromAllCases, defendants =>
  mapOffencesToDefendants(defendants)
);

export const mapOffencesToDefendants = (defendants: Defendant[]) => {
  const resultMap: Record<string, string[]> = {};
  defendants.forEach(defendant => {
    const { id: defendantId, offences } = defendant;
    const offenceIds = offences.map(offence => offence.id);
    resultMap[defendantId] = offenceIds;
  });
  return resultMap;
};

export const isCurrentHearingStandaloneBoxworkApplication = createSelector(
  currentHearingIsBoxHearing,
  getHearingProsecutionCases,
  (isBoxHearing, prosecutionCases) => prosecutionCases.length === 0 && isBoxHearing
);

export const getCurrentHearingPersonDetails = createSelector(
  getDefendantsFromAllCases,
  defendants => extractHearingPersonDetailsFromDefendants(defendants)
);

export const getCasesAndApplicationsIndividualDefendants = createSelector(
  getDefendantsFromAllCases,
  getHearingCourtApplications,
  (defendants, applications) => {
    const defendantsFromCases = extractIndividualDefendantsFromHearing(defendants);
    const defendantsFromApplications = extractIndividualDefendantsFromApplication(applications);

    const allDefendants = defendantsFromCases.concat(defendantsFromApplications);
    return uniqBy(allDefendants, 'masterDefendantId');
  }
);

export const getCurrentHearingCasesAndApplicationsDefendants = createSelector(
  getDefendantsFromAllCases,
  getHearingCourtApplications,
  (defendants, courtApplications) => buildDefendantDetails(defendants, courtApplications)
);

export const getNonBulkCaseDefendants = createSelector(getCurrentHearing, hearing => {
  if (hearing?.prosecutionCases?.length) {
    // Existing type application when prosecutionCases are present
    const nonBulkCases = hearing.prosecutionCases.filter(kase => !kase.isGroupMaster);
    const defendants = nonBulkCases.reduce((acc, kase) => acc.concat(kase.defendants), []);
    return {
      defendants: uniqBy(
        buildDefendantDetails(defendants, hearing.courtApplications),
        'masterDefendantId'
      ),
      hasBulkDefendant: nonBulkCases.length < hearing.prosecutionCases.length
    };
  } else if (hearing?.courtApplications?.length) {
    // Standalone Application when prosecutionCases are not present we'll pick details from CourtApplication>Subject
    const defendantsFromSubjects = hearing.courtApplications.reduce((acc, app) => {
      const person = app.subject?.personDetails;
      if (person) {
        acc.push({ personDefendant: person });
      }
      return acc;
    }, []);

    return {
      defendants: defendantsFromSubjects,
      hasBulkDefendant: false
    };
  }

  return {
    defendants: [],
    hasBulkDefendant: false
  };
});

export const getDefendantByOffenceId = createSelector(
  getRouteParams,
  getHearingProsecutionCases,
  ({ offenceId }, prosecutionCases) => {
    if (offenceId) {
      const selectedDefendant = prosecutionCases
        .map(kase => kase.defendants)
        .reduce((a, b) => a.concat(b))
        .filter(defendant => defendant.offences.find(offence => offence.id === offenceId));

      return selectedDefendant[0];
    }

    return undefined;
  }
);

export const getCurrentOffence = createSelector(
  getRouteParams,
  getDefendantByOffenceId,
  ({ offenceId }, defendant) => {
    if (offenceId) {
      return defendant.offences.find(({ id }) => id === offenceId);
    }

    return undefined;
  }
);

export const getCurrentResultLineCaseUrns = createSelector(
  getRouteQueryParams,
  getCurrentHearing,
  ({ applicationId }, hearing): string[] => {
    if (!!applicationId) {
      const { linkedCaseId } = hearing.courtApplications.find(
        courtApplication => courtApplication.id === applicationId
      );
      if (!linkedCaseId) {
        return [];
      }
      const linkedCase: ProsecutionCaseDetails = (hearing.prosecutionCases || []).find(
        prosecutionCase => prosecutionCase.id === linkedCaseId
      );
      return [extractProsecutionCaseReference(linkedCase)];
    } else if (!!hearing.prosecutionCases && hearing.prosecutionCases.length > 0) {
      return hearing.prosecutionCases.map(prosecutionCase =>
        extractProsecutionCaseReference(prosecutionCase)
      );
    }
    return [];
  }
);

export const getOffencesFromAllApplications = createSelector(
  getHearingCourtApplications,
  applications =>
    applications.reduce((mergedOffences: Offence[], application) => {
      const { courtApplicationCases, courtOrder } = application;

      if (!!courtOrder) {
        const courtOrderOffences = courtOrder.courtOrderOffences.map(({ offence }) => offence);
        return mergedOffences.concat(courtOrderOffences);
      }

      if (!!courtApplicationCases) {
        const caseOffences = courtApplicationCases.reduce(
          (offences, kase) => offences.concat(kase.offences || []),
          [] as Offence[]
        );
        return mergedOffences.concat(caseOffences);
      }

      return mergedOffences;
    }, [])
);

export const getOffencesFromAllDefendants = createSelector(getDefendantsFromAllCases, defendants =>
  defendants.reduce((offences: Offence[], defendant) => offences.concat(defendant.offences), [])
);

export const getCurrentHearingDefendants = createSelector(getCurrentHearing, hearing =>
  extractDefendants(hearing)
);

export const getCurrentHearingRespondents = createSelector(getCurrentHearing, hearing =>
  extractRespondents(hearing)
);

export const getCurrentHearingUrn = createSelector(getCurrentHearing, hearing => {
  if (extractUrns(hearing)) {
    return extractUrns(hearing).join(', ');
  }
  return undefined;
});

export const getCurrentHearingUrnList = createSelector(getCurrentHearing, hearing =>
  extractUrns(hearing)
);

export const getCasesAndApplicationsGroupedByDefendant = createSelector(
  getCurrentHearing,
  hearing => groupCasesAndApplicationsByDefendant(hearing)
);

export const caseStatus = createSelector(getCurrentHearing, hearing => {
  if (!!hearing.courtApplications && hearing.courtApplications.length > 0) {
    const courtApplictions = hearing.courtApplications[0];
    if (
      courtApplictions.courtApplicationCases &&
      courtApplictions.courtApplicationCases.length > 0
    ) {
      return courtApplictions.courtApplicationCases[0]?.caseStatus;
    }
    if (courtApplictions.courtOrder) {
      return 'INACTIVE';
    }
  }
  return '';
});

export const extractApplicantRespondentOrAppellantFromCourtApplication = createSelector(
  getCurrentHearing,
  getRelatedAppId,
  groupApplicantRespondentOrAppellantFromCourtApplication
);

export const getCounselsCache = (state: AppState) => {
  return state.hearings.counselsCache;
};

export const getCurrentHearingId = (state: AppState) => {
  if (!state.hearings.current.hearing) {
    return null;
  }
  return state.hearings.current.hearing.id;
};

export const getCurrentCaseIds = (state: AppState) => {
  if (
    !state.hearings ||
    !state.hearings.current ||
    !state.hearings.current.hearing ||
    !state.hearings.current.hearing.prosecutionCases
  ) {
    return [];
  }
  return state.hearings.current.hearing.prosecutionCases.map(kase => kase.id);
};

export const getCurrentApplicationIds = (state: AppState) => {
  if (
    !state.hearings ||
    !state.hearings.current ||
    !state.hearings.current.hearing ||
    !state.hearings.current.hearing.courtApplications
  ) {
    return [];
  }
  return state.hearings.current.hearing.courtApplications.map(application => application.id);
};

export const getCurrentApplicationTypeIds = (state: AppState) => {
  if (
    !state.hearings ||
    !state.hearings.current ||
    !state.hearings.current.hearing ||
    !state.hearings.current.hearing.courtApplications
  ) {
    return [];
  }
  return state.hearings.current.hearing.courtApplications.map(application => application.type.id);
};

export const getCurrentHearingDays = (state: AppState) => {
  if (!state.hearings.current.hearing) {
    return null;
  }
  return state.hearings.current.hearing.hearingDays;
};

export const getHearingPleasFromCurrentHearing = createSelector(
  getCurrentHearing,
  canAmendApplication,

  (hearing, hasAmendApplication) => {
    return extractPleas(hearing).concat(extractApplicationPleas(hearing, hasAmendApplication));
  }
);

export const getAllPleasHaveDelegatedPowers = createSelector(
  getOffencesFromAllDefendants,
  getOffencesFromAllApplications,
  (defendantOffences, applicationOffences = []) => {
    return defendantOffences
      .concat(applicationOffences)
      .every(({ plea }) => !!plea.delegatedPowers);
  }
);

export const getNonIndicatedPleas = createSelector(getPleaTypes, (pleas: PleaWithIndicatedFlag[]) =>
  pleas.filter(plea => !plea.indicatedPlea)
);

export const getIndicatedPleasOptions = createSelector(
  getPleaTypes,
  (pleas: PleaWithIndicatedFlag[]) =>
    pleas.filter(plea => plea.indicatedPlea).map(plea => mapPleaTypeToPleaOption(plea))
);

export const getHearingStandardPleaOptions = createSelector(
  getNonIndicatedPleas,
  getCurrentHearing,
  (pleaTypes): PleaOption[] =>
    pleaTypes
      .filter(plea => ['GUILTY', 'NOT_GUILTY'].includes(plea.pleaValue))
      .map(plea => mapPleaTypeToPleaOption(plea))
);

export const getCivilCaseHearingPleaOptions = createSelector(
  getPleaTypes,
  (pleaTypes): PleaOption[] =>
    pleaTypes
      .filter(plea => ['ADMITS_MAGISTRATES', 'OPPOSES', 'CONSENTS'].includes(plea.pleaValue))
      .map(plea => mapPleaTypeToPleaOption(plea))
);

export const getHearingEitherWayPleaOptions = createSelector(
  getNonIndicatedPleas,
  (pleaTypes): PleaOption[] =>
    pleaTypes
      .filter(plea => ['GUILTY', 'NOT_GUILTY', 'INDICATED_GUILTY'].includes(plea.pleaValue))
      .map(plea => mapPleaTypeToPleaOption(plea))
);

export const getHearingExtraPleaOptions = (jurisdiction: string) =>
  createSelector(getNonIndicatedPleas, getCurrentHearing, (pleaTypes, hearing): PleaOption[] => {
    if (!!hearing) {
      let pleas = sortBy(pleaTypes, ['jurisdiction']);
      if (jurisdiction === 'MAGISTRATES') {
        pleas = pleas.filter(
          plea => plea.jurisdiction === 'MAGISTRATES' || plea.jurisdiction === 'EITHER'
        );
        pleas.reverse();
      } else if (jurisdiction === 'CROWN') {
        pleas = pleas.filter(
          plea => plea.jurisdiction === 'CROWN' || plea.jurisdiction === 'EITHER'
        );
      }
      return pleas.map(plea => mapPleaTypeToPleaOption(plea));
    }
    return [];
  });

export const getPleasMapping = createSelector(
  getPleaTypes,
  (
    pleaTypes
  ): {
    [key: string]: string;
  } =>
    pleaTypes.reduce<Record<string, string>>((pleasMapping, plea) => {
      pleasMapping[plea.pleaValue] = plea.pleaTypeDescription;
      return pleasMapping;
    }, {})
);

export const getGuiltyPleasValues = createSelector(getPleaTypes, (pleaTypes): string[] =>
  (pleaTypes || []).filter(plea => plea.pleaTypeGuiltyFlag === 'Yes').map(plea => plea.pleaValue)
);

export const getCurrentHearingNotes = (state: AppState) => {
  if (!state.hearings.current.hearing || !state.hearings.current.hearing.hearingCaseNotes) {
    return null;
  }

  const hearingCaseNotes = [...state.hearings.current.hearing.hearingCaseNotes];
  return hearingCaseNotes.sort((a, b) => +new Date(b.noteDateTime) - +new Date(a.noteDateTime));
};

export const getDefendantIdsFromCurrentHearing = createSelector(getCurrentHearing, hearing => {
  if (!hearing || !hearing.prosecutionCases || !hearing.prosecutionCases.length) {
    return [];
  }
  return hearing.prosecutionCases
    .map(kase => kase.defendants)
    .reduce((a, b) => a.concat(b))
    .map(defendant => defendant.id);
});

export const getSelectedHearingDate = (state: AppState) => {
  if (state.hearings && state.hearings.selectedHearingDate !== null) {
    return state.hearings.selectedHearingDate;
  }

  if (state.hearings && state.hearings.current.hearing !== null) {
    const cppDateUtil = getCPPDate();
    const localDate = cppDateUtil.localDate(
      state.hearings.current.hearing.hearingDays[0].sittingDay
    );
    return cppDateUtil.format(localDate, cppDateUtil.US_DATE_FORMAT);
  }

  return null;
};

export const getCurrentHearingDefenseCounsels = createSelector(
  getCurrentHearing,
  getSelectedHearingDate,
  (hearing, selectedHearingDate) => extractDefenceCouncils(hearing, selectedHearingDate)
);

const filterCounselsByAttendanceDay = <T extends { attendanceDays?: string[] }>(
  counsels: T[],
  selectedHearingDate: string
): T[] =>
  selectedHearingDate
    ? counsels.filter(counsel => (counsel.attendanceDays || []).includes(selectedHearingDate))
    : counsels;

const sortCounselsByFirstDefendant = <T extends { defendants: string[] }>(counsels: T[]): T[] =>
  [...counsels].sort((a, b) =>
    a.defendants[0] > b.defendants[0] ? 1 : b.defendants[0] > a.defendants[0] ? -1 : 0
  );

export const getCurrentHearingProsecutionCounsels = createSelector(
  getCurrentHearing,
  getSelectedHearingDate,
  (hearing, selectedHearingDate): ProsecutionCounsel[] =>
    hearing && hearing.prosecutionCases
      ? filterCounselsByAttendanceDay(hearing.prosecutionCounsels || [], selectedHearingDate)
      : []
);

export const getCurrentHearingDefenceCounsels = createSelector(
  getCurrentHearing,
  getSelectedHearingDate,
  (hearing, selectedHearingDate): DefenceCounsel[] =>
    hearing && hearing.prosecutionCases
      ? filterCounselsByAttendanceDay(
          sortCounselsByFirstDefendant(hearing.defenceCounsels || []),
          selectedHearingDate
        )
      : []
);

export const getCurrentHearingCompanyRepresentatives = createSelector(
  getCurrentHearing,
  getSelectedHearingDate,
  (hearing, selectedHearingDate): CompanyRepresentative[] =>
    hearing && hearing.prosecutionCases
      ? filterCounselsByAttendanceDay(
          sortCounselsByFirstDefendant(hearing.companyRepresentatives || []),
          selectedHearingDate
        )
      : []
);

export const getCurrentHearingIntermediaries = createSelector(
  getCurrentHearing,
  getSelectedHearingDate,
  (hearing, selectedHearingDate): IntermediaryCounsel[] => {
    if (!hearing) {
      return [];
    }
    if (hearing.courtApplications) {
      return hearing.intermediaries ? [...hearing.intermediaries] : [];
    }
    if (hearing.prosecutionCases) {
      return filterCounselsByAttendanceDay(hearing.intermediaries || [], selectedHearingDate);
    }
    return [];
  }
);

export const getSelectedHearingOrderedDate = createSelector(
  [getSelectedHearingDate],
  hearingDate => {
    const cppDateUtil = getCPPDate();

    return cppDateUtil.format(hearingDate, cppDateUtil.US_DATE_FORMAT);
  }
);

export const isSelectedHearingInFuture = createSelector([getSelectedHearingDate], hearingDate => {
  const cppDateUtil = getCPPDate();

  const todayDateTime = cppDateUtil.localDate(moment().format());
  const hearingDateTime = cppDateUtil.localDate(hearingDate);

  return cppDateUtil.isAfter(hearingDateTime, todayDateTime, 'day');
});

export const getHearingList = createSelector([getHearingSummaries], hearings => {
  if (hearings.length === 0) {
    return [];
  }

  const hearingsShared = hearings.filter(hearing => hearing.hasSharedResults);
  const hearingsNotShared = hearings.filter(hearing => !hearing.hasSharedResults);
  return [...hearingsNotShared, ...hearingsShared];
});

export const getTodayHearingListIds = createSelector(
  getHearingList,
  getCurrentHearing,
  (hearings = [], selectedHearing) => {
    const hearingList: HearingBase[] =
      hearings.length && hearings.every(hearing => !!hearing.hearingDays)
        ? hearings
        : [selectedHearing];

    return hearingList
      .filter(hearing => {
        if (hearing) {
          return hearing.hearingDays.some(days => moment(days.sittingDay).isSame(moment(), 'day'));
        }
        return false;
      })
      .map(({ id }) => id);
  }
);

export const getAllOffencesFromHearing = createSelector(getCurrentHearing, hearing =>
  extractOffences(hearing)
);

const getProsecutionCasesOffences = (hearing: HearingDetail): Offence[] => {
  return (hearing.prosecutionCases || [])
    .map(kase => kase.defendants)
    .reduce((a, b) => a.concat(b), [])
    .map(defendant => defendant.offences)
    .reduce((a, b) => a.concat(b), []);
};

const mapApplicationAsOffence = (courtApplication: CourtApplication): Partial<Offence> => {
  return {
    allocationDecision: courtApplication.allocationDecision,
    convictionDate: courtApplication.convictionDate,
    id: courtApplication.id,
    offenceCode: courtApplication.type.code,
    offenceDefinitionId: courtApplication.type.id,
    offenceLegislation: courtApplication.type.legislation,
    offenceLegislationWelsh: courtApplication.type.legislationWelsh,
    offenceTitle: courtApplication.type.type,
    offenceTitleWelsh: courtApplication.type.typeWelsh,
    plea: courtApplication.plea,
    verdict: courtApplication.verdict
  };
};

const getAppAndAppOffencesForPleaAndVerdict = createSelector(
  getHearingCourtApplications,
  applications =>
    applications.reduce((mergedOffences: Partial<Offence>[], application) => {
      const { courtApplicationCases, courtOrder } = application;

      if (!!application.type.pleaApplicableFlag) {
        mergedOffences.push(mapApplicationAsOffence(application));
      }

      if (!!courtOrder) {
        const courtOrderOffences = courtOrder.courtOrderOffences.map(({ offence }) => offence);
        mergedOffences = mergedOffences.concat(courtOrderOffences);
      }

      if (!!courtApplicationCases) {
        const caseOffences = courtApplicationCases.reduce(
          (offences, kase) => offences.concat(kase.offences || []),
          [] as Offence[]
        );
        mergedOffences = mergedOffences.concat(caseOffences);
      }
      return mergedOffences;
    }, [])
);

export const getHearingAllOffences = createSelector(
  getCurrentHearing,
  getAppAndAppOffencesForPleaAndVerdict,
  (hearing, appAndAppOffences): Offence[] => {
    const prosecutionCasesOffences = getProsecutionCasesOffences(hearing);

    return [].concat(prosecutionCasesOffences || []).concat(appAndAppOffences || []);
  }
);

export const getCurrentHearingTierAndListType = createSelector(
  getCurrentHearing,
  (hearing): TierAndListType => hearing?.tierAndListType
);

/**
 * The tier and list type tab exists only for Crown Court hearings — it records a
 * Practice Direction decision that has no equivalent in the magistrates' court.
 */
export const isTierAndListTypeApplicable = createSelector(
  getCurrentHearing,
  (hearing): boolean => hearing?.jurisdictionType === 'CROWN'
);

export const isTierAndListTypeEntered = createSelector(
  getCurrentHearingTierAndListType,
  (tierAndListType): boolean => !!tierAndListType?.tier
);

/**
 * A Crown Court hearing that has no tier saved yet needs one before results can be
 * entered, so the manage hearing screen prompts for it.
 */
export const isTierAndListTypeRequired = createSelector(
  isTierAndListTypeApplicable,
  isTierAndListTypeEntered,
  (isApplicable, isEntered): boolean => isApplicable && !isEntered
);

export const isVerdictsPageAvailable = createSelector(
  getHearingAllOffences,
  getPleaTypes,
  getHearingHasBulkCaseOnly,
  getIsHearingLockedBySomeoneElse,
  getCurrentHearing,
  (allHearingOffences, pleaTypes, hasBulkCaseOnly, isHearingLockedBySomeoneElse, hearing) => {
    if (hasBulkCaseOnly || isHearingLockedBySomeoneElse) {
      return false;
    }

    if (hearing.courtApplications) {
      const isAppeal = hearing.courtApplications.some(app => !!app.type.appealFlag);
      if (isAppeal) {
        return false;
      }
    }

    const isAnyPleaNotGuilty = (off: Offence[]): boolean => {
      return off
        .map(offence => offence.plea)
        .some(
          plea =>
            plea &&
            plea.pleaValue &&
            pleaTypes.find(pleaType => pleaType.pleaValue === plea.pleaValue).pleaTypeGuiltyFlag ===
              'No'
        );
    };

    const existingNotifiedPleas = (off: Offence[]): boolean => {
      return off
        .map(offence => offence)
        .some(offence => {
          if (!offence.notifiedPlea) {
            return false;
          }
          return !!offence.notifiedPlea;
        });
    };

    const isAnyOffenceEitherWay = (offences: Offence[]): boolean => {
      return offences.some(offence => offence.modeOfTrial === 'Either Way');
    };

    return (
      isAnyPleaNotGuilty(allHearingOffences) ||
      existingNotifiedPleas(allHearingOffences) ||
      isAnyOffenceEitherWay(allHearingOffences)
    );
  }
);

export const isPleaApplicable = createSelector(
  getCurrentHearing,
  getHearingHasBulkCaseOnly,
  getIsHearingLockedBySomeoneElse,
  ({ prosecutionCases, courtApplications = [] }, hasBulkCase, isHearingLockedBySomeoneElse) => {
    if (hasBulkCase || isHearingLockedBySomeoneElse) {
      return false;
    }

    const isAppeal = courtApplications.some(app => !!app.type?.appealFlag);
    if (isAppeal && courtApplications.length > 0) {
      return false;
    }

    if (prosecutionCases && prosecutionCases.length > 0) {
      return true;
    }

    const hasCourtOrder = courtApplications.some(({ courtOrder }) => !!courtOrder);

    if (hasCourtOrder) {
      return true;
    }

    const hasOffences = courtApplications.some(({ courtApplicationCases }) =>
      (courtApplicationCases || []).some(({ offences }) => !!offences && offences.length > 0)
    );

    if (hasOffences) {
      return true;
    }

    return courtApplications.some(app => !!app.type?.pleaApplicableFlag);
  }
);

export const getTodaysDefendantsAttendance = createSelector(getCurrentHearing, hearing => {
  const attendanceList: {
    defendantId: string;
    attendanceType: AttendanceTypeEnum;
    day: string;
  }[] = [];
  hearing.defendantAttendance.forEach(def => {
    def.attendanceDays.forEach(ad => {
      attendanceList.push({
        defendantId: def.defendantId,
        attendanceType: ad.attendanceType,
        day: ad.day
      });
    });
  });
  return attendanceList;
});

export const hasSharedResults = (state: AppState) =>
  state.hearings.current.hearing.hasSharedResults;

export const isBoxwork = createSelector(
  getCurrentHearing,
  (hearing: HearingDetail) => hearing.isBoxHearing
);

function groupHearingSummariesByCaseId(
  hearingSummaries: (HearingSummary | CheckInHearingSummary)[]
): HearingSummariesGroupedByCaseId[] {
  if (hearingSummaries.length === 0) {
    return [];
  }

  const flattenedCases = hearingSummaries
    .filter(
      hearingSummary =>
        hearingSummary.prosecutionCaseSummaries &&
        hearingSummary.prosecutionCaseSummaries.length > 0
    )
    .reduce<HearingSummariesGroupedByCaseIdCase[]>((acc, hearingSummary) => {
      const caseSummaries = hearingSummary.prosecutionCaseSummaries.map(kaseSummary => ({
        caseReference:
          kaseSummary.prosecutionCaseIdentifier.caseURN ||
          kaseSummary.prosecutionCaseIdentifier.prosecutionAuthorityReference,
        caseId: kaseSummary.id,
        hearingId: hearingSummary.id,
        defendants: kaseSummary.defendants.map(defendant => ({
          hearingId: hearingSummary.id,
          name: defendant.organisationName
            ? defendant.organisationName
            : defendant.firstName +
              (defendant.middleName ? ` ${defendant.middleName}` : '') +
              ` ${defendant.lastName.toUpperCase()}`,
          id: defendant.id
        })),
        courtroomName: hearingSummary.courtCentre.roomName
      }));
      return [...acc, ...caseSummaries];
    }, []);

  const groupedSummaries = flattenedCases.reduce<
    Record<string, HearingSummariesGroupedByCaseIdCase[]>
  >((accumulator, value) => {
    accumulator[value.courtroomName] = accumulator[value.courtroomName] || [];
    accumulator[value.courtroomName].push(value);
    return accumulator;
  }, {});

  return Object.entries(groupedSummaries)
    .map(([courtroomName, cases]) => ({ courtroomName, cases }))
    .sort((a, b) =>
      a.courtroomName.localeCompare(b.courtroomName)
    ) as HearingSummariesGroupedByCaseId[];
}

export const getHearingSummariesGroupedByCaseId = createSelector(getHearingSummaries, summaries =>
  groupHearingSummariesByCaseId(summaries)
);

export const getCheckInHearingSummariesGroupedByCaseId = createSelector(
  getCheckInHearingSummaries,
  summaries => groupHearingSummariesByCaseId(summaries)
);

const extractPleas = (hearing: HearingDetail): GroupedPlea[] => {
  const hearingWithoutBulkCases = {
    ...hearing,
    prosecutionCases: (hearing.prosecutionCases || []).filter(kase => !kase.isGroupMaster)
  };

  if (!hearingWithoutBulkCases) {
    return [];
  }

  const { prosecutionCases = [], jurisdictionType } = hearingWithoutBulkCases;
  const pleas: GroupedPlea[] = [];

  prosecutionCases.forEach(prosecutionCase => {
    const {
      defendants = [],
      prosecutionCaseIdentifier: { caseURN }
    } = prosecutionCase;

    const offences = getFlattenOffencesFromDefendants(defendants);
    const offencesWithCount = offences.filter(offence => !!offence.count && offence.count > 0);
    const sortedOffencesWithCount =
      jurisdictionType === 'CROWN' ? sortOffences(offencesWithCount, jurisdictionType) : [];
    const groupedOffencesByCount = groupBy(sortedOffencesWithCount, offence => [
      offence.count,
      offence.offenceDefinitionId
    ]);
    const withCount: GroupedPlea['withCount'] = Object.values(groupedOffencesByCount).map(
      groupedOffences => ({
        count: groupedOffences[0].count,
        offenceTitle: groupedOffences[0].offenceTitle,
        offenceLegislation: groupedOffences[0].offenceLegislation,
        wording: groupedOffences[0].wording,
        indictmentParticular: groupedOffences[0].indictmentParticular,
        defendants: sortDefendants(getDefendantsContainsOffence(groupedOffences[0], defendants))
      })
    );

    const withoutCount: GroupedPlea['withoutCount'] = sortDefendants(
      defendants
        .map(defendant => ({
          ...defendant,
          offences: sortOffences(
            defendant.offences.filter(offence =>
              jurisdictionType === 'CROWN' ? !offence.count : !!offence
            ),
            jurisdictionType
          )
        }))
        .filter(defendant => defendant.offences.length)
    );

    pleas.push({
      caseURN,
      withCount,
      withoutCount
    });
  });

  return pleas;
};

const groupCasesAndApplicationsByDefendant = (
  hearing: HearingDetail
): DefendantCasesApplications[] => {
  if (!hearing) {
    return [];
  }

  const defendants = (hearing.prosecutionCases || []).reduce(
    (acc, prosecutionCase) => acc.concat(prosecutionCase.defendants),
    []
  );
  const sortedDefendants = sortDefendants(defendants);
  const distinctDefendants = getDistinctDefendants(sortedDefendants);

  const defendantsGrouped: DefendantCasesApplications[] = [];

  for (const defendant of distinctDefendants) {
    const defendantCases = getCasesByDefendant(defendant, hearing);
    defendantCases.forEach(defendantCase => {
      defendantCase.offences = sortOffences(defendantCase.offences, hearing.jurisdictionType);
    });

    const defendantApplications = getApplicationsByDefendant(defendant, hearing);

    const groupedDefendant = { ...defendant };
    delete groupedDefendant.offences;
    defendantsGrouped.push({
      ...groupedDefendant,
      prosecutionCases: defendantCases,
      courtApplications: defendantApplications
    });
  }

  return (defendantsGrouped as DefendantCasesApplications[]).sort(
    (x, y) => +containsBulkCase(y) - +containsBulkCase(x)
  );
};

const containsBulkCase = (defendantCase: DefendantCasesApplications): boolean => {
  return (
    defendantCase &&
    defendantCase.prosecutionCases &&
    defendantCase.prosecutionCases.some(kase => !!kase.isGroupMaster)
  );
};

export const extractProsecutionCaseReference = (prosecutionCase: ProsecutionCaseDetails) =>
  prosecutionCase.prosecutionCaseIdentifier.caseURN ||
  prosecutionCase.prosecutionCaseIdentifier.prosecutionAuthorityCode;

const mapPleaTypeToPleaOption = (pleaType: PleaType): PleaOption => {
  return {
    label: pleaType.pleaTypeDescription,
    value: pleaType.pleaValue
  };
};

export const getListingNotesMap = createSelector(getListingNotes, (listingNotes: ListingNote[]) =>
  listingNotes.reduce(
    (notesMap, note) => ({
      ...notesMap,
      [note.courtRoomId]: {
        ...notesMap[note.courtRoomId],
        [note.date]: note
      }
    }),
    {} as Record<string, Record<string, ListingNote>>
  )
);

export const getListingNoteByCourtRoomAndDate = (courtRoomId: string, hearingDate: string) =>
  createSelector(getListingNotesMap, notesMap =>
    notesMap[courtRoomId] ? notesMap[courtRoomId][hearingDate] : undefined
  );

const extractApplicationPleas = (
  hearing: HearingDetail,
  hasAmendApplication: boolean
): GroupedPlea[] => {
  if (!hearing) {
    return [];
  }

  const buildDefendantPerOffence = (
    pcId: string,
    subject: CourtApplicationParty,
    offence: Partial<Offence>
  ): Defendant => {
    const masterDefendant = subject.masterDefendant;
    const personDetails = masterDefendant.personDefendant.personDetails;
    return {
      id: subject.id,
      defendantId: subject.id,
      masterDefendantId: masterDefendant.masterDefendantId,
      firstName: personDetails.firstName,
      lastName: personDetails.lastName,
      personDefendant: masterDefendant.personDefendant,
      prosecutionCaseId: pcId,
      offences: [offence]
    } as Defendant;
  };

  const { courtApplications = [] } = hearing;
  const pleas: GroupedPlea[] = [];

  courtApplications.forEach(application => {
    const { courtApplicationCases = [], applicationReference, subject } = application;

    if (validateAmendApplication(application, hasAmendApplication)) {
      const defendant = buildDefendantPerOffence(
        application.id,
        subject,
        mapApplicationAsOffence(application)
      );

      pleas.push({
        caseURN: applicationReference,
        withCount: [],
        withoutCount: [defendant]
      });
    }

    courtApplicationCases.forEach(applicationCase => {
      const {
        prosecutionCaseIdentifier: { caseURN },
        offences = []
      } = applicationCase;

      const defendants = offences.map(offence =>
        buildDefendantPerOffence(applicationCase.prosecutionCaseId, subject, offence)
      );

      if (defendants.length > 0) {
        pleas.push({
          caseURN,
          withCount: [],
          withoutCount: defendants
        });
      }
    });
  });

  return pleas;
};

export const getApplicationSubjectAsCaseDefendant = (
  courtApplications: CourtApplication[]
): HearingPersonDetails[] => {
  return (courtApplications || []).reduce((results, app) => {
    if (app.subject.masterDefendant) {
      const {
        masterDefendant: { legalEntityDefendant, personDefendant }
      } = app.subject;

      const firstName = personDefendant
        ? personDefendant.personDetails.firstName
        : legalEntityDefendant.organisation.name;

      const lastName = personDefendant ? personDefendant.personDetails.lastName : '';

      let offences = (app.courtApplicationCases || []).reduce(
        (allOffences, courtApplicationCase) => [
          ...allOffences,
          ...(courtApplicationCase.offences || [])
        ],
        []
      );

      if (app.courtOrder) {
        offences = [
          ...offences,
          (app.courtOrder.courtOrderOffences || []).map(({ offence }) => offence)
        ];
      }

      return [
        ...results,
        {
          defendantId: app.subject.masterDefendant.masterDefendantId,
          firstName,
          lastName,
          offences,
          masterDefendantId: app.subject.masterDefendant.masterDefendantId
        }
      ];
    }

    return results;
  }, [] as HearingPersonDetails[]);
};

const buildDefendantDetails = (defendants: Defendant[], courtApplications: CourtApplication[]) => {
  const def = extractHearingPersonDetailsFromDefendants(defendants);
  const sub = getApplicationSubjectAsCaseDefendant(courtApplications);
  const allDefendants = def.concat(sub);
  return uniqBy(allDefendants, 'masterDefendantId');
};

const validateAmendApplication = (application: CourtApplication, hasAmendApplication: boolean) => {
  if (hasAmendApplication) {
    return (
      !!application.type.pleaApplicableFlag &&
      (application?.applicationStatus !== 'FINALISED' ||
        (application?.applicationStatus === 'FINALISED' && application?.amendmentAllowed))
    );
  }
  return !!application.type.pleaApplicableFlag;
};

export const getHearingStateDetails = createSelector(
  getCurrentHearingState,
  getCurrentHearingAmendedByUserDetails,
  (hearingState, amendedByUser) => ({
    amendedByUser,
    hearingState
  })
);

export const getElectronicMonitoringOfenceIds = createSelector(
  (state: AppState) => state.hearings.current,
  current => current.electronicMonitoring
);

export const getElectronicMonitoringOffences = createSelector(
  getSelectedHearingDate,
  getOffencesFromAllDefendants,
  getElectronicMonitoringOfenceIds,
  (selectedHearingDate, offences, ems) => {
    const emOffences: Offence[] = [];
    offences.forEach(offence => {
      ems.forEach(em => {
        em.trackingStatus.forEach(ts => {
          if (
            ts.offenceId === offence.id &&
            moment(selectedHearingDate).isAfter(
              moment(ts.emLastModifiedTime).format('YYYY-MM-DD')
            ) &&
            ts.emStatus
          ) {
            emOffences.push(offence);
          }
        });
      });
    });
    return uniqBy(emOffences, 'id');
  }
);

export const getWarrantOfArrestOffences = createSelector(
  getSelectedHearingDate,
  getOffencesFromAllDefendants,
  getElectronicMonitoringOfenceIds,
  (selectedHearingDate, offences, ems) => {
    const emOffences: Offence[] = [];
    offences.forEach(offence => {
      ems.forEach(em => {
        em.trackingStatus.forEach(ts => {
          if (
            ts.offenceId === offence.id &&
            moment(selectedHearingDate).isAfter(
              moment(ts.woaLastModifiedTime).format('YYYY-MM-DD')
            ) &&
            ts.woaStatus
          ) {
            emOffences.push(offence);
          }
        });
      });
    });
    return uniqBy(emOffences, 'id');
  }
);

export const getUniquElectronicMonitoringAndWarrantOfArrestOffences = createSelector(
  getElectronicMonitoringOffences,
  getWarrantOfArrestOffences,
  (electronicMonitoringOffences, warrantOfArrestOffences) =>
    uniqBy(electronicMonitoringOffences.concat(warrantOfArrestOffences), 'id')
);

export const getSelectedOptions = (state: AppState) => {
  if (
    !state.hearings.selectedOptions.dateFilter ||
    !state.hearings.selectedOptions.courtCentreFilter ||
    !state.hearings.selectedOptions.courtRoomFilter
  ) {
    return undefined;
  }
  return state.hearings.selectedOptions;
};

export const getCurrentAmendmentReason = (state: AppState) => {
  return state.hearings.amendmentReason;
};

export const getHearingLockStateByAmendmentReason = createSelector(
  getCurrentAmendmentReason,
  (amendmentReason: AmendmentReason) => {
    if (!amendmentReason) {
      return null;
    }
    return amendmentReason.reasonCode === ADMIN_ERROR_REASON_CODE
      ? HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
      : HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR;
  }
);

export const getCurrentHearingWitnesses = (state: AppState) =>
  state?.hearings?.current?.witnesses ?? [];

export const getAvailableFutureHearings = createSelector(getAvailableHearings, (hearings = []) => {
  const dateUtil = getCPPDate();
  const currentDate = dateUtil.getCurrentDate();
  return (hearings || []).filter(hearing => {
    return (hearing.hearingDays || []).some(
      hearingDay =>
        dateUtil.isSame(hearingDay.endTime, currentDate, 'day') ||
        dateUtil.isAfter(hearingDay.endTime, currentDate)
    );
  });
});

export const getSubjectIds = createSelector(getCurrentHearing, hearing => {
  return (hearing.courtApplications || []).reduce((acc, application) => {
    if (
      application.subject &&
      application.subject.masterDefendant &&
      application.subject.masterDefendant.masterDefendantId
    ) {
      return acc.concat(application.subject.masterDefendant.masterDefendantId);
    }
    return acc;
  }, []);
});

export const getAvailableFutureHearingsForApplication = createSelector(
  getRouteQueryParams,
  getAvailableHearings,
  (routeQueryParams, futureHearings) => {
    return (futureHearings || []).filter(
      futureHearing => futureHearing.jurisdictionType !== routeQueryParams.jurisdictionType
    );
  }
);

export const getApplicationHasSameJurisdiction = createSelector(
  getAvailableFutureHearingsForApplication,
  hearings => hearings.length > 0
);

export const getAvailableFutureHearingsWithOffenceSelected = createSelector(
  getDefendantOffencesIds,
  getAvailableFutureHearings,
  getSubjectIds,
  (defendantOffenceIds, futureHearings = [], subjectIds) => {
    const defendantIds = Object.keys(defendantOffenceIds)
      .map(key => key)
      .concat(subjectIds);
    return (futureHearings || []).filter(futureHearing => {
      return (futureHearing.listedCases || []).some(kase => {
        return kase.defendants.some(
          def =>
            defendantIds.includes(def.id) &&
            def.offences.some(off => defendantOffenceIds[def.id].includes(off.id))
        );
      });
    });
  }
);

export const getHasSameJurisdiction = createSelector(
  getAvailableFutureHearingsWithOffenceSelected,
  getRouteQueryParams,
  (futureHearings, routeQueryParams) => {
    return futureHearings.some(
      hearing => hearing.jurisdictionType !== routeQueryParams.jurisdictionType
    );
  }
);

export const getMappedFutureHearings = createSelector(
  getAvailableFutureHearingsWithOffenceSelected,
  (futureHearings = []) => {
    const hearings = futureHearings;

    return (hearings || []).reduce(
      (acc, curr) => ({
        ...acc,
        [curr.id]: { ...curr }
      }),
      {}
    );
  }
);

export const getStandaloneAncillaryResults = (state: AppState) =>
  state.hearings.standaloneAncillaryResults;

export const getSubReasons = (state: AppState) => state.hearings.subReasons || [];
export const getCurrentSubReason = (state: AppState) => state.hearings.currentSubReason;
export const getCurrentSubReasonLoading = (state: AppState) =>
  state.hearings.currentSubReasonLoading;
export const selectTrialEffectivenessError = createSelector(
  (state: AppState) => state.hearings?.trialEffectivenessError,
  error => error
);

export const getSubReasonsByPrimaryCode = (primaryReasonCode: string) =>
  createSelector(getSubReasons, (subReasons: CrackedIneffectiveSubReason[]) => {
    if (!primaryReasonCode || !subReasons?.length) return [];
    return subReasons.filter(sr => sr.primaryReasonCode === primaryReasonCode);
  });

// Selector to get a specific sub-reason by ID
export const getSubReasonById = (subReasonId: string) =>
  createSelector(getSubReasons, (subReasons: CrackedIneffectiveSubReason[]) => {
    if (!subReasonId || !subReasons?.length) return null;
    return subReasons.find(sr => sr.id === subReasonId);
  });
