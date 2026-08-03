import { createSelector } from '@ngrx/store';
import { featuresExist, getAllUserPlacements, getUserFeatures } from '@cpp/users-groups';

export const getUserCourtCentreOuCodes = createSelector(getAllUserPlacements, userPlacements =>
  userPlacements.map(({ placementId }) => placementId)
);

export const canAmendApplication = createSelector(getUserFeatures, userFeatures =>
  featuresExist(userFeatures || [], ['AmendApplication'])
);

export const hasCitSubreason = createSelector(getUserFeatures, userFeatures =>
  featuresExist(userFeatures || [], ['CitSubreason'])
);

export const hasResultingAssistant = createSelector(getUserFeatures, userFeatures =>
  featuresExist(userFeatures || [], ['ResultsValidation'])
);
