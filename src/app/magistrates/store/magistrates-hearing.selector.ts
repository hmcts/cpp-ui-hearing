import {
  HearingSummary,
  MagistratesHearing,
  MagistratesHearingSummary,
  Application
} from '../interfaces/magistrates-hearing.interface';
import { CourtCentre, CourtRoom, getCourtCentres } from '../../core';
import { createSelector } from '@ngrx/store';
import { AppState } from '../../core/reducers';
import { CourtApplicationPartySummary } from '../../core/model/shared/court-application-party-summary';
import { RespondentSummary } from '../../core/model/shared/respondent-summary';

const getHearingSummaries = (state: AppState): HearingSummary[] =>
  state.magistratesHearings.summaries || [];

export const getCourtCentre = createSelector(
  getHearingSummaries,
  getCourtCentres,
  (hearings: HearingSummary[], courtCentres: CourtCentre[]): CourtCentre => {
    const hearing = hearings[0];
    const courtCentreId = hearing ? hearing.courtCentreId : '';
    return courtCentres.find((courtCentre: CourtCentre) => courtCentreId === courtCentre.id);
  }
);

export const getMagistratesHearings = createSelector(
  getHearingSummaries,
  getCourtCentres,
  (hearings: HearingSummary[], courtCentres: CourtCentre[]): MagistratesHearing[] => {
    return [].concat.apply([], getHearingsForCourtCentre(hearings, courtCentres) as any[]);
  }
);

export const getHearingDate = createSelector(getHearingSummaries, (hearings): string => {
  const hearing = hearings[0];
  return hearing ? hearing.sittingDay : '';
});

const findHearingsByCourtAndRoom = (
  summaries: HearingSummary[],
  courtCentreId: string,
  courtRoomId: string
): HearingSummary[] => {
  return summaries.filter(
    (summary: HearingSummary) =>
      courtCentreId === summary.courtCentreId && courtRoomId === summary.roomId
  );
};

const getHearingsForCourtCentre = (
  summaries: HearingSummary[],
  courtCentres: CourtCentre[]
): MagistratesHearing[] => {
  return ([] as MagistratesHearing[]).concat.apply(
    [],
    Array.from(new Set(summaries.map(summary => summary.courtCentreId))).map(
      (courtCentreId: string) => {
        const courtCentre = courtCentres.find((cc: CourtCentre) => courtCentreId === cc.id);
        return courtCentre ? mapHearingsToCourtRooms(summaries, courtCentre) : [];
      }
    )
  );
};

const mapHearingsToCourtRooms = (
  summaries: HearingSummary[],
  courtCentre: CourtCentre
): MagistratesHearing[] => {
  const roomIds = Array.from(
    new Set(
      summaries
        .filter(summary => summary.courtCentreId === courtCentre.id)
        .map(summary => summary.roomId)
    )
  );

  return roomIds.map((roomId: string, index: number) => {
    const hearingsByCourtAndRoom = findHearingsByCourtAndRoom(summaries, courtCentre.id, roomId);
    const hearings = [].concat.apply(
      [],
      buildMagistratesHearings(hearingsByCourtAndRoom) as any[]
    ) as MagistratesHearingSummary[];
    return {
      summaries: hearings,
      courtRoomName: courtCentre.courtrooms.find((room: CourtRoom) => room.id === roomId).name,
      courtCentreName: index === 0 ? courtCentre.name : undefined
    };
  });
};

const buildMagistratesHearings = (hearings: HearingSummary[]): MagistratesHearingSummary[] => {
  return hearings.map((summary: HearingSummary, sequence: number) => {
    const prosecutionCases = buildHearingForDefendants(summary, sequence + 1);
    const applications = buildApplication(summary, sequence + 1);
    return (hearings = ([] as any).concat.apply([], [...prosecutionCases, ...applications]));
  });
};

const buildHearingForDefendants = (
  hearingSummary: HearingSummary,
  sequence: number
): HearingSummary[] => {
  const { prosecutionCaseSummaries } = hearingSummary;
  const {
    type: { description: typeDescription },
    id,
    sittingDay,
    courtCentreId,
    roomId,
    totalCases
  } = hearingSummary;

  const prosecutionCases = prosecutionCaseSummaries.map(prosecutionCase => {
    const { prosecutionCaseIdentifier, id: caseId } = prosecutionCase;

    return prosecutionCase.defendants.map((defendant, index: number) => {
      const topLevelHearing = {
        defendant,
        id,
        sequence,
        typeDescription,
        sittingDay,
        courtCentreId,
        roomId,
        totalCases,
        prosecutionCase: {
          ...prosecutionCaseIdentifier,
          id: caseId
        }
      };
      const hearing = {
        ...topLevelHearing,
        prosecutionCase: {
          id: caseId
        }
      };
      return index ? hearing : topLevelHearing;
    });
  });
  return [].concat.apply([], prosecutionCases as any[]);
};

const buildApplication = (hearing: HearingSummary, sequence: number): Application[] => {
  const {
    type: { description: typeDescription },
    sittingDay,
    id: hearingId,
    courtApplicationSummaries: applications = []
  } = hearing;

  const applicationIds = applications.map(application => application.id);

  return applications.reduce((acc, application) => {
    const isChildApplication = applicationIds.some(id => application.parentApplicationId === id);
    const isParentApplication = applications.some(
      app => application.id === app.parentApplicationId
    );
    const {
      type: { legislation, type },
      applicant: { firstName, lastName, organisationName },
      respondents,
      id: applicationId,
      applicationReference
    } = application;
    const applicantName = getApplicantOrRespondentName(application.applicant);
    const respondentNames = (respondents || []).reduce<string[]>((acc, respondent) => {
      return [...acc, getApplicantOrRespondentName(respondent)];
    }, []);

    acc.push({
      application: {
        hearingId,
        applicationId,
        type: {
          type,
          legislation
        },
        firstName,
        lastName,
        respondentName: respondentNames.join(','),
        organisationName,
        prosecutor: applicantName,
        sequence,
        typeDescription,
        sittingDay,
        applicationReference,
        isChildApplication,
        isParentApplication
      }
    });
    return acc;
  }, []);
};

const getApplicantOrRespondentName = (
  applicant: RespondentSummary | CourtApplicationPartySummary
) => {
  let applicantName;
  if (applicant.organisationCode) {
    applicantName = applicant.organisationCode;
  } else if (applicant.organisationName) {
    applicantName = applicant.organisationName;
  } else {
    applicantName = `${applicant.firstName} ${applicant.lastName}`;
  }

  return applicantName;
};
