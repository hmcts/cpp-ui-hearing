import { createSelector } from '@ngrx/store';
import { Option } from '../model/option';
import { AppState } from '../reducers';

export const getVerdictTypes = (state: AppState) => state.hearingReferenceData.verdictTypes;
export const getAmendmentReasons = (state: AppState) => state.hearingReferenceData.amendmentReasons;
export const getCourtApplicationOutcomeTypes = (state: AppState) =>
  state.hearingReferenceData.courtApplicationOutcomeTypes;
export const getCourtApplicationResponseTypes = (state: AppState) =>
  state.hearingReferenceData.courtApplicationResponseTypes;
export const getMotReasons = (state: AppState) => state.hearingReferenceData.motReasons;
export const getSentencingIndicatations = (state: AppState) =>
  state.hearingReferenceData.sentencingIndications;
export const getAlcoholLevelMethods = (state: AppState) =>
  state.hearingReferenceData.alcoholLevelMethods;

export const getMotReasonsOptions = createSelector(getMotReasons, reasons =>
  reasons
    .filter(({ code }) => !['08', '09', '10'].includes(code))
    .map(({ seqNum, description, code, id }) => ({
      value: id,
      sequenceNumber: seqNum,
      label: description,
      code,
      id
    }))
);

export const getSentencingDecisionOptions = createSelector(getSentencingIndicatations, reasons =>
  reasons.map(({ sentencingIndicationDescription, id }) => ({
    value: id,
    label: sentencingIndicationDescription,
    id
  }))
);

export const getAmendmentReasonOptions = createSelector(
  getAmendmentReasons,
  (amendmentReasons): Option[] => {
    return (amendmentReasons || []).map(reason => ({
      label: reason.reasonDescription,
      value: reason.id
    }));
  }
);
