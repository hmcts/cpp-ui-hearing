import { ValidationErrors } from '@angular/forms';
import { PromptChoice, PromptChoiceChild, TimePromptChoice } from '../../results.interfaces';

export const isTimePromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is TimePromptChoice => {
  return promptChoice.type === 'TIME';
};

export const validateTimeValue = (value: unknown): ValidationErrors | null => {
  if (typeof value === 'string' && /^(?:\d|[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }
  return { timeFormat: true };
};
