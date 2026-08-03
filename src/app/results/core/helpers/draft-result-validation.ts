import { intersection } from 'lodash-es';
import {
  AnyDraftResultLine,
  ChildResultDefinition,
  DraftResult,
  ExtendedResolvedDraftResultLine,
  OffenceLike,
  ResolvedDraftResultLine,
  Result
} from '../../results.interfaces';
import {
  filterResults,
  getAncestorResultForRuleType,
  getResultById,
  getResultDefinitionIdsGroupedWith,
  getResults
} from './draft-result';
import {
  getChildResultDefinitionsForRuleType,
  hasPendingAmendments,
  isActiveDraftResultLine,
  isConditionalMandatoryDraftResultLine,
  isExtendedResolvedDraftResultLine,
  isResolvedDraftResultLine
} from './result-line';

/**
 * Determine if a result line belongs to an optional branch within a draft
 * result. An optional branch is defined as any part of the result hierarchy
 * that is not required for completion by the user. For example, if a result
 * line A has a child B, where the ruleType of the child is 'optional', then B
 * is considered as belonging to an optional branch while it remains pristine.
 *
 * The pristine characteristic (i.e. untouched from its original state) is true
 * if:
 * - The result has no result prompts
 * - The result has no manual added children (i.e. atLeastOneOf or oneOf)
 * - The result's own children are pristine
 *
 * @param draftResult the draft result
 * @param resultLineId the id of the result line to be checked
 * @returns the boolean status
 */
export const getResultBelongsToOptionalBranch = (
  draftResult: DraftResult,
  resultLineId: string
): boolean => {
  const result = getResultById<ResolvedDraftResultLine>(draftResult, resultLineId);

  if (!result) {
    return false;
  }

  if (result.relation.ruleType === 'optional') {
    return (
      result.resultLine.resultPrompts.length === 0 &&
      getResultHasPristineChildren(draftResult, result)
    );
  }

  const belongsToUnrequiredResult = getAncestorResultForRuleType<ResolvedDraftResultLine>(
    draftResult,
    result.resultLine.resultLineId,
    'optional'
  );

  return Boolean(
    belongsToUnrequiredResult &&
      !isConditionalMandatoryDraftResultLine(belongsToUnrequiredResult.resultLine) &&
      belongsToUnrequiredResult.resultLine.resultPrompts.length === 0 &&
      getResultHasPristineChildren(draftResult, belongsToUnrequiredResult)
  );
};

/**
 * Validates ancillary results within active shareable result lines.
 *
 * This function filters through the given active shareable result lines to
 * identify those that are classified as non-standalone ancillary results.
 * It then checks if these ancillary results are valid based on the presence
 * of a corresponding final ('F') or interim ('I') result within the same target
 * (either offence or application).
 *
 * The process involves:
 * 1. Extracting all result lines and identifying ancillary results.
 * 2. Defining a validation function to check if an ancillary result has a
 *    corresponding final or interim result.
 * 3. Iterating through each ancillary result to validate it.
 * 4. Collecting and returning invalid ancillary results.
 *
 * @param activeShareableResultLines An array of results which are currently active and shareable.
 * @returns An array of invalid ancillary result lines.
 */
export const validateAncillaryResults = (
  activeShareableResultLines: Result<AnyDraftResultLine>[]
): ResolvedDraftResultLine[] => {
  const isValidAncillaryResult = (
    ancillaryResult: OffenceLike<ResolvedDraftResultLine>
  ): boolean => {
    const shareableResults = activeShareableResultLines as Result<
      OffenceLike<ResolvedDraftResultLine>
    >[];

    let filteredResults = shareableResults.filter(
      result => result.resultLine.offenceId === ancillaryResult.offenceId
    );

    if (ancillaryResult.applicationId && !!!ancillaryResult.offenceId) {
      filteredResults = shareableResults.filter(
        result =>
          result.resultLine.applicationId === ancillaryResult.applicationId &&
          !!!result.resultLine.offenceId
      );
    }
    if (ancillaryResult.applicationId && ancillaryResult.offenceId) {
      filteredResults = filteredResults.filter(
        result => result.resultLine.applicationId === ancillaryResult.applicationId
      );
    }

    return filteredResults.some(
      result => result.resultLine.category === 'F' || result.resultLine.category === 'I'
    );
  };

  return activeShareableResultLines.reduce<ResolvedDraftResultLine[]>((acc, currentResult) => {
    const result = currentResult.resultLine as OffenceLike<ResolvedDraftResultLine>;
    if (result.nonStandaloneAncillaryResult && !isValidAncillaryResult(result)) {
      return [...acc, result];
    }
    return acc;
  }, []);
};

/**
 * Validate the draft result to determine if all resolved result lines are
 * completed according to their expected prompts. This function drives the
 * enabled status of the 'Save and continue' button on the 'Enter results' page.
 * Note that this means of validation ignores any unresolved draft result lines.
 *
 * @param draftResult the draft result to be validated
 * @returns the valid status of the draft result
 */
export const validateDraftResultDetails = (draftResult: DraftResult): boolean => {
  if (!draftResult) {
    return false;
  }
  return getResults(draftResult).every(result => {
    if (!result) return true;
    const { resultLine } = result;
    if (
      isActiveDraftResultLine(resultLine) &&
      isResolvedDraftResultLine(resultLine) &&
      isExtendedResolvedDraftResultLine(resultLine) &&
      resultLine.promptChoices.length > 0
    ) {
      return getResultValid(draftResult, result as Result<ResolvedDraftResultLine>);
    }
    return true;
  });
};

