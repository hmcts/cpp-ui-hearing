import { ValidationErrors } from '@angular/forms';
import { FixedListPromptChoice, PromptChoice, PromptChoiceChild } from '../../results.interfaces';

export const isFixedListPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is FixedListPromptChoice => {
  return promptChoice.type === 'FIXL';
};

export const validateFixedListValue = (
  promptChoice: FixedListPromptChoice,
  value: string
): ValidationErrors | null => {
  return promptChoice.fixedList.find(
    fixedListValue => fixedListValue.toLowerCase() === value.toLowerCase()
  )
    ? null
    : { fixedList: true };
};
