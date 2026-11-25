/**
 * 'Select prison' precedence for a newly added custodial result (CHD-2714):
 *  1. the defendant's custodial establishment from Edit Case
 *  2. the prison of the last custodial result in the session
 *  3. blank
 * Existing result lines (saved drafts, amends, reshares) are never changed.
 */
import { sortBy } from 'lodash-es';
import { CustodyEstablishment, Defendant, HearingDetail, omitUndefined } from '../../../core';
import { DraftResultPrompt, NameAddressPromptChoice, PromptChoice } from '../../results.interfaces';
import { isNameAddressPromptChoice } from '../prompt-choices/nameaddress';

export const PRISON_PROMPT_REF = 'prison';

export interface CustodialEstablishmentTarget {
  caseId?: string;
  defendantId?: string;
  masterDefendantId?: string;
}

const normalise = (value: string): string => (value || '').trim().toLowerCase();

export const getPrisonPromptChoice = (
  promptChoices: PromptChoice[] = []
): NameAddressPromptChoice | undefined =>
  promptChoices.find(
    (promptChoice): promptChoice is NameAddressPromptChoice =>
      promptChoice.promptRef === PRISON_PROMPT_REF && isNameAddressPromptChoice(promptChoice)
  );

const lastUpdatedTime = (establishment: CustodyEstablishment): number => {
  const time = Date.parse(establishment.lastUpdated ?? '');

  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

/**
 * The most recently updated establishment of the defendant in this hearing only
 * (own case, matched cases, application subjects). Only changes are dated, so a
 * dated establishment wins over an undated one; otherwise the own case comes first.
 */
export const getCustodialEstablishmentForTarget = (
  hearing: Pick<HearingDetail, 'prosecutionCases' | 'courtApplications'> | undefined,
  target: CustodialEstablishmentTarget
): CustodyEstablishment | undefined => {
  if (!hearing || !target?.masterDefendantId) {
    return undefined;
  }
  const sameMasterDefendant: Defendant[] = (hearing.prosecutionCases || [])
    .reduce((all: Defendant[], prosecutionCase) => all.concat(prosecutionCase.defendants || []), [])
    .filter(defendant => defendant.masterDefendantId === target.masterDefendantId);
  const own = sameMasterDefendant.find(
    defendant =>
      defendant.id === target.defendantId &&
      (!target.caseId ||
        !defendant.prosecutionCaseId ||
        defendant.prosecutionCaseId === target.caseId)
  );
  const applicationSubjects = (hearing.courtApplications || [])
    .map(application => application.subject?.masterDefendant)
    .filter(masterDefendant => masterDefendant?.masterDefendantId === target.masterDefendantId);

  const establishmentsByPrecedence = [
    ...(own ? [own] : []),
    ...sameMasterDefendant.filter(defendant => defendant !== own),
    ...applicationSubjects
  ]
    .map(defendant => defendant.personDefendant?.custodialEstablishment)
    .filter(establishment => !!establishment?.name?.trim());

  return establishmentsByPrecedence.reduce<CustodyEstablishment | undefined>(
    (latest, establishment) =>
      !latest || lastUpdatedTime(establishment) > lastUpdatedTime(latest) ? establishment : latest,
    undefined
  );
};

/** A prison from the reference list brings its emails; any other prison only its name. */
export const createPrisonResultPromptForCustodialEstablishment = (
  promptChoice: NameAddressPromptChoice,
  establishment: CustodyEstablishment
): DraftResultPrompt => {
  const listItem = (promptChoice.nameAddressList || []).find(
    item => normalise(item.label) === normalise(establishment.name)
  );

  const value = (promptChoice.children || []).reduce((childPrompts, child) => {
    const childValue =
      child.partName === 'OrganisationName'
        ? listItem?.label ?? establishment.name.trim()
        : listItem?.addressParts?.[child.partName];

    return childValue
      ? [
          ...childPrompts,
          omitUndefined({
            promptRef: child.promptRef,
            promptId: child.code,
            label: child.label,
            type: child.type,
            value: childValue
          })
        ]
      : childPrompts;
  }, [] as DraftResultPrompt[]);

  const { promptRef, code: promptId, label, type } = promptChoice;

  return omitUndefined({ promptRef, promptId, label, type, value });
};

/** A prison typed in the notepad wins; one from the session cache is replaced. */
export const applyCustodialEstablishmentToResultPrompts = (
  promptChoices: PromptChoice[],
  resultPrompts: DraftResultPrompt[],
  establishment: CustodyEstablishment | undefined,
  resolvedPrompts: DraftResultPrompt[] = []
): DraftResultPrompt[] => {
  const prisonPromptChoice = getPrisonPromptChoice(promptChoices);

  if (
    !prisonPromptChoice ||
    !establishment?.name?.trim() ||
    resolvedPrompts.some(prompt => prompt.promptRef === PRISON_PROMPT_REF)
  ) {
    return resultPrompts;
  }

  const prisonPrompt = createPrisonResultPromptForCustodialEstablishment(
    prisonPromptChoice,
    establishment
  );

  return sortBy(
    [...resultPrompts.filter(prompt => prompt.promptRef !== PRISON_PROMPT_REF), prisonPrompt],
    ({ promptRef }) =>
      promptChoices.find(promptChoice => promptChoice.promptRef === promptRef)?.promptOrder
  );
};
