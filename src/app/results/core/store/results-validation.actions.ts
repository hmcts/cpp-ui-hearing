import { createAction, props } from '@ngrx/store';
import { ResultsValidationResponse } from '../../results-validation.interfaces';

const validateResults = createAction(
  'VALIDATE_RESULTS',
  props<{ navigateOnSuccess: boolean; skipResultsValidation?: boolean }>()
);

const validateResultsSuccess = createAction(
  'VALIDATE_RESULTS_SUCCESS',
  props<{ response: ResultsValidationResponse }>()
);

const clearValidationResults = createAction('CLEAR_VALIDATION_RESULTS');

export const ResultsValidationActions = {
  validateResults,
  validateResultsSuccess,
  clearValidationResults
};
