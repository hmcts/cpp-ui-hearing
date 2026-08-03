import { ValidationErrors } from '@angular/forms';
import { IntegerPromptChoice, PromptChoice, PromptChoiceChild } from '../../results.interfaces';

export const isIntegerPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is IntegerPromptChoice => {
  return (
    promptChoice.type === 'INT' || promptChoice.type === 'INTC' || promptChoice.type === 'INTM'
  );
};

export const validateIntegerValue = (
  promptChoice: IntegerPromptChoice,
  value: unknown
): ValidationErrors | null => {
  if (!/^\d+$/.test(String(value))) {
    return { number: true };
  }

  const numericValue = parseInt(String(value), 10);
  if (!Number.isInteger(numericValue)) {
    return { number: true };
  }

  const maxValue = Number(promptChoice.maxValue || Infinity);
  if (numericValue > maxValue) {
    return {
      maximumValue: {
        expected: maxValue,
        actual: numericValue
      }
    };
  }

  const minValue = Number(promptChoice.minValue || 0);
  if (numericValue < minValue) {
    return {
      minimumValue: {
        expected: minValue,
        actual: numericValue
      }
    };
  }

  const maxLength = Number(promptChoice.maxLength || Infinity);
  const minLength = Number(promptChoice.minLength || 0);
  const length = (value as string).length;
  if (maxLength === minLength && length !== maxLength) {
    return {
      exactLength: {
        expected: maxLength,
        actual: length
      }
    };
  }

  if (length > maxLength) {
    return {
      maximumLength: {
        expected: maxLength,
        actual: length
      }
    };
  }

  if (length < minLength) {
    return {
      minimumLength: {
        expected: minLength,
        actual: length
      }
    };
  }

  return null;
};
