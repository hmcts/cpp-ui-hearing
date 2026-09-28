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

  // This assertion was INVERTED, having previously demanded that a magistrates line
  // be ignored. Its stated reason - the booking "must NOT be re-validated" - belonged
  // to validateSessionAvailability, the capacity check this gate replaced, which could
  // refuse a legitimate share by counting the hearing's own booking against maxSlots.
  // The booking-status gate asks "is this hold still live?" and has no such problem.
  //
  // While the exclusion stood, a magistrates-only draft produced [], so
  // validateSessionAvailabilityAndShare short-circuited on
  // `bookingReferences.length === 0` and never called listing - no request, no banner,
  // share proceeds. Reproduced on STE02: the reservation row for booking 751930c9 was
  // deleted and the NHMC result shared anyway. The old test passed throughout.
  it('reads the bookingReference from an NHMC line', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'nhmc',
        resultPrompts: [bookingReferencePrompt('mags-booking-id')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['mags-booking-id']);
  });

  it('collects from both when a draft carries a Crown and a magistrates next hearing', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [bookingReferencePrompt('crown-1')]),
      'line-2': {
        resultLineId: 'line-2',
        shortCode: 'NHMC',
        resultPrompts: [bookingReferencePrompt('mags-1')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['crown-1', 'mags-1']);
  });

  // Short code is no longer consulted: carrying a bookingReference IS what makes a line
  // hold a booking, which is the rule the release path has always used. This assertion was
  // inverted along with the allowlist it guarded.
  //
  // The set is unchanged in practice - only the two pickers write the prompt, and
  // related-hearings writes a courtScheduleId with existingHearingId alongside, which is
  // still excluded - so no real line reaches this branch. It is asserted anyway because it
  // is the difference between the two rules, and because checking an unexpected reference
  // is the safe direction: the worst case is one extra lookup that answers NONE, against
  // an allowlist's worst case of sharing into a purged hold.
  it('checks any line carrying a bookingReference, whatever its short code', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'adjourn',
        resultPrompts: [bookingReferencePrompt('carried-anyway')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['carried-anyway']);
  });

  // A magistrates line attached to an already-listed hearing carries a courtScheduleId,
  // not a bookingId - the same trap as the Crown case above, now reachable via NHMC too.
  it('skips an NHMC line attached to an already-listed hearing', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'NHMC',
        resultPrompts: [
          bookingReferencePrompt('court-schedule-1'),
          existingHearingIdPrompt('existing-hearing-id')
        ]
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

    expect(getBookingReferencesToCheck(draftResult)).toEqual([
      'booking-1',
      'booking-2',
      'booking-1'
    ]);
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
