import { createSelector } from '@ngrx/store';
import { AppState } from '../reducers';

export const getApiActivity = (state: AppState) => state.api.requests;
export const getHasApiError = (state: AppState) => state.api.errors.length > 0;
export const getHasApiActivity = createSelector(
  getApiActivity,
  requests =>
    requests.length > 0 &&
    !(
      requests.length === 1 &&
      requests.some(req => req.requestType === 'application/vnd.usersgroups.features+json')
    )
);
