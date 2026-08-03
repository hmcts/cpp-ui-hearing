import { find, isEqual, keyBy, sortBy } from 'lodash-es';
import memoizeOne from 'memoize-one';
import moment from 'moment';
import { HearingLockState } from '../../../core';
import {
  AnyDraftResultLine,
  DraftResult,
  DraftResultRelation,
  ExtendedResolvedDraftResultLine,
  OffenceLike,
  ResolvedDraftResultLine,
  Result
} from '../../results.interfaces';
import {
  hasPendingAmendments,
  isActiveDraftResultLine,
  isExtendedResolvedDraftResultLine,
  isResolvedDraftResultLine,
  isResultLineSemanticallyEqual,
  isSharedResultLine
} from './result-line';
import { getTargetId } from './target';

export interface AddResultLineRelation {
  belongsToResultLineId: string;
  ruleType: DraftResultRelation['ruleType'];
}

export const getResults = memoizeOne((draftResult: DraftResult): Result[] => {
  return draftResult.relations.map(({ resultLineId: id }) => getResultById(draftResult, id));
});

export const getResolvedResults = <T extends ResolvedDraftResultLine = ResolvedDraftResultLine>(
  draftResult: DraftResult
): Result<T>[] => {
  return draftResult.relations.map(({ resultLineId: id }) => getResultById<T>(draftResult, id));
};

export const findResult = <T extends AnyDraftResultLine = AnyDraftResultLine>(
  draftResult: DraftResult,
  predicate: (result: { resultLine: AnyDraftResultLine; relation: DraftResultRelation }) => boolean
): Result<T> => {
  return getResults(draftResult).find(predicate) as Result<T>;
};

export const filterResults = <T extends AnyDraftResultLine = AnyDraftResultLine>(
  draftResult: DraftResult,
  predicate: (result: { resultLine: AnyDraftResultLine; relation: DraftResultRelation }) => boolean
): Result<T>[] => {
  return getResults(draftResult).filter(predicate) as Result<T>[];
};

// Get an array of all results in a hierarchy for a given result line. For
// example, if result A has a child B, and B has a child C, then getting the
// hierarchy for either A, B, or C would return all three results, as they
// belong to the same hierarchy.
export const getHierarchyForResultLine = <
  T extends ResolvedDraftResultLine = ResolvedDraftResultLine
>(
  draftResult: DraftResult,
  resultLineId: string
): Result<T>[] => {
  const result = getResultById<T>(draftResult, resultLineId);
  const standaloneResult =
    result.relation.ruleType === 'standalone'
      ? result
      : getAncestorResultForRuleType<T>(draftResult, resultLineId, 'standalone');

  if (standaloneResult) {
    return [
      standaloneResult,
      ...getChildResults<T>(draftResult, standaloneResult.resultLine.resultLineId, Infinity)
    ];
  }
  return [];
};

// Determine the locked state of the draft result based on the most recent amendment
export const getLockedStateForDraftResult = ({
  resultLines
}: DraftResult):
  | HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
  | HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
  | null => {
  let lastAmendedResultLine: ResolvedDraftResultLine | null = null;
  // In practice, although the UI will seemingly allow a user to choose
  // different amendment reasons when amending different results, a hearing can
  // actually only be amended by one method at a time, as only a single locked
  // state is recognised. Consequently, we default to recognising only the most
  // recent amendment as being that which determines the lock state.
  for (const resultLine of Object.values(resultLines)) {
    if (
      hasPendingAmendments(resultLine) &&
      (!lastAmendedResultLine ||
        moment(resultLine.amemdmentDate).isAfter(lastAmendedResultLine.amendmentDate))
    ) {
      lastAmendedResultLine = resultLine;
    }
  }
  if (lastAmendedResultLine) {
    // Map the amendment reason to its relative hearing lock state. Note that
    // this should probably occur on the backend, but as the id is predictable,
    // we can perform the mapping here.
    const ADMIN_ERROR_ID = 'ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0';

    return lastAmendedResultLine.amendmentReason.id === ADMIN_ERROR_ID
      ? HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR
      : HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR;
  }
  return null;
};

