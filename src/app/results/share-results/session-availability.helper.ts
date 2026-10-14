import { AnyDraftResultLine, DraftResult } from '../results.interfaces';
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
export const getBookingReferencesToCheck = (draftResult: DraftResult): string[] =>
  (Object.values(draftResult?.resultLines || {}) as AnyDraftResultLine[])
    .filter(resultLine => !isAttachedToExistingHearing(resultLine))
    .map(getBookingReferenceToRelease)
    .filter((bookingReference): bookingReference is string => !!bookingReference);
