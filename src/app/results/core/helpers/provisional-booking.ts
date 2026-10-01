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
 * <p>This returns a CANDIDATE, not a decision. Whether the hold may actually be released depends
 * on whether that booking has been confirmed by a share, and the answer is not derivable here:
 * a re-pick on a still-unconfirmed booking REUSES the existing bookingId (the picker sends it as
 * `bookingId` and writes the same value straight back), so the prompt is byte-identical whether
 * the booking is still held or was just re-picked. `sharedDate` cannot settle it either - it
 * describes the LINE, not the BOOKING. Callers must ask courtscheduler via
 * {@link isUnconfirmedBooking}; see that function for the rule being enforced.
 *
 * @param resultLine the result line to inspect - an unresolved line has no prompts yet,
 * and so trivially has nothing to release
 * @returns the bookingId that MAY be releasable, or undefined if the line holds nothing
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

/**
 * courtscheduler's verdict for a booking that still holds capacity and has NOT been confirmed by
 * a share. Its other verdicts all mean "do not release": SHARED is a confirmed listing, LEGACY is
 * a draft saved before reserve-a-slot shipped (it holds no reservation row), and NONE means the
 * hold already expired and was purged.
 */
export const RESERVED_BOOKING_STATUS = 'RESERVED';

/**
 * Decides whether a booking may be released right now, per the two rules that govern a hold:
 *
 * <ol>
 *   <li>A CONFIRMED (shared) booking may only be changed by another share. Deleting or amending
 *       its result line does nothing at the time - the subsequent share applies the change. So
 *       nothing is released here.</li>
 *   <li>An UNCONFIRMED booking is released as soon as the clerk abandons it - the delete button
 *       on a booked slot, or the whole draft being discarded. (Choosing a new set of slots also
 *       wipes the old unconfirmed hold, but courtscheduler does that itself: the re-pick reuses
 *       the bookingId and its pipeline opens with a hearing-wide release, so the UI issues no
 *       separate call for that case.)</li>
 * </ol>
 *
 * <p>Only courtscheduler can tell the two apart. A re-pick during an amendment does NOT reuse the
 * shared bookingId - courtscheduler refuses to reserve over a confirmed allocation
 * (ConfirmedBookingExistsException), so {@link isSharedBooking} makes the picker mint a fresh one
 * instead. The amended line therefore carries the NEW id, whose status is RESERVED and which is
 * released normally if abandoned; the old confirmed listing is no longer referenced by the draft
 * and is reconciled at share time, which releases by hearing_id rather than by bookingId.
 *
 * @param bookings the `bookings` array from listing's bookingStatus response
 * @param bookingId the booking being considered for release
 * @returns true only when courtscheduler reports an unconfirmed hold for that id
 */
export const isUnconfirmedBooking = (
  bookings: { bookingId: string; status: string }[] | undefined,
  bookingId: string
): boolean =>
  (bookings || []).some(
    booking => booking.bookingId === bookingId && booking.status === RESERVED_BOOKING_STATUS
  );

/**
 * Batch form of {@link isUnconfirmedBooking}, for the reset-results sweep.
 *
 * @param bookings the `bookings` array from listing's bookingStatus response
 * @param candidates the bookingIds the draft result was carrying
 * @returns only those candidates courtscheduler reports as unconfirmed holds
 */
export const selectUnconfirmedBookingIds = (
  bookings: { bookingId: string; status: string }[] | undefined,
  candidates: string[]
): string[] => candidates.filter(bookingId => isUnconfirmedBooking(bookings, bookingId));

/**
 * courtscheduler's verdict for a booking that has been confirmed by a share - it is a real
 * listing now (`expires_at IS NULL`), not a hold.
 */
export const SHARED_BOOKING_STATUS = 'SHARED';

/**
 * Whether a bookingId has already been confirmed by a share, and so must NOT be sent back as the
 * `bookingId` of a new reservation.
 *
 * <p>courtscheduler's {@code ReservationService.guardAgainstConfirmedAllocation} refuses to
 * reserve against an id that already carries a confirmed allocation. That guard is right - the
 * confirmed listing must not be disturbed by a hold - but the picker used to resend the shared id
 * regardless, which is what made "amend a shared result and pick a different session" fail. The
 * clerk saw "this session is fully booked" about a session that was free.
 *
 * <p>When this returns true the picker omits `bookingId` entirely and courtscheduler mints a new
 * one. The old confirmed listing is left exactly as it was: it is released and replaced by the
 * amended share itself, which reconciles via {@code releaseOldAllocatedListings(hearingId)} -
 * keyed on hearing_id, never on bookingId, so changing the reference cannot strand it.
 *
 * @param bookings the `bookings` array from listing's bookingStatus response
 * @param bookingId the booking the result line is currently carrying
 * @returns true only when courtscheduler reports that id as already shared
 */
export const isSharedBooking = (
  bookings: { bookingId: string; status: string }[] | undefined,
  bookingId: string
): boolean =>
  (bookings || []).some(
    booking => booking.bookingId === bookingId && booking.status === SHARED_BOOKING_STATUS
  );
