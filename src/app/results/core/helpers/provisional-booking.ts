import { AnyDraftResultLine, DraftResult, ResolvedDraftResultLine } from '../../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';
// On an attach-to-existing-hearing line, related-hearings.container.ts puts a courtScheduleId in
// bookingReference, not a bookingId - nothing was booked, so there is nothing to release.
const EXISTING_HEARING_PROMPT_REF = 'existingHearingId';

/** A hold that still holds capacity and has not been confirmed by a share. */
export const RESERVED_BOOKING_STATUS = 'RESERVED';

/** A booking a share has confirmed: a real listing now (`expires_at IS NULL`), not a hold. */
export const SHARED_BOOKING_STATUS = 'SHARED';

/**
 * The bookingId of the slot hold a result line is carrying, if any.
 *
 * <p>A CANDIDATE, not a decision: whether the hold may be released depends on whether a share has
 * confirmed it, and nothing local can tell you. A re-pick on an unconfirmed booking reuses the id,
 * so the prompt is byte-identical either way, and `sharedDate` describes the LINE, not the
 * BOOKING. Ask courtscheduler via {@link isUnconfirmedBooking}.
 */
export const getBookingReferenceToRelease = (
  resultLine: AnyDraftResultLine | undefined
): string | undefined => {
  const prompts = (resultLine as ResolvedDraftResultLine | undefined)?.resultPrompts || [];

  if (prompts.some(prompt => prompt.promptRef === EXISTING_HEARING_PROMPT_REF)) {
    return undefined;
  }

  return prompts.find(prompt => prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF)?.value as
    | string
    | undefined;
};

/** Every hold across a draft result, for the reset-results sweep that discards the whole draft. */
export const getBookingReferencesToRelease = (draftResult: DraftResult | undefined): string[] =>
  (Object.values(draftResult?.resultLines || {}) as AnyDraftResultLine[])
    .map(getBookingReferenceToRelease)
    .filter((bookingReference): bookingReference is string => !!bookingReference);

const hasStatus = (
  bookings: { bookingId: string; status: string }[] | undefined,
  bookingId: string,
  status: string
): boolean =>
  (bookings || []).some(booking => booking.bookingId === bookingId && booking.status === status);

/**
 * Whether a booking may be released now.
 *
 * <p>A confirmed (shared) booking may only be changed by another share, so abandoning its line
 * releases nothing. An unconfirmed one is released as soon as the clerk abandons it. Re-picking
 * needs no call: courtscheduler releases the old hold itself when the id is reused.
 */
export const isUnconfirmedBooking = (
  bookings: { bookingId: string; status: string }[] | undefined,
  bookingId: string
): boolean => hasStatus(bookings, bookingId, RESERVED_BOOKING_STATUS);

/** Batch form of {@link isUnconfirmedBooking}, for the reset-results sweep. */
export const selectUnconfirmedBookingIds = (
  bookings: { bookingId: string; status: string }[] | undefined,
  candidates: string[]
): string[] => candidates.filter(bookingId => isUnconfirmedBooking(bookings, bookingId));

/**
 * Whether a bookingId has already been confirmed by a share, and so must NOT be resent as the
 * `bookingId` of a new reservation - courtscheduler's guardAgainstConfirmedAllocation refuses
 * that, which is what used to break "amend a shared result and pick a different session".
 * The picker omits the id instead and courtscheduler mints a fresh one; the old listing is
 * reconciled by the amended share, which releases by hearing_id rather than bookingId.
 */
export const isSharedBooking = (
  bookings: { bookingId: string; status: string }[] | undefined,
  bookingId: string
): boolean => hasStatus(bookings, bookingId, SHARED_BOOKING_STATUS);
