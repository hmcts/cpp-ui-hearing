import { DraftResult, ResolvedDraftResultLine } from '../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';
// Written by related-hearings.container.ts when a clerk attaches this result to an
// already-listed hearing (an "existing" hearing, not a newly booked one). In that
// path bookingReference holds a genuine courtScheduleId, not a bookingId - nothing
// was booked, so asking the booking-status endpoint about it would come back NONE
// and wrongly block the share. Skip these lines.
const EXISTING_HEARING_PROMPT_REF = 'existingHearingId';
// "Next hearing in Crown Court" - the only result that books a Crown court
// schedule without a provisional booking (magistrates' NHMC is provisionally
// booked and must NOT be re-validated).
const NEXT_HEARING_IN_CROWN_COURT = 'NHCCS';

export const getBookingReferencesToCheck = (draftResult: DraftResult): string[] => {
  const bookingReferences: string[] = [];

  const resultLines = Object.values(draftResult?.resultLines || {}) as ResolvedDraftResultLine[];

  for (const resultLine of resultLines) {
    if (resultLine?.shortCode?.toUpperCase() !== NEXT_HEARING_IN_CROWN_COURT) {
      continue;
    }

    const prompts = resultLine.resultPrompts || [];

    const hasExistingHearing = prompts.some(
      prompt => prompt.promptRef === EXISTING_HEARING_PROMPT_REF
    );

    if (hasExistingHearing) {
      continue;
    }

    const bookingReference = prompts.find(
      prompt => prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF
    )?.value as string;

    if (!bookingReference) {
      continue;
    }

    bookingReferences.push(bookingReference);
  }

  return bookingReferences;
};
