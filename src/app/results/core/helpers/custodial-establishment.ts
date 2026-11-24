/**
 * CHD-2714 / CHD-3288 – pre-populate the 'Select prison' prompt of a custodial
 * result from the defendant's custodial establishment recorded in Edit Case.
 *
 * Order of precedence for the prison prompt of a newly added result line:
 *  1. the defendant's custodial establishment in this hearing: the most
 *     recently updated one (`lastUpdated`) across the defendant's own case, the
 *     same master defendant on other cases and as the subject of an application
 *     (AC9b, AC9d). Without dates: own case first, then the other cases, then
 *     the application subjects
 *  2. the prison from the last custodial result entered in the session
 *     (existing reuse-of-information cache, untouched here)
 *  3. blank
 *
 * Values already held by a result line (saved drafts, amends, reshares) are
 * never overwritten: these helpers are only applied when a result line is
 * created from the notepad or copied to another defendant.
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

/** The prison prompt choice of a result definition, if it has one. */
export const getPrisonPromptChoice = (
  promptChoices: PromptChoice[] = []
): NameAddressPromptChoice | undefined =>
  promptChoices.find(
    (promptChoice): promptChoice is NameAddressPromptChoice =>
      promptChoice.promptRef === PRISON_PROMPT_REF && isNameAddressPromptChoice(promptChoice)
  );

/** When the establishment was last updated; one without a (valid) date sorts last. */
const lastUpdatedTime = (establishment: CustodyEstablishment): number => {
  const time = Date.parse(establishment.lastUpdated ?? '');

  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
};

/**
 * The custodial establishment to use for a result target, from the same master
 * defendant in this hearing only (AC9e: cases outside the hearing are never
 * considered):
 *  - the most recently updated establishment wins (AC9b, AC9d), whether it is
 *    on the target's own case, on a matched case or on the subject of an
 *    application (AC11a);
 *  - one with a `lastUpdated` date wins over one without, as the date is only
 *    recorded when an establishment changes;
 *  - otherwise (no dates, or equal dates) the target's own case comes first,
 *    then the other cases in hearing order, then the application subjects.
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

  // in order of precedence for when the dates do not decide
  const establishments = [
    ...(own ? [own] : []),
    ...sameMasterDefendant.filter(defendant => defendant !== own),
    ...applicationSubjects
  ]
    .map(defendant => defendant.personDefendant?.custodialEstablishment)
    .filter(establishment => !!establishment?.name?.trim());

  return establishments.reduce<CustodyEstablishment | undefined>(
    (latest, establishment) =>
      !latest || lastUpdatedTime(establishment) > lastUpdatedTime(latest) ? establishment : latest,
    undefined
  );
};

/**
 * Build the NAMEADDRESS result prompt for a custodial establishment. When the
 * establishment matches an item of the prompt's prison list, every part of
 * that item (name, emails, address) is used so the type-ahead shows it as
 * selected; otherwise only the organisation name is set.
 */
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

/**
 * Apply the custodial establishment to the prompts of a result line being
 * added. A prison typed in the notepad text (`resolvedPrompts`) still wins; a
 * prison coming from the session cache is replaced.
 */
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
