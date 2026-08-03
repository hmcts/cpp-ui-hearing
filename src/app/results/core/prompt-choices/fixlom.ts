import { ValidationErrors } from '@angular/forms';
import {
  FixedListOtherMultiplePromptChoice,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';

const SERIALIZATION_DELIMITER = '###';

export const isFixedListOtherMultiplePromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is FixedListOtherMultiplePromptChoice => {
  return promptChoice.type === 'FIXLOM';
};

export const formatFixedListOtherMultipleValue = (value: string[]) => {
  return value.join(', ');
};

export const serializeFixedListOtherMultipleValue = (value: string[]) => {
  return value.join(SERIALIZATION_DELIMITER);
};

export const deserializeFixedListOtherMultipleValue = (value: string): string[] => {
  return value.split(SERIALIZATION_DELIMITER);
};

export const validateFixedListOtherMultipleValue = (value: unknown): ValidationErrors | null => {
  if (Array.isArray(value) && value.length > 0 && value.every(val => typeof val === 'string')) {
    return null;
  }
  return { fixedList: true };
};
