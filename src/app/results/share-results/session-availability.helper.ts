import { DraftResult } from '../results.interfaces';
import { getBookingReferencesToRelease } from '../core/helpers';

/**
 * Every bookingId the draft result is carrying, so the pre-share gate can ask courtscheduler
 * whether each hold is still there.
 *
 * <p>Deliberately the same predicate as {@link getBookingReferencesToRelease}: a line holds a
 * booking iff it carries a `bookingReference` prompt and is not an attach-to-existing-hearing
 * line. This used to keep its own copy gated on an allowlist of result short codes, which
 * silently returned [] for the codes nobody remembered to add - the gate then skipped the call
 * entirely and a clerk shared into a purged hold. Do not reintroduce one.
 *
 * @param draftResult the draft about to be shared
 * @returns the bookingIds to check, in result-line order
 */
export const getBookingReferencesToCheck = (draftResult: DraftResult): string[] =>
  getBookingReferencesToRelease(draftResult);
