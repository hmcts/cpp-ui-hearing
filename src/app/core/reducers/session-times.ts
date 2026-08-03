import * as SessionTimesActions from '../actions/session-times';
import { SessionTimesAction } from '../actions';
import { SessionTimesCourt, CourtOfficersByRole } from '../model';

export interface SessionTimesState {
  currentSessionTimes: SessionTimesCourt;
  courtOfficers: CourtOfficersByRole;
}

const initialState: SessionTimesState = {
  currentSessionTimes: null,
  courtOfficers: {} as CourtOfficersByRole
};

export function sessionTimesReducer(
  state: SessionTimesState = initialState,
  action: SessionTimesAction
): SessionTimesState {
  switch (action.type) {
    case SessionTimesActions.GET_SESSION_TIMES_SUCCESS:
      return {
        ...state,
        currentSessionTimes: action.payload
      };

    case SessionTimesActions.RECORD_SESSION_TIMES_SUCCESS:
      // TODO: What needs to happen here? Loading spinner?
      return {
        ...state
      };

    case SessionTimesActions.CLEAR_SESSION_TIMES:
      return {
        ...state,
        currentSessionTimes: null
      };

    case SessionTimesActions.GET_COURT_SESSION_OFFICERS_BY_ROLE_SUCCESS:
      return {
        ...state,
        courtOfficers: action.payload
      };

    default:
      return state;
  }
}
