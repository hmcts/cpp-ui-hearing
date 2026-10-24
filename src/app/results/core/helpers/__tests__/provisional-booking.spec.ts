import { DraftResult } from '../../../results.interfaces';
import { getBookingReference } from '../provisional-booking';

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

describe('getBookingReference', () => {
  it('reads the bookingReference from a result line', () => {
    expect(getBookingReference(resultLine('line-1', [bookingReferencePrompt('booking-1')]))).toBe(
      'booking-1'
    );
  });

  it('returns undefined when there is no bookingReference prompt', () => {
    expect(getBookingReference(resultLine('line-1', []))).toBeUndefined();
  });

  it('returns undefined for an undefined result line', () => {
    expect(getBookingReference(undefined)).toBeUndefined();
  });

  // The pre-share gate leaves attached lines out before it asks; this only reads the prompt.
  it('reads the bookingReference of a line that was picked and then attached to an existing hearing', () => {
    expect(
      getBookingReference(
        resultLine('line-1', [
          bookingReferencePrompt('booking-1'),
          existingHearingIdPrompt('existing-hearing-id')
        ])
      )
    ).toBe('booking-1');
  });

  // sharedDate describes the LINE, not the booking: an amended line can point at a fresh hold.
  it('reads the bookingReference of a SHARED line too', () => {
    expect(
      getBookingReference(resultLine('line-1', [bookingReferencePrompt('booking-1')], '2026-09-21'))
    ).toBe('booking-1');
  });
});
