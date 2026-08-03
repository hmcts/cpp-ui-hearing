import { flatten, isUndefined, keyBy, padStart } from 'lodash-es';
import { omitUndefined } from '../../../../core';
import { isEmptyValue } from '../../helpers';
import { Legacy, V1 } from './legacy.interfaces';

export const isLegacyDraftResult = <T extends object>(draftResult: T): boolean => {
  return 'targets' in draftResult;
};

export const migrateLegacyDraftResult = (
  draftResult: Legacy.DraftResult,
  { hearingId, hearingDay }: { hearingId: string; hearingDay: string }
): V1.DraftResult<V1.ResolvedDraftResultLine | V1.UnresolvedDraftResultLine> => {
  return draftResult.targets.reduce(
    ({ relations, resultLines, shadowListedOffenceIds, ...other }, target) => {
      const parsedDraftResult: Legacy.ParsedDraftResult = JSON.parse(target.draftResult);
      const migratedResultLines = {
        ...resultLines,
        ...keyBy(migrateResultLines(parsedDraftResult), 'resultLineId')
      };
      const migratedRelations = migrateResultRelations(parsedDraftResult);
      const migratedShadowListed: string[] = [];

      return {
        ...other,
        relations: [...relations, ...migratedRelations],
        shadowListedOffenceIds: [...shadowListedOffenceIds, ...migratedShadowListed],
        resultLines: migratedResultLines
      };
    },
    {
      hearingId,
      hearingDay,
      relations: [],
      shadowListedOffenceIds: [],
      resultLines: {}
    } as V1.DraftResult
  );
};

const migrateResultLines = ({
  applicationId,
  caseId,
  offenceId,
  defendantId,
  masterDefendantId,
  results
}: Legacy.ParsedDraftResult): Array<V1.UnresolvedDraftResultLine | V1.ResolvedDraftResultLine> => {
  return results.reduce(
    (migratedResultLines, result) => [
      ...migratedResultLines,
      ...migrateLegacyResultLineToResultLines({
        ...result,
        applicationId,
        caseId,
        defendantId,
        offenceId,
        masterDefendantId
      })
    ],
    [] as Array<V1.UnresolvedDraftResultLine | V1.ResolvedDraftResultLine>
  );
};

const migrateResultRelations = ({
  results
}: Legacy.ParsedDraftResult): V1.DraftResultRelation[] => {
  return results.reduce((draftResultRelations, legacyDraftResultLine) => {
    const { resultLineId, resultCode, isDeleted, lastSharedDate } = legacyDraftResultLine;

    if (!isDeleted || lastSharedDate) {
      const filteredChildResultLines = getLegacyChildResultLines(legacyDraftResultLine);

      return [
        ...draftResultRelations,
        {
          resultLineId,
          childResultLineIds: filteredChildResultLines
            .filter(childResultLine => !childResultLine.isDeleted || childResultLine.lastSharedDate)
            .map(childResultLine => childResultLine.resultLineId),
          ruleType: resultCode ? 'standalone' : 'unknown'
        },
        ...migrateChildResultLineRelations(filteredChildResultLines)
      ];
    }
    return draftResultRelations;
  }, [] as V1.DraftResultRelation[]);
};

const migrateChildResultLineRelations = (
  legacyChildResultLines: Legacy.DraftResultLine[]
): V1.DraftResultRelation[] => {
  return legacyChildResultLines.reduce((migratedChildResultLineIds, childResultLine) => {
    const { resultLineId, ruleType, isDeleted, lastSharedDate } = childResultLine;
    const filteredChildResultLines = getLegacyChildResultLines(childResultLine);

    if (!isDeleted || lastSharedDate) {
      return [
        ...migratedChildResultLineIds,
        {
          resultLineId,
          ruleType,
          childResultLineIds: filteredChildResultLines
            .filter(
              _childResultLine_ => !_childResultLine_.isDeleted || _childResultLine_.lastSharedDate
            )
            .map(filteredChildResultLine => filteredChildResultLine.resultLineId)
        },
        ...migrateChildResultLineRelations(filteredChildResultLines)
      ];
    }
    return [];
  }, [] as V1.DraftResultRelation[]);
};

