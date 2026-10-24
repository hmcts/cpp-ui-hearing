import { flatten } from 'lodash-es';
import {
  AnyDraftResultLine,
  DraftResult,
  ResolvedDraftResultLine,
  SharedResult
} from '../results.interfaces';
import { getBookingReference, isAttachedToExistingHearing } from '../core/helpers';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';

/**
 * Every bookingId the pre-share gate must ask courtscheduler about.
 *
 * <p>A line attached to an existing hearing is left out: it needs no hold of its own to be
 * shareable, since the hearing it points at is already listed, and checking it would let a hold
 * that expired hours ago block a share that is perfectly valid.
 *
 * <p>What must NOT come back is the old allowlist of result short codes: it silently returned []
 * for any code nobody remembered to add, the gate then skipped the call entirely, and a clerk
 * shared into a purged hold. The predicate below stays structural - every line, minus the attach
 * lines - so a new result code cannot fall through it.
 *
 * @param draftResult the draft about to be shared
 * @returns the bookingIds to check, in result-line order
 */
/**
 * A line that a share has already settled: shared, and not touched since.
 *
 * <p>Its slot is decided. Either the share listed against the booking - in which case the
 * booking is a confirmed listing - or the share merged the line onto a session another
 * reference won, and the surplus reservation was released. Both are correct outcomes, and
 * NEITHER says anything about whether the share the clerk is about to make can succeed.
 *
 * <p>The released case is why this exists. courtscheduler answers NOT_FOUND for a booking it
 * deliberately deleted, exactly as it does for one that expired and was purged - it cannot tell
 * them apart. The gate read that as "nothing left to share against" and refused every later
 * share on the hearing, silently. LPT-2599; reproduced twice on STE02, and absent on STE34,
 * which has no reservations to release.
 *
 * <p>An AMENDED line is deliberately not settled. Amending and re-picking leaves the line with
 * its original sharedDate but a fresh, unconfirmed booking, and that booking does need checking -
 * if it has expired the share must not proceed. amendmentReason is what separates the two: the
 * amend flow sets it, and it is absent on a line nobody has touched since the share. Verified
 * against captured draft payloads for both cases.
 */
const isSettledShare = (resultLine: AnyDraftResultLine): boolean => {
  const line = resultLine as ResolvedDraftResultLine | undefined;
  return !!line?.sharedDate && !line?.amendmentReason;
};

/**
 * The booking references the last share of this hearing day carried.
 *
 * <p>Progression records every reference it resolves at a share, and on every later share reads
 * those from its own record without asking courtscheduler again. So a reference that went out in
 * a previous share is placeable whatever courtscheduler now says about it - including NOT_FOUND
 * after the merge released it as surplus. LPT-2600: an amended line whose reference was released
 * kept the gate refusing every later share, because isSettledShare has to treat every amended
 * line as possibly re-picked. The line cannot tell "amended and re-picked" from "amended, still
 * pointing at what was shared"; the reference can.
 */
export const getSharedBookingReferences = (sharedResult: SharedResult | undefined): Set<string> =>
  new Set(
    flatten((sharedResult?.resultLines ?? []).map(resultLine => resultLine.prompts ?? []))
      .filter(prompt => prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF && !!prompt.value)
      .map(prompt => prompt.value)
  );

/**
 * @param sharedBookingReferences references carried by the last share of this hearing day (see
 *   {@link getSharedBookingReferences}); none of them is checked. Empty - a first share, a legacy
 *   hearing, or the shared result could not be fetched - leaves the gate exactly as it was.
 */
export const getBookingReferencesToCheck = (
  draftResult: DraftResult,
  sharedBookingReferences: ReadonlySet<string> = new Set()
): string[] =>
  (Object.values(draftResult?.resultLines || {}) as AnyDraftResultLine[])
    .filter(resultLine => !isAttachedToExistingHearing(resultLine))
    .filter(resultLine => !isSettledShare(resultLine))
    .map(getBookingReference)
    .filter((bookingReference): bookingReference is string => !!bookingReference)
    .filter(bookingReference => !sharedBookingReferences.has(bookingReference));
