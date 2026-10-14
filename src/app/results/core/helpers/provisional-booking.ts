import { AnyDraftResultLine, DraftResult, ResolvedDraftResultLine } from '../../results.interfaces';

const BOOKING_REFERENCE_PROMPT_REF = 'bookingReference';
// An attach-to-existing-hearing line points at a hearing that is ALREADY listed, and
// related-hearings.container.ts writes ONLY this prompt - no bookingReference. The two places
// that write a bookingReference (magistrates.container.ts, crown-scheduling.container.ts) both
// write the bookingId that bookProvisionalHearingSlots returned, against a real reservation.
//
// So a line carrying BOTH prompts went through the pick journey, took a real hold, and was only
// afterwards attached to an existing hearing. Its hold is surplus the moment that happens:
// nothing will ever list against it, and - because a reservation carries no hearing_id - the
// hearing-keyed release downstream cannot see it either. It must be released here or it holds a
// slot until the overnight purge. LPT-2599.
const EXISTING_HEARING_PROMPT_REF = 'existingHearingId';

/** A hold that still holds capacity and has not been confirmed by a share. */
export const RESERVED_BOOKING_STATUS = 'RESERVED';

/** A booking a share has confirmed: a real listing now (`expires_at IS NULL`), not a hold. */
export const SHARED_BOOKING_STATUS = 'SHARED';

/**
 * No row under this bookingId in either shape: the hold expired and was purged, so there is
 * nothing left to share against and the clerk must re-pick. The only status for which
 * courtscheduler reports `safeToShare: false`.
 */
export const NOT_FOUND_BOOKING_STATUS = 'NOT_FOUND';

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

  const bookingReference = prompts.find(
    prompt => prompt.promptRef === BOOKING_REFERENCE_PROMPT_REF
  )?.value as string | undefined;

  if (!bookingReference) {
    return undefined;
  }

  // The one value that must never reach SlotsRemoveService.remove: it releases by hearing_id as
  // well as booking_id, so a real hearing id would unlist a live hearing. Nothing writes a
  // hearing id into bookingReference today, so this is defence in depth rather than a case we
  // have seen - but the blast radius if it ever happened is a vacated court hearing, so the
  // check stays. Excluding the whole LINE was the previous guard and went far too wide: it
  // skipped every attach line, including the ones holding a genuine reservation.
  const existingHearingId = prompts.find(
    prompt => prompt.promptRef === EXISTING_HEARING_PROMPT_REF
  )?.value as string | undefined;

  return bookingReference === existingHearingId ? undefined : bookingReference;
};

/**
 * Whether the line has been attached to an already-listed hearing.
 *
 * <p>Such a line needs no hold of its own to be shareable - the hearing it points at exists
 * already - so the pre-share gate must not fail it over a missing one. The release path makes the
 * opposite call and deliberately includes these lines; see
 * {@link getBookingReferenceToRelease}.
 */
export const isAttachedToExistingHearing = (resultLine: AnyDraftResultLine | undefined): boolean =>
  ((resultLine as ResolvedDraftResultLine | undefined)?.resultPrompts || []).some(
    prompt => prompt.promptRef === EXISTING_HEARING_PROMPT_REF
  );

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