export const getResultById = <T extends AnyDraftResultLine = AnyDraftResultLine>(
  draftResult: DraftResult,
  resultLineId: string
): Result<T> => {
  const resultLine = getResultLineById(draftResult, resultLineId);
  const relation = getRelationById(draftResult, resultLineId);

  if (resultLine && relation) {
    return { resultLine, relation } as Result<T>;
  }
  return undefined;
};

export const getParentResultById = <T extends AnyDraftResultLine = AnyDraftResultLine>(
  draftResult: DraftResult,
  resultLineId: string
): Result<T> => {
  const parentRelationsMap = getParentRelationsMap(draftResult.relations);

  return (
    parentRelationsMap[resultLineId] && getResultById(draftResult, parentRelationsMap[resultLineId])
  );
};

// Recursively search the ancestors of a result line until a result matching a
// rule type is found.
export const getAncestorResultForRuleType = <
  T extends ResolvedDraftResultLine = ResolvedDraftResultLine
>(
  draftResult: DraftResult,
  resultLineId: string,
  ruleType: DraftResultRelation['ruleType']
): Result<T> | undefined => {
  const parentResult = getParentResultById<T>(draftResult, resultLineId);

  if (parentResult) {
    return parentResult.relation.ruleType === ruleType
      ? parentResult
      : getAncestorResultForRuleType(draftResult, parentResult.relation.resultLineId, ruleType);
  }
  return undefined;
};

export const getResultLineById = <T extends AnyDraftResultLine = AnyDraftResultLine>(
  draftResult: DraftResult,
  resultLineId: string
): T => {
  return draftResult.resultLines[resultLineId] as T;
};

export const getRelationById = (
  draftResult: DraftResult,
  resultLineId: string
): DraftResultRelation => {
  return getRelationsMap(draftResult.relations)[resultLineId];
};

export const getNonRelatedParentResultLineById = (
  draftResult: DraftResult<ExtendedResolvedDraftResultLine>,
  resultLineId: string
): ExtendedResolvedDraftResultLine => {
  const activeResultLinesArr = getActiveResultLines(draftResult);
  const resultLine = getResultLineById<ExtendedResolvedDraftResultLine>(draftResult, resultLineId);

  const {
    shortCode = '',
    resultDefinitionId,
    offenceId,
    applicationId
  } = resultLine as OffenceLike<ExtendedResolvedDraftResultLine>;

  return activeResultLinesArr.find(
    (parentResultLine: ExtendedResolvedDraftResultLine) =>
      parentResultLine.shortCode !== shortCode &&
      parentResultLine.childResultDefinitions &&
      parentResultLine.childResultDefinitions.some(crd => crd.code === resultDefinitionId) &&
      ((offenceId &&
        (parentResultLine as OffenceLike<ExtendedResolvedDraftResultLine>).offenceId ===
          offenceId) ||
        (applicationId && parentResultLine.applicationId === applicationId))
  );
};

export const getDuplicateResultLineAlreadyInRelation = (
  draftResult: DraftResult<ExtendedResolvedDraftResultLine>,
  resultLineId: string,
  parentDraftResultRelation: DraftResultRelation
) => {
  const activeResultLinesArr = getActiveResultLines(draftResult);
  const { shortCode = '' } = getResultLineById<ExtendedResolvedDraftResultLine>(
    draftResult,
    resultLineId
  );

  const { childResultLineIds = [] } = parentDraftResultRelation;
  const duplicateResultLineIds = activeResultLinesArr
    .filter(rl => rl.shortCode === shortCode)
    .map(rl => rl.resultLineId);

  return childResultLineIds.some(id =>
    duplicateResultLineIds.some(duplicateId => id === duplicateId)
  );
};

export const getResultDefinitionIdsGroupedWith = (
  draftResult: DraftResult,
  resultLine: AnyDraftResultLine
): string[] => {
  return getResultsGroupedWith(draftResult, resultLine).map(
    result => result.resultLine.resultDefinitionId
  );
};

