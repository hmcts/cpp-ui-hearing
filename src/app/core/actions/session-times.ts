import { Action } from '@ngrx/store';
import { CourtType, SessionTimesCourt, CourtOfficersByRole } from '../model';

export const RECORD_SESSION_TIMES = 'RECORD_SESSION_TIMES';
export const RECORD_SESSION_TIMES_SUCCESS = 'RECORD_SESSION_TIMES_SUCCESS';

export const GET_SESSION_TIMES = 'GET_SESSION_TIMES';
export const GET_SESSION_TIMES_SUCCESS = 'GET_SESSION_TIMES_SUCCESS';

export const CLEAR_SESSION_TIMES = 'CLEAR_SESSION_TIMES';

export const GET_COURT_SESSION_OFFICERS_BY_ROLE = 'GET_COURT_SESSION_OFFICERS_BY_ROLE';
export const GET_COURT_SESSION_OFFICERS_BY_ROLE_SUCCESS =
  'GET_COURT_SESSION_OFFICERS_BY_ROLE_SUCCESS';

export class RecordSessionTimesAction implements Action {
  readonly type = RECORD_SESSION_TIMES;

  constructor(public readonly payload: SessionTimesCourt) {}
}

export class RecordSessionTimesSuccessAction implements Action {
  readonly type = RECORD_SESSION_TIMES_SUCCESS;
}

export class GetSessionTimesAction implements Action {
  readonly type = GET_SESSION_TIMES;
  constructor(
    public readonly courtHouseId: string,
    public readonly ouCode: string,
    public readonly courtRoomId: string,
    public readonly courtType: CourtType,
    public readonly sessionDate: string
  ) {}
}

export class GetSessionTimesSuccessAction implements Action {
  readonly type = GET_SESSION_TIMES_SUCCESS;

  constructor(public readonly payload: SessionTimesCourt) {}
}

export class ClearSessionTimesAction implements Action {
  readonly type = CLEAR_SESSION_TIMES;
}

export class GetCourtSessionOfficersByRoleAction implements Action {
  readonly type = GET_COURT_SESSION_OFFICERS_BY_ROLE;

  constructor(public readonly roleNames: string[]) {}
}

export class GetCourtSessionOfficersByRoleSuccessAction implements Action {
  readonly type = GET_COURT_SESSION_OFFICERS_BY_ROLE_SUCCESS;

  constructor(public readonly payload: CourtOfficersByRole) {}
}

export type SessionTimesAction =
  | RecordSessionTimesAction
  | RecordSessionTimesSuccessAction
  | GetSessionTimesAction
  | GetSessionTimesSuccessAction
  | ClearSessionTimesAction
  | GetCourtSessionOfficersByRoleAction
  | GetCourtSessionOfficersByRoleSuccessAction;
