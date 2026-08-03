import { BooleanPromptChoice, PromptChoice, PromptChoiceChild } from '../../results.interfaces';

export const isYesboxPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is BooleanPromptChoice => {
  return promptChoice.type === 'YESBOX';
};

export const serializeYesboxValue = (value: boolean): string => {
  return String(value);
};

export const deserializeYesboxValue = (value: string): boolean => {
  return value === 'true';
};
