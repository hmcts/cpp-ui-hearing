import { getUserDetails } from '@cpp/users-groups';
import { ValidationError } from '@cpp/pdk';
import { Action, createSelector } from '@ngrx/store';
import { isEqual } from 'lodash-es';
import {
  AppState,
  canUserAmendHearing,
  getCurrentHearing,
  getCurrentHearingAmendedByUserId,
  omitUndefined
} from '../../../core';
import { DraftResultRelation, ResolvedDraftResultLine } from '../../results.interfaces';
import { ValidationIssue, ValidationMessage } from '../../results-validation.interfaces';
import * as helpers from '../helpers';
import {
  filterResults,
  getResultBelongsToOptionalBranch,
  getResultLineById,
  getSharedTargetIds as getSharedTargetIds_,
  getTargetsForHearing,
  isResolvedDraftResultLine,
  isResultLineForApplication,
  isShareableDraftResultLine,
  validateDraftResultDetails
} from '../helpers';
import { results, State } from './results.reducer';

export { DraftResultActions } from './draft-result.actions';
export { ShareResultsActions } from './share-results.actions';
export { ResultsValidationActions } from './results-validation.actions';

export interface ResultsState extends AppState {
  results: State;
}

export function resultsReducer(state: State | undefined, action: Action) {
  return results(state, action);
}

// Draft result selectors

export const getDelegatedPowers = (state: ResultsState) => {
  return state.results.draftResult ? Boolean(state.results.draftResult.delegatedPowers) : false;
};

export const getDraftResult = (state: ResultsState) => {
  return state.results.draftResult;
};

export const getInvalidResultLines = (state: ResultsState) => {
  return state.results.invalidResultLines;
};

export const getDraftResultSaving = (state: ResultsState): boolean => {
  return state.results.draftResultSaving;
};

export const getDraftResultRelations = (state: ResultsState): DraftResultRelation[] => {
  return state.results.draftResult ? state.results.draftResult.relations : [];
};

export const getDraftResultError = (state: ResultsState) => {
  return state.results.draftResultError;
};

export const getManageHearingError = (state: ResultsState) => {
  return state.results.manageHearingError;
};

export const getDraftResultPromptsValid = createSelector(
  getDraftResult,
  validateDraftResultDetails
);

export const getDraftResultLineById = (resultLineId: string) => (state: ResultsState) => {
  return state.results.draftResult
    ? state.results.draftResult.resultLines[resultLineId]
    : undefined;
};

export const getDraftResultReadOnly = createSelector(
  canUserAmendHearing,
  userCanAmendHearing => !userCanAmendHearing
);

export const getHearingAmendedBySelf = createSelector(
  getCurrentHearingAmendedByUserId,
  getUserDetails,
  (amendedByUserId, { userId }) => amendedByUserId === userId
);

export const getShadowListedOffenceIds = (state: ResultsState): string[] => {
  return state.results.draftResult.shadowListedOffenceIds;
};

export const getResultLinesGroupedByTargetId = (() => {
  let lastResult: Record<string, DraftResultRelation[]> = {};

  return createSelector(getDraftResult, draftResult => {
    const nextResult = helpers.getResultLinesGroupedByTargetId(draftResult);

    if (!lastResult) {
      lastResult = nextResult;
      return nextResult;
    }
    if (isEqual(JSON.stringify(lastResult), JSON.stringify(nextResult))) {
      return lastResult;
    }
    lastResult = Object.keys(nextResult).reduce(
      (map, targetId) => ({
        ...map,
        [targetId]:
          lastResult[targetId] && isEqual(lastResult[targetId], nextResult[targetId])
            ? lastResult[targetId]
            : nextResult[targetId]
      }),
      {}
    );
    return lastResult;
  });
})();

export const getBelongsToOptionalBranch = (resultLineId: string) => {
  return createSelector(getDraftResult, draftResult => {
    const resultLine = getResultLineById(draftResult, resultLineId);

    return resultLine && isResolvedDraftResultLine(resultLine)
      ? getResultBelongsToOptionalBranch(draftResult, resultLineId)
      : false;
  });
};

// Shared result selectors

export const getSharedTargetIds = createSelector(getDraftResult, getSharedTargetIds_);

type ShareableResultLineOptions =
  | { masterDefendantId: string }
  | { masterDefendantId: string; caseId: string }
  | { offenceId: string }
  | { applicationId: string };

