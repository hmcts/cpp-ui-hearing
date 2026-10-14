import { DraftResult } from '../../../results.interfaces';
import {
  getBookingReferenceToRelease,
  getBookingReferencesToRelease,
  isUnconfirmedBooking,
  selectUnconfirmedBookingIds
} from '../provisional-booking';

const bookingReferencePrompt = (value: string) => ({
  type: 'HIDDEN',
  promptId: 'booking-prompt-id',
  promptRef: 'bookingReference',
  label: 'Booking reference',
  value
});

const existingHearingIdPrompt = (value: string) => ({
  type: 'HIDDEN',
  promptId: 'existing-hearing-prompt-id',
  promptRef: 'existingHearingId',
  label: 'Existing hearing id',
  value
});

const resultLine = (resultLineId: string, prompts: unknown[], sharedDate?: string) =>
  ({
    resultLineId,
    shortCode: 'NHCCS',
    resultPrompts: prompts,
    ...(sharedDate ? { sharedDate } : {})
  } as unknown as DraftResult['resultLines'][string]);

const buildDraftResult = (resultLines: Record<string, unknown>): DraftResult =>
  ({
    hearingId: 'hearingId',
    hearingDay: '2026-06-01',
    relations: [],
    shadowListedOffenceIds: [],
    resultLines
  } as unknown as DraftResult);

describe('getBookingReferenceToRelease', () => {
  it('reads the bookingReference from a result line', () => {
    expect(
      getBookingReferenceToRelease(resultLine('line-1', [bookingReferencePrompt('booking-1')]))
    ).toBe('booking-1');
  });

  it('returns undefined when there is no bookingReference prompt', () => {
    expect(getBookingReferenceToRelease(resultLine('line-1', []))).toBeUndefined();
  });

  // LPT-2599. This used to assert the opposite, on the stated grounds that
  // related-hearings.container.ts writes a courtScheduleId into bookingReference. It does not:
  // that container writes existingHearingId and no bookingReference at all, and the only two
  // writers of bookingReference - magistrates.container.ts and crown-scheduling.container.ts -
  // both write the bookingId that bookProvisionalHearingSlots returned, against a real hold.
  //
  // So a line carrying BOTH prompts was picked first and attached afterwards. Its hold is
  // surplus from that moment: nothing will list against it, and the hearing-keyed release
  // downstream cannot see it because a reservation carries no hearing_id. Skipping these lines
  // is how the reservation survived the share.
  it('releases the hold of a line that was picked and then attached to an existing hearing', () => {
    expect(
      getBookingReferenceToRelease(
        resultLine('line-1', [
          bookingReferencePrompt('booking-1'),
          existingHearingIdPrompt('existing-hearing-id')
        ])
      )
    ).toBe('booking-1');
  });

  // The one value that must never reach SlotsRemoveService.remove: it releases by hearing_id as
  // well as booking_id, so a real hearing id would unlist a live hearing. Nothing writes a
  // hearing id into bookingReference today - this is defence in depth, kept because the cost if
  // it ever happened is a vacated court hearing.
  it("never returns a value that is also the line's existing hearing id", () => {
    expect(
      getBookingReferenceToRelease(
        resultLine('line-1', [
          bookingReferencePrompt('same-id'),
          existingHearingIdPrompt('same-id')
        ])
      )
    ).toBeUndefined();
  });

  it('returns undefined for an undefined result line', () => {
    expect(getBookingReferenceToRelease(undefined)).toBeUndefined();
  });

  // A shared LINE does not imply a confirmed BOOKING: amending a shared line and re-picking a
  // session reuses the same bookingId, so the line keeps its sharedDate while pointing at a
  // fresh, unconfirmed hold. This function therefore yields a CANDIDATE and must not filter on
  // sharedDate - whether the booking may actually be released is settled by isUnconfirmedBooking
  // against courtscheduler's answer.
  it('still returns the bookingReference for a SHARED line - sharedDate describes the line, not the booking', () => {
    expect(
      getBookingReferenceToRelease(
        resultLine('line-1', [bookingReferencePrompt('booking-1')], '2026-09-21')
      )
    ).toBe('booking-1');
  });

  it('returns the bookingReference for a line that has not been shared', () => {
    expect(
      getBookingReferenceToRelease(
        resultLine('line-1', [bookingReferencePrompt('booking-1')], undefined)
      )
    ).toBe('booking-1');
  });
});

