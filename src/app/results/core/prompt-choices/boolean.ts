import { ValidationErrors } from '@angular/forms';
import { BooleanPromptChoice, PromptChoice, PromptChoiceChild } from '../../results.interfaces';

export const isBooleanPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is BooleanPromptChoice => {
  return promptChoice.type === 'BOOLEAN';
};

export const formatBooleanValue = (value: boolean): string => {
  return serializeBooleanValue(value);
};

export const serializeBooleanValue = (value: boolean): string => {
  return String(value);
};

export const deserializeBooleanValue = (value: string): boolean => {
  return value === 'true';
};

export const validateBooleanValue = (value: unknown): ValidationErrors | null => {
  return typeof value === 'boolean' ? null : { boolean: true };
};