export const getResultLinesGroupedByTargetId = (
  draftResult: DraftResult
): Record<string, DraftResultRelation[]> => {
  return getResults(draftResult).reduce((relationsByTargetId, { resultLine, relation }) => {
    if (isActiveDraftResultLine(resultLine)) {
      const targetId = getTargetId(resultLine);
      const relationsForTarget = relationsByTargetId[targetId] || [];

      return {
        ...relationsByTargetId,
        [targetId]: [...relationsForTarget, relation]
      };
    }
    return relationsByTargetId;
  }, {} as Record<string, DraftResultRelation[]>);
};

export const getChildResults = <T extends ResolvedDraftResultLine = ResolvedDraftResultLine>(
  draftResult: DraftResult,
  resultLineId: string,
  depth = 1
): Result<T>[] => {
  const relation = getRelationById(draftResult, resultLineId);

  let childResults: Result<T>[] = [];

  if (!relation) {
    return childResults;
  }

  for (const childResultLineId of relation.childResultLineIds) {
    childResults = [...childResults, getResultById(draftResult, childResultLineId)];

    if (depth - 1 > 0) {
      childResults = [
        ...childResults,
        ...getChildResults<T>(draftResult, childResultLineId, depth - 1)
      ];
    }
  }
  return childResults;
};

// Sorts the result line relations according to an order of precedence. The
// order of priority is two-fold:
//
// (1) 'standalone' and unresolved result lines are the only result lines
//     initially considered
//
// (2) once a result line is found, its recursive relations then take priority
//     before we consider (1) again. Relations' rule types are prioritized in
//     order of:
//
//     - oneOf
//     - atLeastOneOf
//     - mandatory
//     - optional
//
// Example:
// ```
// [
//   { resultLineId: '1', ruleType: 'standalone', childResultLineIds: ['3', '4'] },
//   { resultLineId: '2', ruleType: 'standalone', childResultLineIds: [] },
//   { resultLineId: '3', ruleType: 'mandatory', childResultLineIds: [] },
//   { resultLineId: '4', ruleType: 'oneOf', childResultLineIds: ['5'] }
//   { resultLineId: '5', ruleType: 'optional', childResultLineIds: [] }
// ]
// ```
// Here, the sorted order of the resultLineIds will be:
//
// ['1', '4', '5', '3', '2'].
//
// '4' immediately follows '1' as its a relation of our first standalone result
// line, and has a higher priority as a 'oneOf' ruleType than '3' does as a
// 'manadatory' ruleType. '4' is then followed by '5' as we again prioritize its
// childResultLineIds before continuing. Once the childResultLineIds of '1' are
// exhausted, we continue on to '2'.
const childRuleTypePriority: DraftResultRelation['ruleType'][] = [
  'oneOf',
  'atleastOneOf',
  'mandatory',
  'optional'
];

export const getSortedRelations = (relations: DraftResultRelation[]): DraftResultRelation[] => {
  const sortedRelations: DraftResultRelation[] = [];

  const addChildRelations = (childResultLineIds: string[]) => {
    const childRelations = childResultLineIds.reduce((reducedRelations, childResultLineId) => {
      const relation = relations.find(({ resultLineId }) => resultLineId === childResultLineId);
      // if a child relation has been omitted (as a consequence of being
      // deleted via an amendment), then it won't be found
      return relation ? [...reducedRelations, relation] : reducedRelations;
    }, []);

    sortBy(childRelations, childRelation =>
      childRuleTypePriority.indexOf(childRelation.ruleType)
    ).forEach(childRelation => {
      sortedRelations.push(childRelation);

      addChildRelations(childRelation.childResultLineIds);
    });
  };

  for (const relation of relations) {
    if (relation.ruleType === 'standalone' || relation.ruleType === 'unknown') {
      sortedRelations.push(relation);
      addChildRelations(relation.childResultLineIds);
    }
  }

  return sortedRelations;
};

// Get an array of results grouped with a given result line. Grouping means
// results that are semantically equal according to a common resultLevel.
export const getResultsGroupedWith = (
  draftResult: DraftResult,
  { resultLineId }: AnyDraftResultLine
): Result<ExtendedResolvedDraftResultLine>[] => {
  return getGroupedResultsMap(draftResult)[resultLineId] || [];
};

