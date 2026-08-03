import { AppState } from '../reducers';
import { createSelector } from '@ngrx/store';

export const getRouteUrl = (state: AppState) =>
  state.router && state.router.state && state.router.state.url;

export const getManageHearingSidebarHidden = createSelector(getRouteUrl, url =>
  url.includes('/result-lines')
);

export const getRouteParameters = (state: AppState) =>
  (state.router &&
    state.router.state &&
    (state.router.state.params as { [key: string]: string })) ||
  {};

export const getRouteQueryParams = (state: AppState) =>
  (state.router &&
    state.router.state &&
    (state.router.state.queryParams as { [key: string]: string })) ||
  {};
