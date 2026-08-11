import { ValidationError } from '@cpp/pdk';
import { Defendant } from '../../../core/model/defendant';
import { HearingDetail } from '../../../core/model/hearing-detail';
import { Offence } from '../../../core/model/offence';
import { DraftResult, DraftResultPromptValue, OffenceLike } from '../../results.interfaces';
import {
  ResultsValidation,
  ResultsValidationDefendant,
  ResultsValidationErrors,
  ResultsValidationOffence,
  ResultsLineValidation
} from '../../results-validation.interfaces';
import { serializeDurationValue } from '../prompt-choices';
import { isActiveDraftResultLine, isResolvedDraftResultLine } from './result-line';

export const RESULTS_VALIDATION_ERROR_ANCHOR_PREFIX = 'results-validation-error';

export const buildShareValidationErrorSummary = (
  validationErrors: Partial<ResultsValidationErrors> | null
): ValidationError[] => {
  const summary: ValidationError[] = [];
  const usedIds = new Set<string>();

  const addSummaryError = (message: string, targetId?: string) => {
    const baseId = `${RESULTS_VALIDATION_ERROR_ANCHOR_PREFIX}-${targetId ?? summary.length}`;
    let id = baseId;
    for (let suffix = 2; usedIds.has(id); suffix += 1) {
      id = `${baseId}-${suffix}`;
    }
    usedIds.add(id);
    summary.push({ id, message, shouldFocus: false });
  };

  (validationErrors?.validationIssues || []).forEach(issue => {
    const affectedOffences = (issue.affectedOffences || []).filter(offence => offence.message);
    const affectedDefendants = (issue.affectedDefendants || []).filter(
      defendant => defendant.message
    );

    if (affectedOffences.length === 0 && affectedDefendants.length === 0) {
      if (issue.message) {
        addSummaryError(issue.message);
      }
      return;
    }
    affectedOffences.forEach(offence => addSummaryError(offence.message, offence.offenceId));
    affectedDefendants.forEach(defendant =>
      addSummaryError(defendant.message, defendant.defendantId)
    );
  });

  if (summary.length === 0) {
    (validationErrors?.errorMessages || []).forEach(message => addSummaryError(message));
  }
  return summary;
};

export const buildResultsValidationRequest = (
  draftResult: DraftResult,
  hearing: HearingDetail,
  defendants: Defendant[]
): ResultsValidation => {
  return {
    hearingId: draftResult.hearingId,
    hearingDay: draftResult.hearingDay,
    courtType: hearing.jurisdictionType,
    resultLines: buildResultLines(draftResult),
    defendants: buildDefendants(defendants),
    offences: buildOffences(hearing)
  };
};

const buildResultLines = (draftResult: DraftResult): ResultsLineValidation[] => {
  return Object.values(draftResult.resultLines || {})
    .filter(isActiveDraftResultLine)
    .filter(isResolvedDraftResultLine)
    .filter((line): line is typeof line & OffenceLike => 'offenceId' in line)
    .map(line => {
      const concurrent = line.resultPrompts.find(p => p.promptRef === 'concurrent');
      const consecutive = line.resultPrompts.find(
        p => p.promptRef === 'consecutiveToOffenceNumber'
      );

      const result: ResultsLineValidation = {
        resultLineId: line.resultLineId,
        shortCode: line.shortCode,
        label: line.label,
        defendantId: line.defendantId,
        offenceId: line.offenceId
      };

      if (concurrent !== undefined) {
        result.isConcurrent = concurrent.value as boolean;
      }

      if (consecutive && consecutive.value) {
        result.consecutiveToOffence = consecutive.value as string;
      }

      if (line.category) {
        result.category = line.category;
      }

      const prompts = (line.resultPrompts || [])
        .filter(
          p =>
            typeof p.value === 'string' ||
            typeof p.value === 'number' ||
            typeof p.value === 'boolean' ||
            (p.type === 'DURATION' && Array.isArray(p.value))
        )
        .map(p => ({
          promptRef: p.promptRef,
          promptValue:
            p.type === 'DURATION'
              ? serializeDurationValue(p.value as DraftResultPromptValue[])
              : String(p.value)
        }));
      if (prompts.length > 0) {
        result.prompts = prompts;
      }

      return result;
    });
};

const buildDefendants = (defendants: Defendant[]): ResultsValidationDefendant[] => {
  const seen = new Set<string>();
  return defendants
    .filter(defendant => {
      if (seen.has(defendant.id)) return false;
      seen.add(defendant.id);
      return true;
    })
    .map(defendant => ({
      defendantId: defendant.id,
      firstName: defendant.personDefendant
        ? defendant.personDefendant.personDetails.firstName
        : defendant.legalEntityDefendant?.organisation.name || '',
      lastName: defendant.personDefendant ? defendant.personDefendant.personDetails.lastName : '',
      dateOfBirth: defendant.personDefendant?.personDetails?.dateOfBirth,
      masterDefendantId: defendant.masterDefendantId
    }));
};

const buildOffences = (hearing: HearingDetail): ResultsValidationOffence[] => {
  const seen = new Set<string>();
  return (hearing.prosecutionCases || [])
    .reduce<{ offence: Offence; caseUrn?: string }[]>((acc, kase) => {
      const caseUrn = kase.prosecutionCaseIdentifier?.caseURN;
      return acc.concat(
        (kase.defendants || [])
          .reduce<Offence[]>((offAcc, d) => offAcc.concat(d.offences || []), [])
          .map(offence => ({ offence, caseUrn }))
      );
    }, [])
    .filter(({ offence }) => {
      if (seen.has(offence.id)) return false;
      seen.add(offence.id);
      return true;
    })
    .map(({ offence, caseUrn }) => ({
      offenceId: offence.id,
      offenceCode: offence.offenceCode,
      offenceTitle: offence.offenceTitle,
      orderIndex: offence.orderIndex,
      caseUrn,
      hasExistingCtlRecord: !!offence.custodyTimeLimit,
      isConvicted: !!offence.convictionDate
    }));
};