export const getShareableResultLinesFor = (rawOptions: ShareableResultLineOptions) => {
  const options = omitUndefined(rawOptions);

  return createSelector(getDraftResult, draftResult =>
    filterResults<ResolvedDraftResultLine>(draftResult, ({ resultLine }) => {
      if (isShareableDraftResultLine(draftResult, resultLine, true)) {
        // Consider whether the result line belongs to an application first, as
        // this trumps the priority over offences
        if (isResultLineForApplication(resultLine)) {
          // the only possible matching criteria from ShareableResultLineOptions
          // for an application result line is a direct match on the applicationId
          return 'applicationId' in options && resultLine.applicationId === options.applicationId;
        }
        if ('caseId' in options) {
          return (
            options.caseId === resultLine.caseId &&
            options.masterDefendantId === resultLine.masterDefendantId
          );
        }
        if ('masterDefendantId' in options) {
          return options.masterDefendantId === resultLine.masterDefendantId;
        }
        if ('offenceId' in options) {
          return 'offenceId' in resultLine && options.offenceId === resultLine.offenceId;
        }
      }
      return false;
    }).map(({ resultLine }) => resultLine)
  );
};

export const getResultsValidation = (state: ResultsState) => state.results.resultsValidation;

export const getShareResultsValidationFailure = (state: ResultsState) =>
  state.results.shareResultsValidationFailure;

export const getResultsValidationErrors = createSelector(
  getResultsValidation,
  resultsValidation => resultsValidation?.errors?.validationIssues || []
);

export const getHasResultsValidationErrors = createSelector(
  getResultsValidationErrors,
  (errors): boolean => errors.length > 0
);

const collectAffectedOffenceIds = (issues: ValidationIssue[]): string[] =>
  issues.reduce<string[]>(
    (ids, issue) => ids.concat((issue.affectedOffences || []).map(o => o.offenceId)),
    []
  );

const collectOffenceMessages = (issues: ValidationIssue[]): Map<string, ValidationMessage[]> =>
  issues.reduce<Map<string, ValidationMessage[]>>((map, issue) => {
    (issue.affectedOffences || []).forEach(o => {
      if (o.offenceId && o.message && issue.ruleId) {
        const existing = map.get(o.offenceId) ?? [];
        existing.push({ ruleId: issue.ruleId, message: o.message });
        map.set(o.offenceId, existing);
      }
    });
    return map;
  }, new Map());

const collectDefendantMessages = (issues: ValidationIssue[]): Map<string, ValidationMessage[]> =>
  issues.reduce<Map<string, ValidationMessage[]>>((map, issue) => {
    (issue.affectedDefendants || []).forEach(d => {
      if (d.defendantId && d.message && issue.ruleId) {
        const existing = map.get(d.defendantId) ?? [];
        existing.push({ ruleId: issue.ruleId, message: d.message });
        map.set(d.defendantId, existing);
      }
    });
    return map;
  }, new Map());

export const getResultsValidationErrorOffenceIds = createSelector(
  getResultsValidationErrors,
  collectAffectedOffenceIds
);

export const getResultsValidationErrorMessagesByOffenceId = createSelector(
  getResultsValidationErrors,
  collectOffenceMessages
);

export const getResultsValidationWarnings = createSelector(
  getResultsValidation,
  resultsValidation => resultsValidation?.warnings || []
);

export const getOffenceLevelWarningMessages = createSelector(
  getResultsValidationWarnings,
  warnings => collectOffenceMessages(warnings.filter(w => w.validationLevel === 'OFFENCE'))
);

export const getDefendantLevelWarningMessages = createSelector(
  getResultsValidationWarnings,
  warnings => collectDefendantMessages(warnings.filter(w => w.validationLevel === 'DEFENDANT'))
);

export const getProsecutortobenotified = (state: ResultsState) => {
  const results = state.results.reusableResults;
  const prosecutorToBeNotified =
    results &&
    results.filter(
      obj => obj.promptRef.includes('prosecutortobenotified') && obj.type === 'NAMEADDRESS'
    );
  return prosecutorToBeNotified;
};

export const isExParteCivilCase = createSelector(getCurrentHearing, hearing => {
  if (!hearing) return false;
  return (
    hearing.courtApplications?.some(app =>
      app.courtApplicationCases?.some(cac =>
        cac.offences?.some(offence => offence.civilOffence?.isExParte === true)
      )
    ) ?? false
  );
});

export const getResultsValidationSummaryErrors = createSelector(
  getResultsValidation,
  getCurrentHearing,
  (resultsValidation, hearing): ValidationError[] => {
    const messages = resultsValidation?.errors?.errorMessages || [];
    if (messages.length === 0) return [];

    const affectedOffenceIds = (resultsValidation.errors?.validationIssues || []).reduce<
      Set<string>
    >((set, error) => {
      (error.affectedOffences || []).forEach(o => set.add(o.offenceId));
      return set;
    }, new Set<string>());

    const firstInDisplayOrder = hearing
      ? getTargetsForHearing(hearing).find(t => affectedOffenceIds.has(t.id))?.id
      : undefined;

    return messages.map((message, i) => ({
      id: firstInDisplayOrder
        ? `results-validation-error-${firstInDisplayOrder}`
        : `results-validation-error-${i}`,
      message,
      shouldFocus: false
    }));
  }
);
