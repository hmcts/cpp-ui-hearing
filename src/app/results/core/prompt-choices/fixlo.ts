import { ValidationErrors } from '@angular/forms';
import {
  FixedListOtherPromptChoice,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';

export const isFixedListOtherPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is FixedListOtherPromptChoice => {
  return promptChoice.type === 'FIXLO';
};

export const validateFixedListOtherValue = (value: unknown): ValidationErrors | null => {
  return typeof value === 'string' ? null : { fixedList: true };
};
