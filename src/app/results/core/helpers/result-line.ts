import moment from 'moment';
import { AmendmentReason } from '../../../core';
import {
  AnyDraftResultLine,
  ChildResultDefinition,
  ConditionalMandatoryDraftResultLine,
  ExtendedResolvedDraftResultLine,
  OffenceLike,
  ResolvedDraftResultLine
} from '../../results.interfaces';

/**
 * Get any child result definitions for a result line matching a rule type.
 *
 * @param resultLine a result line to be evaluated
 * @param ruleType the rule type to match
 * @returns a list of child result definitions matching the rule type
 */
export const getChildResultDefinitionsForRuleType = (
  resultLine: AnyDraftResultLine,
  ruleType: ChildResultDefinition['ruleType']
): ChildResultDefinition[] => {
  if ('childResultDefinitions' in resultLine) {
    return resultLine.childResultDefinitions.filter(
      childResultDefinition => childResultDefinition.ruleType === ruleType
    );
  }
  return [];
};

/**
 * Evaluate whether a result line has any pending amendments. A pending
 * amendment is determined by:
 * - The result line has already been shared
 * - The result line has not been reshared since its last amendment.
 *
 * For example:
 * 1) a result line shared on 1 June 2021 and amended on 2 June 2021 has a
 *    pending amendment;
 * 2) a result line shared on 1 June 2021 and amended on 31 May 2021 has no
 *    pending amendment.
 *
 * @param resultLine a result line to be evaluated
 * @returns the boolean result of the check
 */
export const hasPendingAmendments = (
  resultLine: AnyDraftResultLine
): resultLine is ResolvedDraftResultLine & {
  amemdmentDate: string;
  amemdmentReason: AmendmentReason;
} => {
  if ('amendmentDate' in resultLine) {
    if ('sharedDate' in resultLine) {
      return moment(resultLine.amendmentDate).isAfter(resultLine.sharedDate);
    }
    return true;
  }
  return false;
};

/**
 * Evaluate whether a result line is active, i.e. it is either resolved (paired
 * to a known result definition) or unresolved (could not be paired with a
 * result definition), and is not deleted. An active result line will always be
 * presented to the user on the 'Enter results' page. For result lines that will
 * appear on the 'Manage hearing' page, see `isShareableDraftResultLine`.
 *
 * @param resultLine a result line to be evaluated
 * @returns the boolean result of the check
 */
export const isActiveDraftResultLine = (
  resultLine: AnyDraftResultLine
): resultLine is ResolvedDraftResultLine => {
  return !isResolvedDraftResultLine(resultLine) || !resultLine.deleted;
};

/**
 * Evaluate whether a result line has the `conditionalMandatory` attribute.
 *
 * @param resultLine a result line to be evaluated
 * @returns the boolean result of the check
 */
export const isConditionalMandatoryDraftResultLine = (
  resultLine: AnyDraftResultLine
): resultLine is ConditionalMandatoryDraftResultLine => {
  return isExtendedResolvedDraftResultLine(resultLine) && resultLine.conditionalMandatory;
};

/**
 * Evaluate whether a result line has any changes since the draft result was
 * last shared. Note that all result lines are considered dirty prior to first
 * sharing.
 *
 * @param resultLine a result line to be evaluated
 * @returns the boolean result of the check
 */
export const isDirtyDraftResultLine = (
  resultLine: AnyDraftResultLine
): resultLine is ResolvedDraftResultLine | ExtendedResolvedDraftResultLine => {
  return isSharedResultLine(resultLine) ? hasPendingAmendments(resultLine) : true;
};

/**
 * Evaluate whether a result line is both paired with a result definition and
 * has the metadata belonging to this parsed result definition, such as
 * `promptChoices` and `childResultDefinitions`. A result line becomes extended
 * as a consequence of either fetching the extended draft result, or after
 * creating the result line via the parser.
 *
 * @param resultLine a result line to be evaluated
 * @returns the boolean result of the check
 */
export const isExtendedResolvedDraftResultLine = (
  resultLine: AnyDraftResultLine
): resultLine is ExtendedResolvedDraftResultLine => {
  return isResolvedDraftResultLine(resultLine) && 'promptChoices' in resultLine;
};

/**
 * Evaluate whether a result line has been resolved, i.e. that it is paired with
 * a known result definition. The inverse of this, that it's unresolved, occurs
 * when the parser was unable to parse the shortcode provided, and so the result
 * line exists as a container for `unresolvedParts`.
 *
 * @param resultLine a result line to be evaluated
 * @returns the boolean result of the check
 */
export const isResolvedDraftResultLine = (
  resultLine: AnyDraftResultLine
): resultLine is ResolvedDraftResultLine | ExtendedResolvedDraftResultLine => {
  if (!resultLine) {
    return false;
  }
  return 'resultDefinitionId' in resultLine;
};

/**
 * Evaluate whether a result line has ever been shared.
 *
 * @param resultLine any result line to be evaluated
 * @returns the boolean result of the check
 */
export const isSharedResultLine = (
  resultLine: AnyDraftResultLine
): resultLine is ResolvedDraftResultLine | ExtendedResolvedDraftResultLine => {
  return 'sharedDate' in resultLine && Boolean(resultLine.sharedDate);
};

/**
 * Evaluate whether two result lines are semantically equal. This means that the
 * result lines share commonality with regard to their target keys and their
 * result level. This commonality is used to determine result line grouping
 * behaviour.
 *
 * @param resultLine the first result line to be compared
 * @param compareTo the second result line to be compared to
 * @returns the boolean result of the check
 */
export const isResultLineSemanticallyEqual = (
  resultLine: ResolvedDraftResultLine,
  compareTo: ResolvedDraftResultLine
): boolean => {
  if (resultLine.masterDefendantId && compareTo.masterDefendantId) {
    // Defendant level match
    if (
      resultLine.masterDefendantId === compareTo.masterDefendantId &&
      compareTo.resultLevel === 'D'
    ) {
      return true;
    }
    // Case level match
    if (
      resultLine.masterDefendantId === compareTo.masterDefendantId &&
      resultLine.caseId &&
      compareTo.caseId &&
      resultLine.caseId === compareTo.caseId &&
      compareTo.resultLevel === 'C'
    ) {
      return true;
    }
  }

  const offenceLikeResult = resultLine as OffenceLike<ResolvedDraftResultLine>;
  const offenceLikeResultToCompare = compareTo as OffenceLike<ResolvedDraftResultLine>;

  // True for both ApplicationId and OfficeId
  if (offenceLikeResult.offenceId && offenceLikeResultToCompare.offenceId) {
    return offenceLikeResult.offenceId === offenceLikeResultToCompare.offenceId;
    // Application match only
  } else if (
    offenceLikeResult.applicationId &&
    offenceLikeResultToCompare.applicationId &&
    !offenceLikeResult.offenceId &&
    !offenceLikeResultToCompare.offenceId
  ) {
    return offenceLikeResult.applicationId === offenceLikeResultToCompare.applicationId;
  }

  return false;
};

export const isResultLineForApplication = (resultLine: AnyDraftResultLine): boolean => {
  return 'applicationId' in resultLine && !isResultLineForOffence(resultLine);
};

export const isResultLineForOffence = (resultLine: AnyDraftResultLine): boolean => {
  return 'offenceId' in resultLine;
};
