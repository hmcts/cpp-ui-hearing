import { ValidationErrors } from '@angular/forms';
import { CourtroomPromptChoice, PromptChoice, PromptChoiceChild } from '../../results.interfaces';

export const isCourtroomPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is CourtroomPromptChoice => {
  return promptChoice.type === 'HCROOM';
};

export const validateCourtroomValue = (value: unknown): ValidationErrors | null => {
  return typeof value === 'string' ? null : { hcroom: true };
};
