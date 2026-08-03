import { Action } from '@ngrx/store';
import { MotReason, SentencingIndication } from '../../contexts';
import {
  AlcoholLevelMethod,
  AmendmentReason,
  ApplicationOutcomeTypeByApplicationMap,
  ApplicationResponseTypeByApplicationMap,
  VerdictType
} from '../model';

export const LOAD_VERDICT_TYPES = 'LOAD_VERDICT_TYPES';
export const LOAD_VERDICT_TYPES_SUCCESS = 'LOAD_VERDICT_TYPES_SUCCESS';

export const LOAD_AMENDMENT_REASONS = 'LOAD_AMENDMENT_REASONS';
export const LOAD_AMENDMENT_REASONS_SUCCESS = 'LOAD_AMENDMENT_REASONS_SUCCESS';

export const LOAD_COURT_APPLICATION_OUTCOME_TYPES = 'LOAD_COURT_APPLICATION_OUTCOME_TYPES';
export const LOAD_COURT_APPLICATION_OUTCOME_TYPES_SUCCESS =
  'LOAD_COURT_APPLICATION_OUTCOME_TYPES_SUCCESS';

export const LOAD_COURT_APPLICATION_RESPONSE_TYPES = 'LOAD_COURT_APPLICATION_RESPONSE_TYPES';
export const LOAD_COURT_APPLICATION_RESPONSE_TYPES_SUCCESS =
  'LOAD_COURT_APPLICATION_RESPONSE_TYPES_SUCCESS';

export const LOAD_MOT_REASONS = 'LOAD_MOT_REASONS';
export const LOAD_MOT_REASONS_SUCCESS = 'LOAD_MOT_REASONS_SUCCESS';

export const LOAD_REUSABLE_INFO_DEFINITIONS_SUCCESS = 'LOAD_REUSABLE_INFO_DEFINITIONS_SUCCESS';

export const LOAD_SENTENCING_INDICATIONS_SUCCESS = 'LOAD_SENTENCING_INDICATIONS_SUCCESS';

export const LOAD_ALCOHOL_LEVEL_METHODS_SUCCESS = 'LOAD_ALCOHOL_LEVEL_METHODS_SUCCESS';

export class LoadAmendmentReasonsAction implements Action {
  readonly type = LOAD_AMENDMENT_REASONS;
}

export class LoadAmendmentReasonsSuccessAction implements Action {
  readonly type = LOAD_AMENDMENT_REASONS_SUCCESS;

  constructor(public payload: AmendmentReason[]) {}
}

export class LoadVerdictsTypesAction implements Action {
  readonly type = LOAD_VERDICT_TYPES;
}

export class LoadVerdictsTypesSuccessAction implements Action {
  readonly type = LOAD_VERDICT_TYPES_SUCCESS;

  constructor(public payload: VerdictType[]) {}
}

export class LoadCourtAplicationOutcomeTypesAction implements Action {
  readonly type = LOAD_COURT_APPLICATION_OUTCOME_TYPES;
}

export class LoadCourtAplicationOutcomeTypesSuccessAction implements Action {
  readonly type = LOAD_COURT_APPLICATION_OUTCOME_TYPES_SUCCESS;

  constructor(public payload: ApplicationOutcomeTypeByApplicationMap) {}
}

export class LoadCourtAplicationResponseTypesAction implements Action {
  readonly type = LOAD_COURT_APPLICATION_RESPONSE_TYPES;
}

export class LoadCourtAplicationResponseTypesSuccessAction implements Action {
  readonly type = LOAD_COURT_APPLICATION_RESPONSE_TYPES_SUCCESS;

  constructor(public payload: ApplicationResponseTypeByApplicationMap) {}
}

export class LoadMotReasonsAction implements Action {
  readonly type = LOAD_MOT_REASONS;
}

export class LoadMotReasonSuccessAction implements Action {
  readonly type = LOAD_MOT_REASONS_SUCCESS;

  constructor(public payload: MotReason[]) {}
}
export class LoadSentencingIndicationsSuccessAction implements Action {
  readonly type = LOAD_SENTENCING_INDICATIONS_SUCCESS;

  constructor(public payload: SentencingIndication[]) {}
}

export class LoadAlcoholLevelMethodsSuccessAction implements Action {
  readonly type = LOAD_ALCOHOL_LEVEL_METHODS_SUCCESS;

  constructor(public payload: AlcoholLevelMethod[]) {}
}

export type HearingReferenceDataAction =
  | LoadAmendmentReasonsAction
  | LoadAmendmentReasonsSuccessAction
  | LoadVerdictsTypesAction
  | LoadVerdictsTypesSuccessAction
  | LoadCourtAplicationOutcomeTypesAction
  | LoadCourtAplicationOutcomeTypesSuccessAction
  | LoadCourtAplicationResponseTypesAction
  | LoadCourtAplicationResponseTypesSuccessAction
  | LoadMotReasonsAction
  | LoadMotReasonSuccessAction
  | LoadSentencingIndicationsSuccessAction
  | LoadAlcoholLevelMethodsSuccessAction;
