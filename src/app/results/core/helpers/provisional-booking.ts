import { AnyDraftResultLine, DraftResult, ResolvedDraftResultLine } from '../../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';
// An attach-to-existing-hearing line points at a hearing that is ALREADY listed;
// related-hearings.container.ts writes this prompt and no bookingReference.
const EXISTING_HEARING_PROMPT_REF = 'existingHearingId';

/**
 * No row under this bookingId in either shape: the hold expired and was purged, so there is
 * nothing left to share against and the clerk must re-pick. The only status for which
 * courtscheduler reports `safeToShare: false`.
 */
export const NOT_FOUND_BOOKING_STATUS = 'NOT_FOUND';

/**
 * The bookingId of the slot hold a result line is carrying, if any.
 *
 * <p>Holds are not released from here. Hearing compares each saved draft with the previous one and
 * releases every booking no line carries any more (LPT-2617), so deleting a line, attaching it to
 * an existing hearing or resetting the results is enough on its own.
 */
export const getBookingReference = (
  resultLine: AnyDraftResultLine | undefined
): string | undefined =>
  ((resultLine as ResolvedDraftResultLine | undefined)?.resultPrompts || []).find(
    prompt => prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF
  )?.value as string | undefined;

/**
 * Whether the line has been attached to an already-listed hearing.
 *
 * <p>Such a line needs no hold of its own to be shareable - the hearing it points at exists
 * already - so the pre-share gate must not fail it over a missing one.
 */
export const isAttachedToExistingHearing = (resultLine: AnyDraftResultLine | undefined): boolean =>
  ((resultLine as ResolvedDraftResultLine | undefined)?.resultPrompts || []).some(
    prompt => prompt.promptRef === EXISTING_HEARING_PROMPT_REF
  );

/**
 * Whether a line other than `resultLineId` carries `bookingReference`.
 *
 * <p>Copying a result (`DraftResultBuilderService.copyResultLines`) keeps every prompt but
 * sharedDate, so a copied next hearing points at the SAME booking as its original. Re-sending that
 * id on a re-pick of one line would move the other line's session too, so the pickers ask for a
 * fresh booking instead.
 */
export const isBookingReferenceCarriedByAnotherLine = (
  draftResult: DraftResult | undefined,
  bookingReference: string,
  resultLineId: string
): boolean =>
  (Object.values(draftResult?.resultLines || {}) as AnyDraftResultLine[]).some(
    resultLine =>
      (resultLine as ResolvedDraftResultLine).resultLineId !== resultLineId &&
      ((resultLine as ResolvedDraftResultLine).resultPrompts || []).some(
        prompt =>
          prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF && prompt.value === bookingReference
      )
  );
