import {
  DraftResultPrompt,
  DraftResultPromptValue,
  DurationPromptChoice,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';

const minutesPerHour = 60;
const minutesPerDay = minutesPerHour * 24;
const minutesPerWeek = minutesPerDay * 7;

export const isDurationPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is DurationPromptChoice => {
  return promptChoice.type === 'DURATION';
};

export const formatDurationValue = (promptValues: DraftResultPromptValue[]): string => {
  return promptValues
    .map(promptValue => `${promptValue.value} ${promptValue.label.toLowerCase()}`)
    .join(' ');
};

export const getDurationValueFromMinutes = (minutes: number): DraftResultPromptValue[] => {
  if (minutes === 0) {
    return [{ label: 'MINUTES', value: 0 }];
  }
  if (minutes % minutesPerWeek === 0) {
    return [{ label: 'WEEKS', value: Math.floor(minutes / minutesPerWeek) }];
  }
  if (minutes % minutesPerDay === 0) {
    return [{ label: 'DAYS', value: Math.floor(minutes / minutesPerDay) }];
  }
  if (minutes % minutesPerHour === 0) {
    return [{ label: 'HOURS', value: Math.floor(minutes / minutesPerHour) }];
  }
  return [{ label: 'MINUTES', value: minutes }];
};

export const serializeDurationValue = (value: DraftResultPromptValue[]): string => {
  return value
    .map(draftResultPrompt => `${draftResultPrompt.value} ${draftResultPrompt.label}`)
    .join(' ');
};

export const deserializeDurationValue = (value: string): DraftResultPromptValue[] => {
  // Duration could have multiple values in pairs of value/unit with values serialised in
  // a string separated by spaces so split the string in parts separated by spaces and
  // iterate over the parts array in steps of two
  const parts = value.split(' ');
  const result = [];

  for (let i = 0; i < parts.length; i += 2) {
    const num = parts[i];
    const units = parts[i + 1];
    const deserializedValue = {
      label: units,
      value: Number(num)
    };

    result.push(deserializedValue);
  }
  return result;
};

export const validateDurationValue = (promptChoice: DurationPromptChoice, value: unknown) => {
  const validate = () => {
    const durationValues = value as DraftResultPrompt<number>[];

    if (durationValues.length >= 1 && promptChoice.multipleAllowed) {
      return promptChoice.durationSequence !== 2 || durationValues.every(v => v.value < 1000);
    }

    if (durationValues.length === 1 && !promptChoice.multipleAllowed) {
      return promptChoice.durationSequence !== 2 || durationValues[0].value < 1000;
    }

    return false;
  };
  return validate() ? null : { duration: true };
};