/**
 * Validate a draft result to determine if it's suitable for sharing. Note that
 * this does not require that all targets have had results added, only that
 * those results added are completed. The validation criteria for a completed
 * draft result is as follows:
 *
 * 1. There are no unresolved result lines (i.e. parsing could not determine a
 *    result definition)
 *
 * 2. A result line with `promptChoices` or `conditionalMandatory` flag is valid
 *
 * 3. When a result line has 'oneof' child result definitions then a related
 *    result line exists according to result level
 *
 * 4. When a result line has 'atleastOneof' child result definitions then it has
 *    a at least one related result line exists according to result level
 *
 * 5. When a result line has 'mandatory' child result definitions, then a
 *    related result line exists for each according to result level
 *
 * Note that, where a result line belongs to an optional branch of the draft
 * result (i.e. a result line has an 'optional' relation and it and all of its
 * children are pristine), then criteria 2 - 5 are not required.
 *
 * @param draftResult the draft result to be validated
 * @returns the valid status of the draft result
 */
export const validateDraftResult = (draftResult: DraftResult): boolean => {
  return filterResults(draftResult, ({ resultLine }) => isActiveDraftResultLine(resultLine)).every(
    result => {
      const { resultLine } = result;

      if (!isResolvedDraftResultLine(resultLine)) {
        return false;
      }

      const resultDefinitionIds = getResultDefinitionIdsGroupedWith(draftResult, resultLine);
      const ruleTypes: ChildResultDefinition['ruleType'][] = [
        'atleastOneOf',
        'oneOf',
        'optional',
        'mandatory'
      ];

      if (
        'childResultDefinitions' in resultLine &&
        !getResultBelongsToOptionalBranch(draftResult, result.resultLine.resultLineId)
      ) {
        for (const ruleType of ruleTypes) {
          const results = getChildResultDefinitionsForRuleType(resultLine, ruleType);

          if (results.length > 0) {
            const childResultDefinitionIds = results.map(({ code }) => code);
            // for both oneOf and atLeastOneOf, require only one match within
            // the result definition ids related to this result line to assert
            // validity
            if (
              ['atleastOneOf', 'oneOf'].includes(ruleType) &&
              intersection(resultDefinitionIds, childResultDefinitionIds).length === 0
            ) {
              return false;
            }
            // for both optional and mandatory, require that all result definition
            // ids can be matched, except for where the result line is conditional
            // mandatory
            if (
              ['mandatory'].includes(ruleType) &&
              !isConditionalMandatoryDraftResultLine(resultLine) &&
              childResultDefinitionIds.some(
                childResultDefinitionId => !resultDefinitionIds.includes(childResultDefinitionId)
              )
            ) {
              return false;
            }
          }
        }
      }

      return getResultValid(draftResult, result as Result<ResolvedDraftResultLine>);
    }
  );
};

/**
 * Evaluate whether an individual result line is in a state where it can be
 * shared. Note that only shareable result lines will appear within the 'Manage
 * hearing' page. (For determining result lines that will be displayed on the
 * 'Manage hearing' page, see `isActiveDraftResultLine`).
 *
 * The shareable state does not extend to any child relations, i.e. if result
 * line A is valid and has a mandatory child, result line B, that is invalid,
 * then result line A itself is still considered complete.
 *
 * A shareable result line includes:
 * - A result line that was previously shared and has a pending amendment
 * - An active result line that was previously shared and has no pending amendments
 * - A result line that was not previously shared and is valid
 *
 * A shareable result line excludes:
 * - An unresolved result line
 * - A resolved result line that is invalid
 * - A previously shared result line that was deleted and has already been reshared
 * - A result line that belongs to an optional branch of the draft result
 *
 * @param resultLine any result line to be evaluated
 * @returns the boolean outcome of the check
 */
export const isShareableDraftResultLine = (
  draftResult: DraftResult,
  resultLine: AnyDraftResultLine,
  includeDeletedResultLines: boolean = false
): resultLine is ResolvedDraftResultLine | ExtendedResolvedDraftResultLine => {
  if (
    isResolvedDraftResultLine(resultLine) &&
    resultLine.valid &&
    !getResultBelongsToOptionalBranch(draftResult, resultLine.resultLineId)
  ) {
    return (
      hasPendingAmendments(resultLine) ||
      !resultLine.deleted ||
      (resultLine.deleted && includeDeletedResultLines)
    );
  }
  return false;
};

const getResultHasPristineChildren = (
  draftResult: DraftResult,
  result: Result<ResolvedDraftResultLine>
): boolean =>
  result.relation.childResultLineIds.every(childResultLineId => {
    const childResult = getResultById<ResolvedDraftResultLine>(draftResult, childResultLineId);
    if (!childResult) return true;

    // A child is considered pristine (i.e. untouched from its original state) if:
    // - No manual result lines have been added (i.e. atLeastOneOf or oneOf)
    // - The child has no result prompts
    // - The child's own children are pristine
    const hasManualRuleType = ['atleastOneOf', 'oneOf'].includes(childResult.relation.ruleType);
    const hasResultPrompts = childResult.resultLine.resultPrompts.length > 0;

    return (
      !hasManualRuleType &&
      !hasResultPrompts &&
      getResultHasPristineChildren(draftResult, childResult)
    );
  });

const getResultValid = (
  draftResult: DraftResult,
  { resultLine }: Result<ResolvedDraftResultLine>
): boolean => {
  // If a result line has no result prompts but expects them, we can treat it as
  // valid regardless of its relation so long as it belongs to an optional
  // branch of the draft result.
  if (
    resultLine.resultPrompts.length === 0 &&
    (!isExtendedResolvedDraftResultLine(resultLine) || resultLine.promptChoices.length > 0) &&
    getResultBelongsToOptionalBranch(draftResult, resultLine.resultLineId)
  ) {
    return true;
  }
  return resultLine.valid;
};
