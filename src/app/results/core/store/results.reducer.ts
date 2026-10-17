import { Action, createReducer, on } from '@ngrx/store';
import { DraftResult, PromptEntry, ResolvedDraftResultLine } from '../../results.interfaces';
import {
  ResultsValidationErrors,
  ResultsValidationResponse
} from '../../results-validation.interfaces';
import { DraftResultActions } from './draft-result.actions';
import { HearingSlotsBookingActions } from './hearing-slots-booking.actions';
import { ResultsValidationActions } from './results-validation.actions';
import { ShareResultsActions } from './share-results.actions';
import { ManageHearingPublicEventError } from '../../../manage-hearing-error-page/manage-hearing-error-page.interfaces';
import { HearingSlotsBookingPublicEventError } from '../../hearing-details/allocation/types/allocation';

export interface State {
  draftResultError: { error: string; action: Action } | null;
  draftResult?: DraftResult;
  draftResultSaving: boolean;
  manageHearingError: ManageHearingPublicEventError | null;
  reusableResults: PromptEntry[] | null;
  invalidResultLines: ResolvedDraftResultLine[] | null;
  resultsValidation: ResultsValidationResponse | null;
  shareResultsValidationFailure: ResultsValidationErrors | null;
  hearingSlotsBookingError: HearingSlotsBookingPublicEventError | null;
  sessionBookedNotification: boolean;
}

export const initialState: State = {
  draftResultError: null,
  manageHearingError: null,
  draftResultSaving: false,
  reusableResults: null,
  invalidResultLines: null,
  resultsValidation: null,
  shareResultsValidationFailure: null,
  hearingSlotsBookingError: null,
  sessionBookedNotification: false
};

export const results = createReducer(
  initialState,
  on(HearingSlotsBookingActions.bookHearingSlots, state => ({
    ...state,
    hearingSlotsBookingError: null as State['hearingSlotsBookingError'],
    sessionBookedNotification: false
  })),
  on(HearingSlotsBookingActions.bookHearingSlotsSuccess, state => ({
    ...state,
    sessionBookedNotification: true
  })),
  on(
    HearingSlotsBookingActions.setHearingSlotsBookingError,
    (state, { hearingSlotsBookingError }) => ({
      ...state,
      hearingSlotsBookingError
    })
  ),
  on(HearingSlotsBookingActions.removeHearingSlotsBookingError, state => ({
    ...state,
    hearingSlotsBookingError: null as State['hearingSlotsBookingError']
  })),
  on(HearingSlotsBookingActions.resetSessionBooked, state => ({
    ...state,
    sessionBookedNotification: false
  })),
  on(DraftResultActions.saveDraftResult, (state, { draftResult }) => ({
    ...state,
    draftResult: {
      ...draftResult,
      version: draftResult.version ? draftResult.version + 1 : 1
    },
    draftResultError: null as State['draftResultError'],
    invalidResultLines: null as State['invalidResultLines'],
    draftResultSaving: true
  })),
  on(DraftResultActions.saveDraftResultSuccess, state => ({
    ...state,
    draftResultSaving: false
  })),
  on(DraftResultActions.setDraftResult, (state, { draftResult }) => ({
    ...state,
    draftResult
  })),
  on(DraftResultActions.setDraftResultError, (state, { action, error }) => ({
    ...state,
    draftResultError: { action, error },
    draftResultSaving: false
  })),
  on(DraftResultActions.setManageHearingError, (state, { manageHearingError }) => ({
    ...state,
    draftResult: {
      ...state.draftResult,
      version: state.draftResult.version ? state.draftResult.version - 1 : 0
    },
    manageHearingError,
    draftResultSaving: false
  })),
  on(DraftResultActions.removeManageHearingError, state => ({
    ...state,
    manageHearingError: null as State['manageHearingError']
  })),
  on(ShareResultsActions.shareDraftResult, state => ({
    ...state,
    manageHearingError: null as State['manageHearingError'],
    shareResultsValidationFailure: null as State['shareResultsValidationFailure']
  })),
  on(ShareResultsActions.shareDraftResultValidationFailed, (state, { validationErrors }) => ({
    ...state,
    shareResultsValidationFailure: validationErrors,
    draftResultSaving: false
  })),
  on(DraftResultActions.setDraftResultLineErrors, (state, { invalidResultLines }) => ({
    ...state,
    invalidResultLines,
    draftResultSaving: false
  })),
  on(DraftResultActions.clearDraftResultLineErrors, state => ({
    ...state,
    invalidResultLines: null as State['invalidResultLines'],
    draftResultSaving: false
  })),
  on(DraftResultActions.setReusableInfoSuccess, (state, { reusableResults }) => ({
    ...state,
    reusableResults
  })),
  on(ResultsValidationActions.validateResultsSuccess, (state, { response }) => ({
    ...state,
    resultsValidation: response
  })),
  on(ResultsValidationActions.clearValidationResults, state => ({
    ...state,
    resultsValidation: null as State['resultsValidation']
  }))
);