const migrateLegacyResultLineToResultLines = (
  legacyDraftResultLine: Legacy.DraftResultLine & {
    applicationId?: string;
    caseId?: string;
    defendantId?: string;
    masterDefendantId?: string;
    offenceId?: string;
  }
): Array<V1.UnresolvedDraftResultLine | V1.ResolvedDraftResultLine> => {
  const {
    applicationId,
    amendmentReasonId,
    amendmentReason,
    amendmentDate,
    caseId,
    childResultLines,
    conditionalMandatorySelection,
    defendantId,
    delegatedPowers,
    dirty,
    isCompleted,
    isDeleted,
    masterDefendantId,
    resultCode,
    resultLineId,
    resultLevel,
    offenceId,
    orderedDate,
    originalText,
    choices = [],
    lastSharedDate,
    parts
  } = legacyDraftResultLine;

  if (lastSharedDate || !isDeleted) {
    const label = parts[0].value;
    const shortCode = resultCode && originalText.split(' ')[0];
    const filteredChildResultLines = getLegacyChildResultLines(legacyDraftResultLine);

    const getValuesForLegacyChoice = (
      choice: Legacy.PromptChoice
    ): { value?: unknown; welshValue?: unknown } => {
      const normalizeValue = (value: unknown) => {
        if (
          choice.type === 'DATE' &&
          /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/.test(String(value))
        ) {
          const [day, month, year] = String(value).split(/[\/\-]/);

          return `${year}-${padStart(month, 2, '0')}-${padStart(day, 2, '0')}`;
        }
        return value;
      };

      const getValues = (value: unknown) => {
        // Treat an empty array as though a value does not exist, so that we
        // don't create a result prompt for a choice that is incomplete
        if (Array.isArray(value) && value.length === 0) {
          return {};
        }
        // The 'HCROOM' value is stored using a serialised object like:
        // {"value": "Courtroom 1"}
        if (choice.type === 'HCROOM') {
          try {
            return JSON.parse(String(value));
          } catch {
            // do nothing if parsing fails – just treat this value as it doesn't
            // exist as it cannot be retrieved
            return {};
          }
        }
        return { value: normalizeValue(value) };
      };

      if (!isUndefined(choice.value)) {
        const values = getValues(choice.value);

        if (Object.keys(values).length > 0) {
          return values;
        }
      }
      // In a legacy draft result line, the values are sometimes saved within the `parts` collection
      const flattenedParts = parts.reduce((reducedParts, flattenedPart) => {
        if (flattenedPart.type === 'ONEOF') {
          return [...reducedParts, ...((flattenedPart.value as Legacy.PromptChoice[]) || [])];
        }
        return [...reducedParts, flattenedPart];
      }, [] as Array<Legacy.DraftResultLinePart | Legacy.PromptChoice>);

      const part = flattenedParts.find(
        flattenedPart => flattenedPart.promptRef === choice.promptRef
      );

      return part && part.value ? getValues(part.value) : {};
    };

    const resultPrompts = choices.reduce((reducedResultPrompts, legacyPromptChoice) => {
      const legacyValues = getValuesForLegacyChoice(legacyPromptChoice);

      if (legacyPromptChoice.type === 'ONEOF') {
        for (const childPromptChoice of legacyPromptChoice.children) {
          const { value, welshValue } = getValuesForLegacyChoice(childPromptChoice);

          if (!isEmptyValue(value)) {
            return [
              ...reducedResultPrompts,
              migrateToDraftResultPrompt(
                legacyPromptChoice,
                migrateToDraftResultPrompt(childPromptChoice, value, welshValue)
              )
            ];
          }
        }
      } else if (!isEmptyValue(legacyValues.value)) {
        return [
          ...reducedResultPrompts,
          migrateToDraftResultPrompt(
            legacyPromptChoice,
            legacyValues.value,
            legacyValues.welshValue
          )
        ];
      }
      return reducedResultPrompts;
    }, [] as V1.DraftResultPrompt[]);

    // Build the unresolved parts:
    // - strip RESOLVED parts
    // - create result prompts for any identifiable matches
    const unresolvedParts = parts
      .filter(part => part.state === 'UNRESOLVED')
      .map((part): V1.UnresolvedPart => {
        if (part.type !== 'RESULT') {
          const matches = choices.filter(promptChoice => promptChoice.type === part.type);

          return omitUndefined({
            type: part.type,
            value: String(part.value),
            originalText: part.originalText,
            resultPrompts: matches.map(promptChoice =>
              migrateToDraftResultPrompt(promptChoice, part.value)
            )
          });
        }
        return {
          state: 'UNRESOLVED',
          resultChoices: part.resultChoices || [],
          value: String(part.value)
        };
      });

    const amendmentTime = amendmentDate && new Date(amendmentDate).toISOString();
    const sharedDate = lastSharedDate
      ? dirty
        ? new Date(lastSharedDate).toISOString()
        : amendmentTime || new Date(lastSharedDate).toISOString()
      : undefined;

    const commonData = {
      delegatedPowers,
      deleted: isDeleted,
      resultLineId,
      resultLevel,
      orderedDate,
      originalText,
      resultDefinitionId: resultCode,
      label: String(label),
      shortCode,
      unresolvedParts: unresolvedParts as V1.UnresolvedPromptPart[],
      resultPrompts,
      sharedDate,
      valid: Boolean(isCompleted || conditionalMandatorySelection),
      amendmentDate: amendmentDate && new Date(amendmentDate).toISOString(),
      amendmentReason: amendmentReasonId && {
        id: amendmentReasonId,
        reasonDescription: amendmentReason
      }
    };

    const resultLine: V1.ResolvedDraftResultLine = offenceId
      ? {
          ...commonData,
          applicationId,
          caseId,
          defendantId,
          masterDefendantId,
          offenceId
        }
      : {
          ...commonData,
          applicationId
        };

    return childResultLines
      ? [
          omitUndefined(resultLine),
          ...flatten(
            filteredChildResultLines.map(childResultLine =>
              migrateLegacyResultLineToResultLines({
                ...childResultLine,
                applicationId,
                masterDefendantId,
                defendantId,
                caseId,
                offenceId
              })
            )
          )
        ]
      : [omitUndefined(resultLine)];
  }
  return [];
};

