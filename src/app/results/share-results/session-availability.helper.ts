import {
  deserializeDurationValue,
  getMinutesFromDurationValue
} from '../core/prompt-choices/duration';
import {
  DraftResult,
  DraftResultPrompt,
  DraftResultPromptValue,
  ResolvedDraftResultLine
} from '../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';
const DURATION_PROMPT_TYPE = 'DURATION';
// "Next hearing in Crown Court" - the only result that books a Crown court
// schedule without a provisional booking (magistrates' NHMC is provisionally
// booked and must NOT be re-validated).
const NEXT_HEARING_IN_CROWN_COURT = 'NHCCS';

export interface SessionAvailabilityValidationData {
  courtScheduleId: string;
  duration?: number;
}

export const getSessionAvailabilityValidationData = (
  draftResult: DraftResult
): SessionAvailabilityValidationData[] => {
  const validations: SessionAvailabilityValidationData[] = [];

  const resultLines = Object.values(draftResult?.resultLines || {}) as ResolvedDraftResultLine[];

  for (const resultLine of resultLines) {
    if (resultLine?.shortCode?.toUpperCase() !== NEXT_HEARING_IN_CROWN_COURT) {
      continue;
    }

    const prompts = resultLine.resultPrompts || [];
    const courtScheduleId = prompts.find(
      prompt => prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF
    )?.value as string;

    if (!courtScheduleId) {
      continue;
    }

    validations.push({ courtScheduleId, duration: getDurationInMinutes(prompts) });
  }

  return validations;
};

const getDurationInMinutes = (prompts: DraftResultPrompt[]): number | undefined => {
  const durationPrompt = prompts.find(prompt => prompt.type === DURATION_PROMPT_TYPE);

  if (!durationPrompt || durationPrompt.value == null) {
    return undefined;
  }

  const value =
    typeof durationPrompt.value === 'string'
      ? deserializeDurationValue(durationPrompt.value)
      : (durationPrompt.value as DraftResultPromptValue[]);

  return getMinutesFromDurationValue(value);
};
