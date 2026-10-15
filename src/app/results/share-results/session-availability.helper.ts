import { AnyDraftResultLine, DraftResult, ResolvedDraftResultLine } from '../results.interfaces';
import { getBookingReferenceToRelease, isAttachedToExistingHearing } from '../core/helpers';

/**
 * Every bookingId the pre-share gate must ask courtscheduler about.
 *
 * <p>This used to delegate wholesale to {@link getBookingReferencesToRelease} on the grounds that
 * the two predicates should never drift. They have to differ in exactly one respect, because the
 * two callers ask different questions:
 *
 * <ul>
 *   <li>the RELEASE path asks "is there a live hold behind this value?" - an attach-to-existing
 *       line that went through the pick journey does hold one, and it is surplus, so it is
 *       included there;</li>
 *   <li>this GATE asks "does this line need a live hold to be shareable?" - an attach line does
 *       not, since the hearing it points at is already listed. Checking it would let a hold that
 *       expired hours ago block a share that is perfectly valid.</li>
 * </ul>
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

export const getBookingReferencesToCheck = (draftResult: DraftResult): string[] =>
  (Object.values(draftResult?.resultLines || {}) as AnyDraftResultLine[])
    .filter(resultLine => !isAttachedToExistingHearing(resultLine))
    .filter(resultLine => !isSettledShare(resultLine))
    .map(getBookingReferenceToRelease)
    .filter((bookingReference): bookingReference is string => !!bookingReference);
