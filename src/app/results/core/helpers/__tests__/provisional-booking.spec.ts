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

  // Regression guard for related-hearings.container.ts: attaching to an already-listed
  // hearing writes a genuine courtScheduleId into bookingReference and books nothing, so
  // releasing on that value would be meaningless at best.
  it('skips a line whose prompts include existingHearingId, even though it carries a bookingReference', () => {
    expect(
      getBookingReferenceToRelease(
        resultLine('line-1', [
          bookingReferencePrompt('court-schedule-1'),
          existingHearingIdPrompt('existing-hearing-id')
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

  it('excludes lines with no bookingReference and lines carrying existingHearingId', () => {
    const draftResult = buildDraftResult({
      'line-1': resultLine('line-1', []),
      'line-2': resultLine('line-2', [
        bookingReferencePrompt('court-schedule-1'),
        existingHearingIdPrompt('existing-hearing-id')
      ]),
      'line-3': resultLine('line-3', [bookingReferencePrompt('booking-3')])
    });

    expect(getBookingReferencesToRelease(draftResult)).toEqual(['booking-3']);
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

  // LEGACY predates reserve-a-slot and holds no reservation row; NONE already expired and was
  // purged. Neither has anything to give back.
  it.each(['LEGACY', 'NONE', 'UNKNOWN'])('is false for %s', status => {
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
      { bookingId: 'booking-expired', status: 'NONE' }
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
