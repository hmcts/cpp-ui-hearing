import { createAction, props } from '@ngrx/store';

export const SaveCheckAndChallengeReasonAction = createAction(
  'SAVE_CHECK_AND_CHALLENGE_ACTION',
  props<{ payload: { target: string; description: string; type: string } }>()
);

export const SaveCheckAndChallengeReasonSuccessAction = createAction(
  'SAVE_CHECK_AND_CHALLENGE_SUCCESS_ACTION',
  props<{ payload: string }>()
);
