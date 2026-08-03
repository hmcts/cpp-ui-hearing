import { ValidationErrors } from '@angular/forms';
import { find } from 'lodash-es';
import {
  DraftResultPrompt,
  OneOfPromptChoice,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';

export const isOneOfPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is OneOfPromptChoice => {
  return promptChoice.type === 'ONEOF';
};

export const validateOneOfValue = (
  promptChoice: OneOfPromptChoice,
  { promptRef }: DraftResultPrompt
): ValidationErrors | null => {
  const childPromptChoice = find(promptChoice.children, { promptRef });

  return childPromptChoice ? null : { oneOf: true };
};
