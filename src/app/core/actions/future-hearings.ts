import { Action } from '@ngrx/store';
import { HearingSummary, RemoveFutureHearing } from '../model';

export const FUTURE_HEARINGS_LOADED = 'FUTURE_HEARINGS_LOADED';
export const REMOVE_FUTURE_HEARINGS_CONFIRMED = 'REMOVE_FUTURE_HEARINGS_CONFIRMED';
export const REMOVE_FUTURE_HEARINGS_SUCCESS = 'REMOVE_FUTURE_HEARINGS_SUCCESS';
export const REMOVE_FUTURE_HEARINGS_RESET = 'REMOVE_FUTURE_HEARINGS_RESET';

export class FutureHearingsLoaded implements Action {
  readonly type = FUTURE_HEARINGS_LOADED;
  constructor(public readonly payload: HearingSummary[]) {}
}

export class RemoveFutureHearingsConfirmed implements Action {
  readonly type = REMOVE_FUTURE_HEARINGS_CONFIRMED;
  constructor(public readonly removeFutureHearings: RemoveFutureHearing[]) {}
}

export class RemoveFutureHearingsSuccess implements Action {
  readonly type = REMOVE_FUTURE_HEARINGS_SUCCESS;
  constructor() {}
}

export class RemoveFutureHearingsReset implements Action {
  readonly type = REMOVE_FUTURE_HEARINGS_RESET;
  constructor() {}
}

export type FutureHearingsAction =
  | FutureHearingsLoaded
  | RemoveFutureHearingsConfirmed
  | RemoveFutureHearingsSuccess
  | RemoveFutureHearingsReset;
