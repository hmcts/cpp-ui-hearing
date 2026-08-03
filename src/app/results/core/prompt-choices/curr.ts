import { ValidationErrors } from '@angular/forms';
import { CurrencyPromptChoice, PromptChoice, PromptChoiceChild } from '../../results.interfaces';

export const isCurrencyPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is CurrencyPromptChoice => {
  return promptChoice.type === 'CURR';
};

export const formatCurrencyValue = (value: string): string => {
  return `£${Number(value).toFixed(2)}`;
};

export const serializeCurrencyValue = (value: string | number): string => {
  return Number(value).toFixed(2);
};

export const validateCurrencyValue = (
  promptChoice: CurrencyPromptChoice,
  value: unknown
): ValidationErrors | null => {
  const numericValue = Number(value);
  const minValue = promptChoice.minValue !== undefined ? Number(promptChoice.minValue) : null;
  const isValidAmount = minValue !== null ? numericValue >= minValue : numericValue > 0;

  if (isNaN(numericValue)) {
    return { currency: true };
  }

  if (!isValidAmount) {
    return minValue !== null ? { currencyMin: { expected: minValue } } : { currency: true };
  }

  return null;
};
