import { HearingSummary } from '../model';
import * as FutureHearingsActions from '../actions/future-hearings';
import { FutureHearingsAction } from '../actions';

export interface FutureHearingsState {
  hearings: HearingSummary[];
  success?: boolean;
}

export const initialState: FutureHearingsState = {
  hearings: []
};

export function futureHearingsReducer(
  state: FutureHearingsState = initialState,
  action: FutureHearingsAction
): FutureHearingsState {
  switch (action.type) {
    case FutureHearingsActions.FUTURE_HEARINGS_LOADED:
      return {
        ...state,
        hearings: action.payload
      };
    case FutureHearingsActions.REMOVE_FUTURE_HEARINGS_RESET:
      return {
        ...state,
        success: false
      };
    case FutureHearingsActions.REMOVE_FUTURE_HEARINGS_SUCCESS:
      return {
        ...state,
        success: true
      };
    default:
      return state;
  }
}
