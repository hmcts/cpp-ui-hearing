import { omitUndefined } from '../../../core';
import {
  DraftResultPrompt,
  DraftResultPromptValue,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';
import {
  deserializeBooleanValue,
  deserializeDurationValue,
  deserializeFixedListMultipleValue,
  deserializeFixedListOtherMultipleValue,
  deserializeYesboxValue,
  formatAddressValue,
  formatCurrencyValue,
  formatDateValue,
  formatDurationValue,
  formatFixedListMultipleValue,
  formatFixedListOtherMultipleValue,
  formatNameAddressValue,
  serializeBooleanValue,
  serializeCurrencyValue,
  serializeDurationValue,
  serializeFixedListMultipleValue,
  serializeFixedListOtherMultipleValue,
  serializeYesboxValue
} from '../prompt-choices';
import {
  isAddressPromptChoice,
  isEmptyValue,
  isNameAddressPromptChoice,
  isOneOfPromptChoice,
  validateValueForPromptChoice
} from './prompt-choice';

/**
 * Create a result prompt from a prompt choice and a value.
 *
 * @param promptChoice the (child) prompt choice
 * @param value the value to assign to the result prompt
 * @returns the result prompt
 */
export function createDraftResultPrompt(
  { code, promptRef, label, type }: PromptChoice | PromptChoiceChild,
  value: unknown
): DraftResultPrompt {
  // Handle an empty value being provided to the result prompt (i.e. undefined,
  // null or ''). Note that it should be impossible for an empty value to reach
  // this function, but as a failsafe, an error is thrown
  if (!isEmptyValue(value)) {
    return omitUndefined({ promptRef, promptId: code, label, type, value });
  }
  throw new Error('Result prompt cannot be created with an empty value');
}

/**
 * Build a collection of result prompts from the values collected by a form. As
 * the form may introduce controls for UI purposes, we iterate through the
 * available prompt choices rather than through the received values.
 *
 * @param promptChoices the prompts choices for creating result prompts
 * @param values a dictionary of values keyed by `promptRef`
 * @returns a collection of draft result prompts
 */
export const createDraftResultPromptsFromValueMap = (
  promptChoices: PromptChoice[],
  values: Record<string, unknown>
): DraftResultPrompt[] => {
  const mapPromptChoiceToResultPrompt = (
    promptChoice: PromptChoice | PromptChoiceChild
  ): DraftResultPrompt | undefined => {
    // An address-like prompt choice acts as a proxy to its component child
    // result prompts. To this effect, it exists just to group the child result
    // prompts.
    if (isAddressPromptChoice(promptChoice) || isNameAddressPromptChoice(promptChoice)) {
      const value = (promptChoice.children as PromptChoiceChild[]).reduce(
        (childResultPrompts, childPromptChoice) => {
          const childResultPrompt = mapPromptChoiceToResultPrompt(childPromptChoice);

          return childResultPrompt
            ? [...childResultPrompts, childResultPrompt]
            : childResultPrompts;
        },
        [] as DraftResultPrompt[]
      );

      if (value.length > 0) {
        return createDraftResultPrompt(promptChoice, value);
      }
    }
    // A 'oneOf' prompt choice also behaves like a proxy to select a single
    // result prompt, but with a 1-to-1 relationship
    if (isOneOfPromptChoice(promptChoice)) {
      for (const childPromptChoice of promptChoice.children) {
        const childResultPrompt = mapPromptChoiceToResultPrompt(childPromptChoice);

        if (childResultPrompt) {
          return createDraftResultPrompt(promptChoice, childResultPrompt);
        }
      }
    }
    // When a value exists for any other prompt type, it has its own dedicated
    // result prompt.
    const rawValue = values[promptChoice.promptRef];

    if (!isEmptyValue(rawValue)) {
      // support serialized values, i.e. where a value is a string, attempt to
      // deserialize it
      const value =
        typeof rawValue === 'string'
          ? deserializeDraftResultPromptValue(promptChoice.type, rawValue)
          : rawValue;

      return createDraftResultPrompt(promptChoice, value);
    }

    return undefined;
  };

  return promptChoices.reduce((resultPrompts, promptChoice) => {
    const resultPrompt = mapPromptChoiceToResultPrompt(promptChoice);

    return resultPrompt ? [...resultPrompts, resultPrompt] : resultPrompts;
  }, [] as DraftResultPrompt[]);
};

export const deserializeDraftResultPromptValue = (
  type: DraftResultPrompt['type'],
  value: string
): unknown => {
  switch (type) {
    case 'BOOLEAN':
      return deserializeBooleanValue(value);

    case 'DURATION':
      return deserializeDurationValue(value);

    case 'FIXLM':
      return deserializeFixedListMultipleValue(value);

    case 'FIXLOM':
      return deserializeFixedListOtherMultipleValue(value);

    case 'YESBOX':
      return deserializeYesboxValue(value);

    default:
      return value;
  }
};

export const serializeDraftResultPromptValue = (
  type: DraftResultPrompt['type'],
  value: unknown
): string => {
  switch (type) {
    case 'BOOLEAN':
      return serializeBooleanValue(value as boolean);

    case 'CURR':
      return serializeCurrencyValue(value as string);

    case 'DURATION':
      return serializeDurationValue(value as DraftResultPromptValue[]);

    case 'FIXLM':
      return serializeFixedListMultipleValue(value as string[]);

    case 'FIXLOM':
      return serializeFixedListOtherMultipleValue(value as string[]);

    case 'YESBOX':
      return serializeYesboxValue(value as boolean);

    default:
      return String(value);
  }
};

export const formatDraftResultPromptValue = (
  type: DraftResultPrompt['type'],
  value: unknown
): string => {
  switch (type) {
    case 'ADDRESS':
      return formatAddressValue(value as DraftResultPrompt<string>[]);

    case 'CURR':
      return formatCurrencyValue(value as string);

    case 'DATE':
      return formatDateValue(value as string);

    case 'DURATION':
      return formatDurationValue(value as DraftResultPromptValue[]);

    case 'FIXLM':
      return formatFixedListMultipleValue(value as string[]);

    case 'FIXLOM':
      return formatFixedListOtherMultipleValue(value as string[]);

    case 'NAMEADDRESS':
      return formatNameAddressValue(value as DraftResultPrompt<string>[]);

    default:
      return String(value);
  }
};

/**
 * Validate a prompt choice against a value to determine if it satisfies the
 * requirements. Note that, while a value will always have been validated
 * through the UI at the point when it was saved, subsequent changes to the
 * prompt choice itself may have since invalidated the value.
 *
 * @param promptChoice the prompt choice used to evaluate the cached value
 * @param value the value to be validated
 * @returns whether the value can be used in a result prompt
 */
export const isValidValueForDraftResultPrompt = (
  promptChoice: PromptChoice | PromptChoiceChild,
  value?: any
): boolean => {
  try {
    if (!isEmptyValue(value)) {
      const errors = validateValueForPromptChoice(promptChoice, value);

      return !errors;
    }
  } catch {}
  return false;
};

export const validateDraftResultPrompts = (
  promptChoices: PromptChoice[],
  resultPrompts: DraftResultPrompt[]
): boolean => {
  const durationPromptRefs = new Set(
    promptChoices.filter(pc => pc.type === 'DURATION').map(pc => pc.promptRef)
  );

  return promptChoices.every(promptChoice => {
    if (promptChoice.type === 'HIDDEN') {
      return true;
    }
    // An INTM prompt sharing a promptRef with a DURATION is an internal
    // sub-component of that DURATION — it is captured by the DURATION form
    // control and does not need separate validation.
    if (promptChoice.type === 'INTM' && durationPromptRefs.has(promptChoice.promptRef)) {
      return true;
    }

    const resultPrompt = resultPrompts.find(
      ({ promptRef }) => promptChoice.promptRef === promptRef
    );

    return !validateValueForPromptChoice(
      promptChoice,
      resultPrompt ? resultPrompt.value : undefined
    );
  });
};
