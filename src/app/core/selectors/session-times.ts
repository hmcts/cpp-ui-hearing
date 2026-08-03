import { AppState } from '../reducers';
import { CourtOfficersByRole, CourtOfficerTypeaheadOptions } from '../model';
import { createSelector } from '@ngrx/store';

export const getCurrentSessionTimes = (state: AppState) => state.sessionTimes.currentSessionTimes;

const getCourtOfficersGroupedByRole = (state: AppState) => state.sessionTimes.courtOfficers;

export const getCourtOfficerTypeaheadOptions = createSelector(
  getCourtOfficersGroupedByRole,
  (courtOfficers: CourtOfficersByRole): CourtOfficerTypeaheadOptions => {
    return Object.entries(courtOfficers).reduce((acc, [role, users]) => {
      return {
        ...acc,
        [role]: users.map(user => ({
          id: user.userId,
          label: `${user.firstName} ${user.lastName}`
        }))
      };
    }, {} as CourtOfficerTypeaheadOptions);
  }
);
