import { Action } from '@ngrx/store';
import { HearingSummary } from '../interfaces/magistrates-hearing.interface';
export const LOAD_MAGISTRATES_HEARING_LIST_SUCCESS = 'LOAD_MAGISTRATES_HEARING_LIST_SUCCESS';

export class LoadMagistratesHearingListSuccessAction implements Action {
  readonly type = LOAD_MAGISTRATES_HEARING_LIST_SUCCESS;

  constructor(public readonly payload: HearingSummary[]) {}
}

export type MagistratesHearingAction = LoadMagistratesHearingListSuccessAction;
