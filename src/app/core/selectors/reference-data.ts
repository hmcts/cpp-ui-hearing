import { createSelector } from '@ngrx/store';
import { getOrganisationUnits, OrganisationUnit, HearingType } from '@cpp/reference-data';
import { AppState } from '../reducers';

export const getHearingTypes = (state: AppState) => state.referenceData.hearingTypes;

export const getPleaTypes = (state: AppState) => state.referenceData.pleaStatusTypes;

export const getTrialTypes = (state: AppState) => state.referenceData.trialTypes;

export const getTrialTypesSortedBySeqNo = createSelector(getTrialTypes, trialTypes => {
  return [...(trialTypes || [])].sort((a, b) => (a.seqNo > b.seqNo ? 1 : -1));
});

export const getCourtCentres = createSelector(getOrganisationUnits, organisationUnits =>
  organisationUnits.map(mapOrganisationUnitToCourtCentres)
);

export const mapOrganisationUnitToCourtCentres = (org: OrganisationUnit) => {
  const courtrooms = org.courtrooms
    ? org.courtrooms.map(cr => ({
        id: cr.id,
        name: cr.courtroomName,
        welshCourtroomName: cr.welshCourtroomName
      }))
    : [];

  return {
    id: org.id,
    name: org.oucodeL3Name,
    oucode: org.oucode,
    oucodeL1Code: org.oucodeL1Code,
    courtrooms
  };
};

export const mapHearingTypes = (hearingType: HearingType) => ({
  id: hearingType.id,
  name: hearingType.hearingDescription
});

export const getCourtCentreId = (courtCentreId: string) =>
  createSelector(getCourtCentres, courtCentres =>
    courtCentres.find(courtCentre => courtCentre.id === courtCentreId)
  );

export const findCourCentres = (...oucodes: string[]) =>
  createSelector(getCourtCentres, courtCentres =>
    courtCentres.filter(courtCentre => courtCentre.oucode && oucodes.includes(courtCentre.oucode))
  );
