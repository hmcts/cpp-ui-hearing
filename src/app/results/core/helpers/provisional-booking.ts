import { AnyDraftResultLine, DraftResult, ResolvedDraftResultLine } from '../../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';
// Written by related-hearings.container.ts when a clerk attaches a result line to an
// already-listed hearing (an "existing" hearing, not a newly booked one). In that path
// bookingReference holds a genuine courtScheduleId, not a bookingId - nothing was booked,
// so there is nothing to release. Skip these lines. Same exclusion as
// session-availability.helper.ts's getBookingReferencesToCheck.
const EXISTING_HEARING_PROMPT_REF = 'existingHearingId';

/**
 * Reads the bookingId of the provisional slot hold (if any) that a result line is
 * carrying, so that it can be released the moment the line is abandoned with no new
 * pick to carry the reference forward - e.g. the line is destroyed, or the whole draft
 * result is discarded and rebuilt from the server (reset-results).
 *
 * @param resultLine the result line to inspect - an unresolved line has no prompts yet,
 * and so trivially has nothing to release
 * @returns the bookingId to release, or undefined if there is nothing to release
 */
export const getBookingReferenceToRelease = (
  resultLine: AnyDraftResultLine | undefined
): string | undefined => {
  const prompts = (resultLine as ResolvedDraftResultLine | undefined)?.resultPrompts || [];

  const hasExistingHearing = prompts.some(
    prompt => prompt.promptRef === EXISTING_HEARING_PROMPT_REF
  );

  if (hasExistingHearing) {
    return undefined;
  }

  return prompts.find(prompt => prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF)?.value as
    | string
    | undefined;
};

/**
 * Collects the bookingIds of every provisional slot hold across a draft result. Used
 * when the whole draft result is about to be discarded (reset-results) so that every
 * hold it was carrying can be released before it becomes unreachable.
 *
 * @param draftResult the draft result to inspect
 * @returns the bookingIds to release
 */
export const getBookingReferencesToRelease = (draftResult: DraftResult | undefined): string[] => {
  const resultLines = Object.values(draftResult?.resultLines || {}) as AnyDraftResultLine[];

  return resultLines
    .map(getBookingReferenceToRelease)
    .filter((bookingReference): bookingReference is string => !!bookingReference);
};
