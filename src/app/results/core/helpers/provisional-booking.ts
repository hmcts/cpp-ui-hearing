import { AnyDraftResultLine, DraftResult, ResolvedDraftResultLine } from '../../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';

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