describe('getBookingReferencesToRelease', () => {
  it('collects the bookingReference from every eligible line in the draft result', () => {
    const draftResult = buildDraftResult({
      'line-1': resultLine('line-1', [bookingReferencePrompt('booking-1')]),
      'line-2': resultLine('line-2', [bookingReferencePrompt('booking-2')])
    });

    expect(getBookingReferencesToRelease(draftResult)).toEqual(['booking-1', 'booking-2']);
  });

  // An attached line's hold is included for the reason given above: it is surplus, and this
  // sweep is the only thing that will ever give it back. A line with no bookingReference at all
  // still contributes nothing - that is the case the old exclusion was written for, and it is
  // handled by the absence of the prompt rather than by inspecting existingHearingId.
  it('excludes lines with no bookingReference but keeps the hold of an attached line', () => {
    const draftResult = buildDraftResult({
      'line-1': resultLine('line-1', []),
      'line-2': resultLine('line-2', [
        bookingReferencePrompt('booking-2'),
        existingHearingIdPrompt('existing-hearing-id')
      ]),
      'line-3': resultLine('line-3', [bookingReferencePrompt('booking-3')])
    });

    expect(getBookingReferencesToRelease(draftResult)).toEqual(['booking-2', 'booking-3']);
  });

  // reset-results discards the whole draft and sweeps every hold it was carrying. Shared lines
  // are offered as candidates too - a re-pick during an amendment leaves a shared line holding an
  // unconfirmed booking. The sweep then asks courtscheduler and releases only the unconfirmed
  // ones; see selectUnconfirmedBookingIds.
  it('includes SHARED lines among the candidates when sweeping the whole draft result', () => {
    const draftResult = buildDraftResult({
      'line-1': resultLine('line-1', [bookingReferencePrompt('booking-1')], '2026-09-21'),
      'line-2': resultLine('line-2', [bookingReferencePrompt('booking-2')])
    });

    expect(getBookingReferencesToRelease(draftResult)).toEqual(['booking-1', 'booking-2']);
  });

  it('handles an empty or missing draft result safely', () => {
    expect(getBookingReferencesToRelease(buildDraftResult({}))).toEqual([]);
    expect(getBookingReferencesToRelease(undefined)).toEqual([]);
  });
});

describe('isUnconfirmedBooking', () => {
  it('is true only for a booking courtscheduler reports as RESERVED', () => {
    const bookings = [{ bookingId: 'booking-1', status: 'RESERVED' }];

    expect(isUnconfirmedBooking(bookings, 'booking-1')).toBe(true);
  });

  // SHARED is the confirmed listing a share created. Only another share may change it, so the
  // delete/amend path must leave it entirely alone.
  it('is false for a SHARED booking', () => {
    const bookings = [{ bookingId: 'booking-1', status: 'SHARED' }];

    expect(isUnconfirmedBooking(bookings, 'booking-1')).toBe(false);
  });

  // NOT_FOUND means the hold expired and was purged; UNKNOWN means the check never reached
  // courtscheduler. Neither is a hold this draft can give back.
  it.each(['NOT_FOUND', 'UNKNOWN'])('is false for %s', status => {
    expect(isUnconfirmedBooking([{ bookingId: 'booking-1', status }], 'booking-1')).toBe(false);
  });

  it('is false when the booking is absent from the response, or the response is empty', () => {
    expect(isUnconfirmedBooking([{ bookingId: 'other', status: 'RESERVED' }], 'booking-1')).toBe(
      false
    );
    expect(isUnconfirmedBooking([], 'booking-1')).toBe(false);
    expect(isUnconfirmedBooking(undefined, 'booking-1')).toBe(false);
  });
});

describe('selectUnconfirmedBookingIds', () => {
  it('keeps only the RESERVED candidates, preserving the order asked for', () => {
    const bookings = [
      { bookingId: 'booking-confirmed', status: 'SHARED' },
      { bookingId: 'booking-held', status: 'RESERVED' },
      { bookingId: 'booking-expired', status: 'NOT_FOUND' }
    ];

    expect(
      selectUnconfirmedBookingIds(bookings, [
        'booking-confirmed',
        'booking-held',
        'booking-expired'
      ])
    ).toEqual(['booking-held']);
  });

  it('returns nothing when the response is missing - the caller must then release nothing', () => {
    expect(selectUnconfirmedBookingIds(undefined, ['booking-1'])).toEqual([]);
  });
});
