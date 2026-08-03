import { MagistratesHearingAction } from './magistrates-hearing.action';
import * as MagistratesHearingActions from './magistrates-hearing.action';
import { HearingSummary } from '../interfaces/magistrates-hearing.interface';

export interface MagistratesHearingState {
  readonly summaries: HearingSummary[];
}

const initialState: MagistratesHearingState = {
  summaries: []
};

export function magistratesHearingReducer(
  state: MagistratesHearingState = initialState,
  action: MagistratesHearingAction
): MagistratesHearingState {
  switch (action.type) {
    case MagistratesHearingActions.LOAD_MAGISTRATES_HEARING_LIST_SUCCESS:
      const { payload: hearings = [] } = action;
      const summaries = hearings.map((summary: HearingSummary) => {
        const { hearingDays } = summary;
        // will only return 1 hearing for current day.  This should be changed on the back end to return an object not an array.
        const { sittingDay } = hearingDays[0];
        return {
          ...summary,
          sittingDay
        };
      });
      return {
        ...state,
        summaries: sortSummariesByTime(summaries)
      };
  }
  return state;
}

const sortSummariesByTime = function (hearings: HearingSummary[]) {
  return hearings.sort(
    (hearing1: HearingSummary, hearing2: HearingSummary) =>
      new Date(hearing1.sittingDay).getTime() - new Date(hearing2.sittingDay).getTime()
  );
};
