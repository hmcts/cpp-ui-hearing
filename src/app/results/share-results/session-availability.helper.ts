import { DraftResult } from '../results.interfaces';
import { getBookingReferencesToRelease } from '../core/helpers';

/**
 * Every bookingId the draft result is carrying, so the pre-share gate can ask
 * courtscheduler whether each hold is still there.
 *
 * <p>Delegates to {@link getBookingReferencesToRelease} because the two questions have the
 * same answer: a line holds a booking iff it carries a `bookingReference` prompt and is not
 * an attach-to-existing-hearing line. Sharing one predicate is the point of this file now.
 *
 * <p>It previously kept its own copy, gated on an allowlist of short codes
 * (`['NHCCS']`, later `['NHCCS', 'NHMC']`). That was the defect behind two STE02
 * reproductions: NHMC was missing from the list, so a magistrates-only draft produced [],
 * the gate short-circuited before calling listing at all, and a clerk shared into a hold
 * that had already been purged. An allowlist fails SILENTLY - a missing entry is
 * indistinguishable from "nothing to check" - while the release path, which never used
 * one, never had the bug.
 *
 * <p>The allowlist was also redundant. Only the two pickers write a `bookingReference`
 * (crown-scheduling.container.ts and magistrates.container.ts), and the only other writer,
 * related-hearings.container.ts, puts a courtScheduleId there and always sets
 * `existingHearingId` alongside - which both helpers already exclude. So the prompt can
 * only ever land on the very lines the list named.
 *
 * <p>Keeping the name: the gate asks a different question of the same set, and a future
 * result type that books a session is now covered here automatically rather than needing
 * to be remembered.
 *
 * @param draftResult the draft about to be shared
 * @returns the bookingIds to check, in result-line order
 */
export const getBookingReferencesToCheck = (draftResult: DraftResult): string[] =>
  getBookingReferencesToRelease(draftResult);
