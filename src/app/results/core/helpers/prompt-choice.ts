import { ValidationErrors } from '@angular/forms';
import { find } from 'lodash-es';
import { DraftResultPrompt, PromptChoice, PromptChoiceChild } from '../../results.interfaces';
import {
  isAddressPromptChoice,
  isBooleanPromptChoice,
  isCourtroomPromptChoice,
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
  isYesboxPromptChoice,
  validateAddressValue,
  validateBooleanValue,
  validateCourtroomValue,
  validateCurrencyValue,
  validateDateValue,
  validateDurationValue,
  validateFixedListMultipleValue,
  validateFixedListOtherMultipleValue,
  validateFixedListOtherValue,
  validateFixedListValue,
  validateIntegerValue,
  validateNameAddressValue,
  validateOneOfValue,
  validateTextValue,
  validateTimeValue
} from '../prompt-choices';

export * from '../prompt-choices';

export const isEmptyValue = (value: unknown): boolean => {
  return value === undefined || value === null || value === '';
};

export const isOptionalPromptChoice = (promptChoice: PromptChoice): boolean => {
  return !promptChoice.required && promptChoice.type !== 'HIDDEN';
};

export const isRequiredPromptChoice = (promptChoice: PromptChoice): boolean => {
  return promptChoice.required && promptChoice.type !== 'HIDDEN';
};

export const validateValueForPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild,
  value?: any
): ValidationErrors | null => {
  try {
    if (isAddressPromptChoice(promptChoice)) {
      return validateAddressValue(promptChoice, value);
    }
    if (isNameAddressPromptChoice(promptChoice)) {
      return validateNameAddressValue(promptChoice, value);
    }
    if (isEmptyValue(value)) {
      return promptChoice.required ? { required: true } : null;
    }
    if (isBooleanPromptChoice(promptChoice)) {
      return validateBooleanValue(value);
    }
    if (isCourtroomPromptChoice(promptChoice)) {
      return validateCourtroomValue(value);
    }
    if (isCurrencyPromptChoice(promptChoice)) {
      return validateCurrencyValue(promptChoice, value);
    }
    if (isDatePromptChoice(promptChoice)) {
      // Future-date validation (against the hearing day) is handled separately
      // by HearingDayDateValidatorDirective on the date prompt component.
      return validateDateValue(value);
    }
    if (isDurationPromptChoice(promptChoice)) {
      return validateDurationValue(promptChoice, value);
    }
    if (isCourtroomPromptChoice(promptChoice)) {
      return validateCourtroomValue(value);
    }
    if (isFixedListPromptChoice(promptChoice)) {
      return validateFixedListValue(promptChoice, value);
    }
    if (isIntegerPromptChoice(promptChoice)) {
      return validateIntegerValue(promptChoice, value);
    }
    if (isFixedListOtherPromptChoice(promptChoice)) {
      return validateFixedListOtherValue(value);
    }
    if (isFixedListOtherMultiplePromptChoice(promptChoice)) {
      return validateFixedListOtherMultipleValue(value);
    }
    if (isFixedListMultiplePromptChoice(promptChoice)) {
      return validateFixedListMultipleValue(promptChoice, value);
    }
    if (isOneOfPromptChoice(promptChoice)) {
      const errors = validateOneOfValue(promptChoice, value);

      if (!errors) {
        const { promptRef, value: childValue } = value as DraftResultPrompt;
        const childPromptChoice = find(promptChoice.children, { promptRef });

        return validateValueForPromptChoice(childPromptChoice, childValue);
      }
      return errors;
    }
    if (isTextPromptChoice(promptChoice)) {
      return validateTextValue(promptChoice, value);
    }
    if (isTimePromptChoice(promptChoice)) {
      return validateTimeValue(value);
    }
    if (isYesboxPromptChoice(promptChoice)) {
      return validateBooleanValue(value);
    }
  } catch (e) {
    return { parse: true };
  }
  throw new Error('No validator found.');
};