/**
 * When adding a child result line to the draft result, it must respect the
 * grouping rules. This means that if the ruleType of the child's relation with
 * is parent is satisfied elsewhere in the draft result, then a new relation
 * cannot be formed. This criteria is determined by whether a result line is
 * semantically equal to another, i.e. they shares the relevant ids for their
 * common result level.
 *
 * @param draftResult the draft result
 * @param resultLine the result line to be added
 * @param belongsToResultLineId the id of the result line with which to form a
 * relation
 * @returns whether the result line can form a unique relation with its intended
 * parent
 */
export const getResultLineIsUniqueRelation = (
  draftResult: DraftResult,
  resultLine: ExtendedResolvedDraftResultLine,
  belongsToResultLineId: string
): boolean => {
  const resultWithRelations = getResultById<ExtendedResolvedDraftResultLine>(
    draftResult,
    belongsToResultLineId
  );
  if (!resultWithRelations) return false;
  const { resultLine: belongsToResultLine } = resultWithRelations;
  const { childResultDefinitions = [] } = belongsToResultLine;
  const childResultDefinition = find(childResultDefinitions, {
    code: resultLine.resultDefinitionId
  });

  if (childResultDefinition) {
    const existingRelation = findResult(draftResult, result => {
      if (result.resultLine !== resultLine) {
        return (
          isActiveDraftResultLine(result.resultLine) &&
          isExtendedResolvedDraftResultLine(resultLine) &&
          isExtendedResolvedDraftResultLine(result.resultLine) &&
          isResultLineSemanticallyEqual(result.resultLine, resultLine) &&
          result.resultLine.shortCode === resultLine.shortCode
        );
      }
      return false;
    });

    return !existingRelation;
  }

  throw new Error('This result line cannot form a valid relation with this parent.');
};

export const getActiveResultLines = (draftResult: DraftResult<ExtendedResolvedDraftResultLine>) => {
  const { resultLines = {} } = draftResult;

  return Object.values(resultLines).filter(isActiveDraftResultLine);
};

// Query an array of targetIds (i.e. offenceId or appl) from a draft result that
// have already been shared. This is used for determining where a target is
// being amended.
export const getSharedTargetIds = (() => {
  let lastSharedTargetIds: string[] = [];

  return memoizeOne((draftResult: DraftResult) => {
    const sharedTargetIds = Object.values(draftResult.resultLines)
      .filter(isSharedResultLine)
      .map(getTargetId);

    if (!isEqual(sharedTargetIds, lastSharedTargetIds)) {
      lastSharedTargetIds = sharedTargetIds;
    }
    return lastSharedTargetIds;
  });
})();

// Memoized helpers – for internal use only

const getRelationsMap = memoizeOne(
  (relations: DraftResultRelation[]): Record<string, DraftResultRelation> =>
    keyBy(relations, 'resultLineId')
);

const getGroupedResultsMap = memoizeOne(
  (draftResult: DraftResult): Record<string, Result<ExtendedResolvedDraftResultLine>[]> => {
    const groupedResultsMap: Record<string, Result<ExtendedResolvedDraftResultLine>[]> = {};

    Object.keys(draftResult.resultLines).forEach(resultLineId => {
      const resultLine = getResultLineById(draftResult, resultLineId);

      groupedResultsMap[resultLineId] = filterResults(
        draftResult,
        result =>
          isActiveDraftResultLine(result.resultLine) &&
          isResolvedDraftResultLine(resultLine) &&
          isExtendedResolvedDraftResultLine(result.resultLine) &&
          isResultLineSemanticallyEqual(resultLine, result.resultLine)
      );
    });
    return groupedResultsMap;
  }
);

const getParentRelationsMap = memoizeOne((relations: DraftResultRelation[]) => {
  const relationsMap: Record<string, string> = {};

  for (const relation of relations) {
    for (const childResultLineId of relation.childResultLineIds) {
      relationsMap[childResultLineId] = relation.resultLineId;
    }
  }
  return relationsMap;
});