const migrateToDraftResultPrompt = (
  legacyPromptChoice: Legacy.PromptChoice,
  value: unknown,
  welshValue?: unknown
): V1.DraftResultPrompt => {
  // Retain a migration found within the original legacy implementation
  let promptRef =
    legacyPromptChoice.promptRef === 'HCHOUSE' ? 'hCHOUSE' : legacyPromptChoice.promptRef;
  promptRef =
    promptRef === 'hCHOUSE' && !Array.isArray(value)
      ? 'hCHOUSEOrganisationName'
      : legacyPromptChoice.promptRef;

  const type = legacyPromptChoice.hidden
    ? 'HIDDEN'
    : (legacyPromptChoice.type as V1.ResultPromptType);

  if (type === 'ADDRESS') {
    [promptRef] = promptRef.split('Address1');
  }

  switch (type) {
    case 'FIXLM':
    case 'FIXLOM':
      value = String(value).split('###');
      break;

    case 'NAMEADDRESS':
      [promptRef] = promptRef.split('OrganisationName');
      value = (value as Legacy.PromptChoice[])
        .filter(choice => Boolean(choice.promptRef))
        .map(choice =>
          migrateToDraftResultPrompt({ ...choice, code: legacyPromptChoice.code }, choice.value)
        );
      break;

    default: {
      value = Array.isArray(value)
        ? (value as Legacy.PromptChoice[]).map(choice =>
            migrateToDraftResultPrompt({ ...choice, code: legacyPromptChoice.code }, choice.value)
          )
        : value;
    }
  }

  return omitUndefined({
    promptId: legacyPromptChoice.code,
    promptRef,
    label: legacyPromptChoice.label,
    welshLabel: legacyPromptChoice.welshLabel,
    type,
    welshValue,
    value
  });
};

const getLegacyChildResultLines = ({
  conditionalMandatory,
  conditionalMandatorySelection,
  childResultDefinitions = [],
  childResultLines = []
}: Legacy.DraftResultLine) => {
  return childResultLines.filter(childResultLine => {
    if (
      conditionalMandatory &&
      conditionalMandatorySelection !== 'YES' &&
      childResultDefinitions.find(
        childResultDefinition =>
          childResultDefinition.ruleType === 'mandatory' &&
          childResultLine.resultCode === childResultDefinition.code
      )
    ) {
      return false;
    }

    return true;
  });
};
