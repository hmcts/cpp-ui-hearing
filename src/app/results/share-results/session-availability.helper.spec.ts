import { DraftResult } from '../results.interfaces';
import { getBookingReferencesToCheck } from './session-availability.helper';

const buildDraftResult = (resultLines: Record<string, unknown>): DraftResult =>
  ({
    hearingId: 'hearingId',
    hearingDay: '2026-06-01',
    relations: [],
    shadowListedOffenceIds: [],
    resultLines
  } as unknown as DraftResult);

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

const crownLine = (resultLineId: string, prompts: unknown[]) => ({
  resultLineId,
  shortCode: 'nhccs',
  resultPrompts: prompts
});

describe('getBookingReferencesToCheck', () => {
  it('reads the bookingReference from an NHCCS line', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [bookingReferencePrompt('booking-1')])
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['booking-1']);
  });

  it('matches the NHCCS shortCode case-insensitively', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'NHCCS',
        resultPrompts: [bookingReferencePrompt('booking-1')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['booking-1']);
  });

  // Regression guard for related-hearings.container.ts: attaching to an already-listed
  // hearing writes a genuine courtScheduleId into bookingReference and books nothing, so
  // this line must be skipped - checking it against the booking-status endpoint would
  // return NONE and wrongly block the share.
  it('skips a line whose prompts include existingHearingId, even though it carries a bookingReference', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [
        bookingReferencePrompt('court-schedule-1'),
        existingHearingIdPrompt('existing-hearing-id')
      ])
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([]);
  });

  it('ignores result lines that are not a Crown Court next hearing, even if they carry a bookingReference', () => {
    // A magistrates NHMC line provisionally books the slot and stores its bookingId
    // in the same bookingReference prompt - it must NOT be re-validated.
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'nhmc',
        resultPrompts: [bookingReferencePrompt('provisional-booking-id')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([]);
  });

  it('validates every Crown court line separately, including repeated bookingReferences', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [bookingReferencePrompt('booking-1')]),
      'line-2': crownLine('line-2', [bookingReferencePrompt('booking-2')]),
      'line-3': crownLine('line-3', [bookingReferencePrompt('booking-1')])
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['booking-1', 'booking-2', 'booking-1']);
  });

  it('returns no bookingReferences when the Crown line has no bookingReference prompt', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [])
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([]);
  });

  it('handles an empty or missing draft result safely', () => {
    expect(getBookingReferencesToCheck(buildDraftResult({}))).toEqual([]);
    expect(getBookingReferencesToCheck(undefined as unknown as DraftResult)).toEqual([]);
  });
});
