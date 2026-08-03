import { AppState } from '../reducers';
import { createSelector } from '@ngrx/store';

export const getRouter = (state: AppState) => state.router;
export const getNavigationId = createSelector(getRouter, ({ navigationId }) => navigationId);
export const getCurrentUrl = createSelector(
  getRouter,
  router => (router && router.state.url) || ''
);
