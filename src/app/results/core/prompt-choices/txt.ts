import { ValidationErrors } from '@angular/forms';
import { PromptChoice, PromptChoiceChild, TextPromptChoice } from '../../results.interfaces';

export const isTextPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is TextPromptChoice => {
  return promptChoice.type === 'TXT' || promptChoice.type === 'HIDDEN';
};

export const validateTextValue = (
  promptChoice: TextPromptChoice,
  rawValue: string
): ValidationErrors | null => {
  const value = rawValue.trim();
  const length = (value as string).length;

  // CCT-2248: This is short term validation to prevent users entering numbers, commas and few symbols  in name fields.
  // A proper solution will be implemented as part of the name and address component work.
  if (
    promptChoice.promptRef === 'protectedPersonsName' ||
    promptChoice.promptRef === 'thirdPartysNameVictimOrPolice'
  ) {
    const fullNameRegex = /[\d,():|]+/g; // Will match any digits or commas
    if (fullNameRegex.test(value)) {
      return {
        pattern: {
          promptFriendlyName:
            promptChoice.promptRef === 'protectedPersonsName' ? 'protected person' : 'third party'
        }
      };
    }
  }

  if (length < Number(promptChoice.minLength || 0)) {
    return {
      minimumLength: {
        expected: Number(promptChoice.minLength || 0),
        actual: length
      }
    };
  }

  return length <= Number(promptChoice.maxLength || Infinity)
    ? null
    : { maximumLength: { expected: Number(promptChoice.maxLength), actual: length } };
};
