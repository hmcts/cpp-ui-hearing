import { sessionTimesReducer, SessionTimesState } from './session-times';
import {
  mockSessionTimesState,
  mockSessionTimesCourt,
  courtClerk as mockCourtClerk,
  courtAssociate as mockCourtAssociate,
  legalAdviser as mockLegalAdviser
} from '../../mock-data/test-mock-data';
import {
  GetSessionTimesSuccessAction,
  ClearSessionTimesAction,
  GetCourtSessionOfficersByRoleSuccessAction
} from '../actions';

describe('sessionTimesReducer', () => {
  let state: SessionTimesState;

  it('Should get session times for current session', () => {
    state = mockSessionTimesState;
    const actual = sessionTimesReducer(
      state,
      new GetSessionTimesSuccessAction(mockSessionTimesCourt)
    );
    expect(actual.currentSessionTimes).toEqual(mockSessionTimesCourt);
  });

  it('Should clear current session', () => {
    state = {
      ...mockSessionTimesState,
      currentSessionTimes: mockSessionTimesCourt
    };
    const actual = sessionTimesReducer(state, new ClearSessionTimesAction());
    expect(actual.currentSessionTimes).toBeNull();
  });

  it('Should get court officers by role', () => {
    const courtClerks = [mockCourtClerk];
    const courtAssociate = [mockCourtAssociate];
    const legalAdvisers = [mockLegalAdviser];
    const courtOfficersByRole = {
      courtClerks: courtClerks,
      courtAssociate: courtAssociate,
      legalAdvisers: legalAdvisers
    };

    state = mockSessionTimesState;
    const actual = sessionTimesReducer(
      state,
      new GetCourtSessionOfficersByRoleSuccessAction(courtOfficersByRole)
    );
    expect(actual.courtOfficers).toEqual(courtOfficersByRole);
  });
});
