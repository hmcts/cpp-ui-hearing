import { Action, createAction, props } from '@ngrx/store';
import { HearingLockState, WelshDefendantTranslate } from '../../../core';
import { DraftResult } from '../../results.interfaces';
import { ResultsValidationErrors } from '../../results-validation.interfaces';
import { CommandError } from '@cpp/core';

const approveAmendments = createAction('APPROVE_AMENDMENTS');
const approveAmendmentsSuccess = createAction('APPROVE_AMENDMENTS_SUCCESS');
const cancelAmendments = createAction('CANCEL_AMENDMENTS');
const cancelAmendmentsSuccess = createAction('CANCEL_AMENDMENTS_SUCCESS');
const setShareDraftResultError = createAction(
  'SET_SHARE_DRAFT_RESULT_ERROR',
  props<{ error: CommandError | String; action: Action }>()
);
const rejectAmendments = createAction('REJECT_AMENDMENTS');
const rejectAmendmentsSuccess = createAction('REJECT_AMENDMENTS_SUCCESS');
const requestApprovalForAmendments = createAction('REQUEST_APPROVAL_FOR_AMENDMENTS');
const requestApprovalForAmendmentsSuccess = createAction('REQUEST_APPROVAL_FOR_AMENDMENTS_SUCCESS');
const shareDraftResult = createAction('SHARE_DRAFT_RESULT');
const shareDraftResultValidationFailed = createAction(
  'SHARE_DRAFT_RESULT_VALIDATION_FAILED',
  props<{ validationErrors: ResultsValidationErrors }>()
);
const lockHearingForAmendments = createAction(
  'LOCK_HEARING_FOR_AMENDMENTS',
  props<{
    hearingId: string;
    nextState:
      | HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
      | HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR;
  }>()
);
const lockHearingForAmendmentsSuccess = createAction('LOCK_HEARING_FOR_AMENDMENTS_SUCCESS');
const shareDraftResultSuccess = createAction(
  'SHARE_DRAFT_RESULT_SUCCESS',
  props<{ draftResult: DraftResult }>()
);
const shareDraftResultWithWelshTranslate = createAction(
  'SHARE_DRAFT_RESULT_WITH_WELSH_TRANSLATE',
  props<{ payload: WelshDefendantTranslate[] }>()
);

const unlockHearing = createAction('UNLOCK_HEARING');

export const ShareResultsActions = {
  approveAmendments,
  approveAmendmentsSuccess,
  cancelAmendments,
  cancelAmendmentsSuccess,
  lockHearingForAmendments,
  lockHearingForAmendmentsSuccess,
  setShareDraftResultError,
  rejectAmendments,
  rejectAmendmentsSuccess,
  requestApprovalForAmendments,
  requestApprovalForAmendmentsSuccess,
  shareDraftResult,
  shareDraftResultSuccess,
  shareDraftResultValidationFailed,
  shareDraftResultWithWelshTranslate,
  unlockHearing
};
