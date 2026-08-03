import { AppState } from '../reducers';
import { createSelector } from '@ngrx/store';
import { getRouteParams } from '../utils/utils';
import { getCurrentCaseIds } from './hearing';
import { HearingSummary } from '../model';

export const getFutureHearingsState = (state: AppState) => state.futureHearings;

export const getHearingId = createSelector(getRouteParams, params => params.hearingId);

export const getCaseIdsForHearing = createSelector(getCurrentCaseIds, caseIds => caseIds);

export const getFutureHearings = createSelector(getFutureHearingsState, state => state.hearings);

export const getFilteredFutureHearings = (hasResultedHearings: boolean) =>
  createSelector(getFutureHearings, (hearings: HearingSummary[]) =>
    hearings.filter(hearing => hearing.hasSharedResults === hasResultedHearings)
  );

export const getHasFutureHearings = createSelector(
  getFutureHearings,
  hearings => !!(hearings && hearings.length)
);

export const getShowFutureHearingsRemovedAlert = createSelector(
  getFutureHearingsState,
  state => !!state.success
);
