import { getApplicationTypes } from '@cpp/reference-data';
import { createSelector } from '@ngrx/store';

export const COMMISSION_OF_NEW_OFFENCE_BREACH = 'COMMISSION_OF_NEW_OFFENCE_BREACH';

export const getCommissionOfNewOffenceBreachApplicationTypes = createSelector(
  getApplicationTypes,
  applicationTypes => {
    return applicationTypes.filter(
      applicationType => applicationType.breachType === 'COMMISSION_OF_NEW_OFFENCE_BREACH'
    );
  }
);
