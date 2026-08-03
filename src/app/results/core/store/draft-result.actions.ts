import { Action, createAction, props } from '@ngrx/store';
import { AmendmentReason, omitUndefined } from '../../../core';
import {
  CopyDraftResultsTarget,
  DraftResult,
  DraftResultPrompt,
  ParseChildOptions,
  ParseTextOptions,
  PromptEntry,
  ReplaceDraftResultLineOptions,
  ResolvedDraftResultLine,
  UnresolvedPartChoice
} from '../../results.interfaces';
import { ManageHearingPublicEventError } from '../../../manage-hearing-error-page/manage-hearing-error-page.interfaces';

const addChildToDraftResultLine = createAction(
  'ADD_DRAFT_RESULT_LINE_CHILD',
  props<{ options: ParseChildOptions }>()
);

const copyDraftResultLines = createAction(
  'COPY_DRAFT_RESULT_LINES',
  props<{ copyTargets: CopyDraftResultsTarget[] }>()
);

const destroyDraftResultLine = createAction(
  'DESTROY_DRAFT_RESULT_LINE',
  props<{ resultLineId: string }>()
);

const destroyDraftResultLinePart = createAction(
  'DESTROY_DRAFT_RESULT_LINE_PART',
  props<{ resultLineId: string; partIndex: number }>()
);

const parseNotepadItems = createAction(
  'PARSE_NOTEPAD_ITEMS',
  ({ items }: { items: ParseTextOptions[] }) => ({
    items: items.map(item =>
      omitUndefined({
        amendmentDate: item.amendmentReason && new Date().toISOString(),
        ...item
      })
    )
  })
);

const replaceDraftResultLine = createAction(
  'REPLACE_DRAFT_RESULT_LINE',
  props<{ options: ReplaceDraftResultLineOptions }>()
);

const resolveDraftResultLinePart = createAction(
  'RESOLVE_DRAFT_RESULT_LINE_PART',
  props<{ resultLineId: string; partIndex: number; choice: UnresolvedPartChoice }>()
);

const setAmendmentReason = createAction(
  'SET_AMENDMENT_REASON',
  ({
    amendmentDate = new Date().toISOString(),
    ...options
  }: {
    resultLineId: string;
    amendmentReason: AmendmentReason;
    childResultOptions?: ParseChildOptions;
    destroyResultLine?: boolean;
    amendmentDate?: string;
  }) => ({
    ...options,
    amendmentDate
  })
);

const saveDraftResult = createAction(
  'SAVE_DRAFT_RESULT',
  props<{ draftResult: DraftResult; isResetResults?: boolean }>()
);

const setShadowListedOffenceIds = createAction(
  'SET_SHADOW_LISTED_OFFENCES',
  props<{ offenceIds: string[] }>()
);

const saveDraftResultSuccess = createAction(
  'SAVE_DRAFT_RESULT_SUCCESS',
  props<{ draftResult: DraftResult }>()
);

const setConditionalMandatory = createAction(
  'SET_CONDITIONAL_MANDATORY_VALUE',
  props<{ resultLineId: string; selected: boolean }>()
);

const setDelegatedPowers = createAction(
  'SET_DELEGATED_POWERS',
  (options: {
    delegatedPowers: boolean;
    amendmentReason?: AmendmentReason;
    amendmentDate?: string;
  }) =>
    omitUndefined({
      amendmentDate: options.amendmentReason && new Date().toISOString(),
      ...options
    })
);

const setDraftResult = createAction('SET_DRAFT_RESULT', props<{ draftResult: DraftResult }>());

const setDraftResultError = createAction(
  'SET_DRAFT_RESULT_ERROR',
  props<{ error: string; action: Action }>()
);

const setManageHearingError = createAction(
  'SET_MANAGE_HEARING_ERROR',
  props<{ manageHearingError: ManageHearingPublicEventError }>()
);

const removeManageHearingError = createAction('REMOVE_MANAGE_HEARING_ERROR');

const updateResultPromptsForDraftResultLine = createAction(
  'UPDATE_RESULT_PROMPTS',
  props<{ resultLineId: string; resultPrompts: DraftResultPrompt[]; redirectTo?: string[] }>()
);

const setDraftResultLineErrors = createAction(
  'SET_DRAFT_RESULTLINE_ERRORS',
  props<{ invalidResultLines: ResolvedDraftResultLine[] }>()
);

const clearDraftResultLineErrors = createAction('CLEAR_DRAFT_RESULTLINE_ERRORS');

const setReusableInfoSuccess = createAction(
  'SET_REUSABLE_INFO_SUCCESS',
  props<{ reusableResults: PromptEntry[] }>()
);

export const DraftResultActions = {
  addChildToDraftResultLine,
  copyDraftResultLines,
  destroyDraftResultLine,
  destroyDraftResultLinePart,
  parseNotepadItems,
  replaceDraftResultLine,
  resolveDraftResultLinePart,
  saveDraftResult,
  saveDraftResultSuccess,
  setAmendmentReason,
  setConditionalMandatory,
  setDelegatedPowers,
  setDraftResult,
  setDraftResultError,
  setManageHearingError,
  removeManageHearingError,
  setShadowListedOffenceIds,
  updateResultPromptsForDraftResultLine,
  setDraftResultLineErrors,
  clearDraftResultLineErrors,
  setReusableInfoSuccess
};
