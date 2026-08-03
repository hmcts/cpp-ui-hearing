import { Action, ActionReducerMap } from '@ngrx/store';
import { routerReducer as router, RouterReducerState } from '@ngrx/router-store';

import { ApiState, apiReducer } from './api';
import { HearingState, composeHearingReducers } from './hearing';
import { HearingEventsLogState, hearingEventsLogReducer } from './hearing-events-log';
import { OnlineState, onlineReducer } from './network-connectivity.reducer';
import { HearingReferenceDataState, hearingReferencedataReducer } from './hearing-reference-data';
import { RouterStateUrl } from '../';
import {
  MagistratesHearingState,
  magistratesHearingReducer
} from '../../magistrates/store/magistrates-hearing.reducer';
import { ReferenceDataState, referenceDataReducer } from '@cpp/reference-data';
import { UsersGroupsState, usersGroups } from '@cpp/users-groups';
import { SessionTimesState, sessionTimesReducer } from './session-times';
import { CourtOrderState, courtOrderReducer } from './court-order';
import { FutureHearingsState, futureHearingsReducer } from './future-hearings';
import { SchedulingState, schedulingReducer } from '@cpp/scheduling';

export interface AppState extends ReferenceDataState, UsersGroupsState, SchedulingState {
  readonly api: ApiState;
  readonly hearings: HearingState;
  readonly hearingEventsLog: HearingEventsLogState;
  readonly online: OnlineState;
  readonly hearingReferenceData: HearingReferenceDataState;
  readonly router: RouterReducerState<RouterStateUrl>;
  readonly magistratesHearings: MagistratesHearingState;
  readonly sessionTimes: SessionTimesState;
  readonly activeCourtOrder: CourtOrderState;
  readonly futureHearings: FutureHearingsState;
}

const coreReducers = {
  api: apiReducer,
  hearings: composeHearingReducers,
  hearingEventsLog: hearingEventsLogReducer,
  online: onlineReducer,
  hearingReferenceData: hearingReferencedataReducer,
  magistratesHearings: magistratesHearingReducer,
  sessionTimes: sessionTimesReducer,
  activeCourtOrder: courtOrderReducer,
  futureHearings: futureHearingsReducer,
  scheduling: schedulingReducer
};

export const reducers: ActionReducerMap<AppState> = {
  ...(coreReducers as ActionReducerMap<AppState, Action>),
  usersGroups,
  router,
  referenceData: referenceDataReducer
};

export * from './hearing';
export * from './court-order';
