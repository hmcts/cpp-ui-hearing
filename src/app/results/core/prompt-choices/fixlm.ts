import { ValidationErrors } from '@angular/forms';
import {
  FixedListMultiplePromptChoice,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';

const SERIALIZATION_DELIMITER = '###';

export const isFixedListMultiplePromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is FixedListMultiplePromptChoice => {
  return promptChoice.type === 'FIXLM';
};

export const formatFixedListMultipleValue = (value: string[]) => {
  return value.join(', ');
};

export const serializeFixedListMultipleValue = (value: string[]) => {
  return value.join(SERIALIZATION_DELIMITER);
};

export const deserializeFixedListMultipleValue = (value: string): string[] => {
  return value.split(SERIALIZATION_DELIMITER);
};

export const validateFixedListMultipleValue = (
  promptChoice: FixedListMultiplePromptChoice,
  value: unknown
): ValidationErrors | null => {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(item =>
      promptChoice.fixedList.find(
        fixedListValue => fixedListValue.toLowerCase() === item.toLowerCase()
      )
    )
  ) {
    return null;
  }
  return { fixedList: true };
};
