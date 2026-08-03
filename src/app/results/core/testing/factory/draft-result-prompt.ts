import { omitUndefined } from '../../../../core';
import {
  DraftResultPrompt,
  PromptChoice,
  PromptChoiceChild,
  RemoteResolvedParsedResult
} from '../../../results.interfaces';
import {
  isAddressPromptChoice,
  isBooleanPromptChoice,
  isCurrencyPromptChoice,
  isDatePromptChoice,
  isDurationPromptChoice,
  isFixedListMultiplePromptChoice,
  isFixedListOtherMultiplePromptChoice,
  isFixedListOtherPromptChoice,
  isFixedListPromptChoice,
  isIntegerPromptChoice,
  isNameAddressPromptChoice,
  isOneOfPromptChoice,
  isTextPromptChoice,
  isTimePromptChoice,
  isYesboxPromptChoice
} from '../../helpers';
import { patchLegacyParsedResultDefinition } from '../../patch';
import { getParsedResultDefinitionByShortCode } from '../resources';

export const createDraftResultPrompts = (
  promptChoices: Array<PromptChoice | PromptChoiceChild>
): DraftResultPrompt[] => {
  return promptChoices
    .map(createDraftResultPrompt)
    .filter(resultPrompt => resultPrompt.value !== undefined);
};

export const createDraftResultPrompt = (
  promptChoice: PromptChoice | PromptChoiceChild
): DraftResultPrompt => {
  const { promptRef, label, type } = promptChoice;

  let value: unknown;

  if (isAddressPromptChoice(promptChoice) || isNameAddressPromptChoice(promptChoice)) {
    value = createDraftResultPrompts(promptChoice.children);
  }
  if (isBooleanPromptChoice(promptChoice)) {
    value = true;
  }
  if (isCurrencyPromptChoice(promptChoice)) {
    value = '100';
  }
  if (isDatePromptChoice(promptChoice)) {
    value = '2020-01-01';
  }
  if (isDurationPromptChoice(promptChoice)) {
    value = [
      {
        type: 'INT',
        label: 'Minutes',
        value: 60
      }
    ];
  }
  if (isFixedListMultiplePromptChoice(promptChoice)) {
    value = [promptChoice.fixedList[0], promptChoice.fixedList[1]];
  }
  if (isFixedListOtherMultiplePromptChoice(promptChoice)) {
    value = [promptChoice.fixedList[0], 'X'];
  }
  if (isFixedListPromptChoice(promptChoice) || isFixedListOtherPromptChoice(promptChoice)) {
    value = promptChoice.fixedList[0];
  }
  if (isIntegerPromptChoice(promptChoice)) {
    value = 50;
  }
  if (isOneOfPromptChoice(promptChoice)) {
    value = createDraftResultPrompt(promptChoice.children[0]);
  }
  if (isTimePromptChoice(promptChoice)) {
    value = '10:00';
  }
  if (isTextPromptChoice(promptChoice)) {
    switch (promptChoice.partName) {
      case 'AddressLine1':
      case 'AddressLine2':
      case 'AddressLine3':
      case 'AddressLine4':
      case 'AddressLine5': {
        value = 'X';
        break;
      }
      case 'PostCode':
        value = 'CR0 1XN';
        break;

      case 'EmailAddress1':
      case 'EmailAddress2':
        value = 'foo@bar.org';
        break;

      default:
        value = '*';
    }
  }
  if (isYesboxPromptChoice(promptChoice)) {
    value = true;
  }

  return omitUndefined<DraftResultPrompt>({
    promptRef,
    promptId: 'code' in promptChoice ? promptChoice.code : undefined,
    label,
    type,
    value
  });
};

export const createDraftResultPromptsForShortcode = (shortCode: string): DraftResultPrompt[] => {
  const parsedResult = getParsedResultDefinitionByShortCode(shortCode);
  const { promptChoices } = patchLegacyParsedResultDefinition(
    parsedResult
  ) as RemoteResolvedParsedResult;

  return createDraftResultPrompts(promptChoices);
};
