import { DraftResult } from '../../../results.interfaces';
import { getBookingReferenceToRelease, getBookingReferencesToRelease } from '../provisional-booking';

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

const resultLine = (resultLineId: string, prompts: unknown[]) =>
  ({
    resultLineId,
    shortCode: 'NHCCS',
    resultPrompts: prompts
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

  it('handles an empty or missing draft result safely', () => {
    expect(getBookingReferencesToRelease(buildDraftResult({}))).toEqual([]);
    expect(getBookingReferencesToRelease(undefined)).toEqual([]);
  });
});
