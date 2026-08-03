import { AmendmentReason } from '../../../../core';
import { v4 as uuid } from 'uuid';
import {
  AnyDraftResultLine,
  DraftResult,
  DraftResultRelation,
  ExtendedResolvedDraftResultLine,
  ResolvedDraftResultLine,
  TargetLike,
  UnresolvedDraftResultLine,
  RemoteUnresolvedPart
} from '../../../results.interfaces';
import { getParsedResultDefinitionByShortCode } from '../resources';
import { createDraftResultPromptsForShortcode } from './draft-result-prompt';

export function createDraftResult<T extends AnyDraftResultLine>({
  hearingId = 'hearingId',
  hearingDay = '2020-01-01',
  results = [],
  version = 0
}: {
  hearingId?: string;
  hearingDay?: string;
  results?: string[];
  version?: number;
} = {}): DraftResult<T> {
  const relations: DraftResultRelation[] = [];
  const resultLines: Record<string, T> = {};

  for (const shortCode of results) {
    const resultLineId = `UUID:${results.indexOf(shortCode) + 1}`;

    let resultLine: AnyDraftResultLine;

    try {
      resultLine = createResolvedDraftResultLine({
        resultLineId,
        shortCode,
        orderedDate: hearingDay,
        applicationId: 'applicationId'
      });
    } catch {
      resultLine = createUnresolvedDraftResultLine({
        resultLineId,
        shortCode,
        orderedDate: hearingDay,
        applicationId: 'applicationId'
      });
    }
    resultLines[resultLine.resultLineId] = resultLine as T;
    relations.push({
      ruleType: 'standalone',
      resultLineId: resultLine.resultLineId,
      childResultLineIds: []
    });
  }

  return {
    hearingId,
    hearingDay,
    relations,
    resultLines,
    shadowListedOffenceIds: [],
    version: version + 1
  };
}

export const createUnresolvedDraftResultLine = ({
  resultLineId = uuid(),
  orderedDate = '2020-01-01',
  shortCode,
  unresolvedParts = [],
  ...foreignKeysForTarget
}: TargetLike<{
  resultLineId?: string;
  orderedDate?: string;
  shortCode: string;
  unresolvedParts?: RemoteUnresolvedPart[];
}>): UnresolvedDraftResultLine => {
  return {
    orderedDate,
    resultLineId,
    originalText: shortCode,
    unresolvedParts,
    ...foreignKeysForTarget
  };
};

type CreateResultLineOptions = TargetLike<{
  resultLineId?: string;
  orderedDate?: string;
  sharedDate?: string;
  amendmentReason?: AmendmentReason;
  amendmentDate?: string;
  shortCode: string;
  resultPrompts?: boolean;
}>;

export const createResolvedDraftResultLine = (
  options: CreateResultLineOptions
): ResolvedDraftResultLine => {
  const { conditionalMandatory, promptChoices, resultDefinitionId, resultLevel, label } =
    getParsedResultDefinitionByShortCode(options.shortCode);

  return {
    ...options,
    label,
    resultLineId: options.resultLineId || uuid(),
    orderedDate: options.orderedDate || '2020-01-01',
    originalText: options.shortCode,
    unresolvedParts: [],
    resultDefinitionId,
    resultLevel,
    resultPrompts: options.resultPrompts
      ? createDraftResultPromptsForShortcode(options.shortCode)
      : [],
    valid: options.resultPrompts ? true : promptChoices.length === 0 && !conditionalMandatory
  };
};

export const createExtendedResolvedDraftResultLine = (
  options: CreateResultLineOptions
): ExtendedResolvedDraftResultLine => {
  const resultLine = createResolvedDraftResultLine(options);
  const {
    childResultDefinitions = [],
    conditionalMandatory,
    excludedFromResults,
    promptChoices
  } = getParsedResultDefinitionByShortCode(options.shortCode);

  return {
    ...resultLine,
    childResultDefinitions,
    conditionalMandatory,
    excludedFromResults,
    promptChoices
  };
};

export const extendDraftResult = <T extends DraftResult>(draftResult: T): DraftResult => {
  return {
    ...draftResult,
    resultLines: Object.keys(draftResult.resultLines).reduce((resultLines, resultLineId) => {
      const resultLine = resultLines[resultLineId];

      if ('resultDefinitionId' in resultLine) {
        const {
          promptChoices,
          conditionalMandatory,
          childResultDefinitions = []
        } = getParsedResultDefinitionByShortCode(resultLine.shortCode);

        return {
          ...resultLines,
          [resultLineId]: {
            ...resultLine,
            promptChoices,
            conditionalMandatory,
            childResultDefinitions
          }
        };
      }
      return resultLines;
    }, draftResult.resultLines)
  };
};
