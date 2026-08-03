import {
  mockSessionTimesCourt,
  courtClerk as mockCourtClerk,
  courtAssociate as mockCourtAssociate,
  legalAdviser as mockLegalAdviser
} from '../../mock-data/test-mock-data';

import {
  RecordSessionTimesAction,
  RecordSessionTimesSuccessAction,
  RECORD_SESSION_TIMES_SUCCESS,
  RECORD_SESSION_TIMES,
  GetSessionTimesSuccessAction,
  GET_SESSION_TIMES_SUCCESS,
  GET_SESSION_TIMES,
  GetSessionTimesAction,
  GetCourtSessionOfficersByRoleAction,
  GetCourtSessionOfficersByRoleSuccessAction,
  GET_COURT_SESSION_OFFICERS_BY_ROLE,
  GET_COURT_SESSION_OFFICERS_BY_ROLE_SUCCESS,
  ClearSessionTimesAction,
  CLEAR_SESSION_TIMES
} from './session-times';

describe('Session Times actions', () => {
  describe('Recording Session Times', () => {
    it('Should create a RecordSessionTimesAction', () => {
      const action = new RecordSessionTimesAction(mockSessionTimesCourt);
      expect({ ...action }).toEqual({
        type: RECORD_SESSION_TIMES,
        payload: mockSessionTimesCourt
      });
    });

    it('Should create a RecordSessionTimesSuccessAction', () => {
      const action = new RecordSessionTimesSuccessAction();
      expect({ ...action }).toEqual({
        type: RECORD_SESSION_TIMES_SUCCESS
      });
    });
  });

  describe('Getting Session Times', () => {
    it('Should create a GetSessionTimesAction', () => {
      const { courtHouseId, courtRoomId } = mockSessionTimesCourt;
      const ouCode = 'B01LY00';
      const courtType = 'B';
      const sessionDate = '2020-10-03';
      const action = new GetSessionTimesAction(
        courtHouseId,
        ouCode,
        courtRoomId,
        courtType,
        sessionDate
      );
      expect({ ...action }).toEqual({
        type: GET_SESSION_TIMES,
        courtHouseId,
        ouCode,
        courtRoomId,
        courtType,
        sessionDate
      });
    });

    it('Should create an GetSessionTimesSuccessAction action', () => {
      const action = new GetSessionTimesSuccessAction(mockSessionTimesCourt);
      expect({ ...action }).toEqual({
        type: GET_SESSION_TIMES_SUCCESS,
        payload: mockSessionTimesCourt
      });
    });
  });

  describe('Getting Court Session Officers by Role', () => {
    it('Should create a GetCourtSessionOfficersByRoleAction', () => {
      const roleNames = ['Court Clerks', 'Court Associate', 'Legal Advisers'];
      const action = new GetCourtSessionOfficersByRoleAction(roleNames);
      expect({ ...action }).toEqual({
        type: GET_COURT_SESSION_OFFICERS_BY_ROLE,
        roleNames
      });
    });

    it('Should create an GetCourtSessionOfficersByRoleSuccessAction action', () => {
      const courtClerks = [mockCourtClerk];
      const courtAssociate = [mockCourtAssociate];
      const legalAdvisers = [mockLegalAdviser];
      const payload = {
        courtClerks: courtClerks,
        courtAssociate: courtAssociate,
        legalAdvisers: legalAdvisers
      };
      const action = new GetCourtSessionOfficersByRoleSuccessAction(payload);
      expect({ ...action }).toEqual({
        type: GET_COURT_SESSION_OFFICERS_BY_ROLE_SUCCESS,
        payload
      });
    });
  });

  it('Should create a ClearSessionTimesAction', () => {
    const action = new ClearSessionTimesAction();
    expect({ ...action }).toEqual({
      type: CLEAR_SESSION_TIMES
    });
  });
});
