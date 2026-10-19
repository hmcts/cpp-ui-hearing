import { DraftResult, SharedResult } from '../results.interfaces';
import {
  getBookingReferencesToCheck,
  getSharedBookingReferences
} from './session-availability.helper';

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

// What get-share-result-v2 returns: one entry per shared line, prompts serialised to strings.
const sharedResult = (lines: { resultLineId: string; prompts?: unknown[] }[]): SharedResult =>
  ({ version: 1, resultLines: lines } as unknown as SharedResult);

const sharedPrompt = (promptRef: string, value: string) => ({
  id: `${promptRef}-id`,
  promptRef,
  label: promptRef,
  value
});

const amendmentReason = { id: 'a02018a1-0000-0000-0000-000000000000', description: 'Slip rule' };

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

  /**
   * LPT-2599. A line the share has already settled must not be checked: its booking is either a
   * confirmed listing or a reservation the share deliberately released, and courtscheduler
   * answers NOT_FOUND for the released one exactly as it does for a purged hold. Checking it
   * blocked every later share on the hearing, silently.
   *
   * Values here are the ones captured from the STE02 reproduction.
   */
  it('skips a line that was shared and not touched since', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'NHMC',
        sharedDate: '2026-10-14T20:23:10.743Z',
        resultPrompts: [bookingReferencePrompt('6858a3bb')]
      },
      'line-2': {
        resultLineId: 'line-2',
        shortCode: 'NHMC',
        resultPrompts: [bookingReferencePrompt('36f0fd7b')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['36f0fd7b']);
  });

  /**
   * The other half of the rule, and the reason it is not simply "skip anything shared":
   * amending a shared line and re-picking leaves the original sharedDate in place but gives the
   * line a FRESH unconfirmed booking. That booking must still be checked - if it expired, the
   * share would list against nothing. amendmentReason is what the amend flow sets.
   */
  it('still checks a shared line that has since been amended', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'NHMC',
        sharedDate: '2026-10-14T23:42:21.797Z',
        amendmentReason,
        resultPrompts: [bookingReferencePrompt('b9e27f06')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual(['b9e27f06']);
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

  // LPT-2600, taken from the real draft on STE02 (hearing faef00c5, 2026-10-16 11:07-11:09 UTC).
  //
  // Sequence: four lines are shared at 11:07:34, so all four get a sharedDate. One second later
  // the share's own merge releases 62984736 - two next hearings resolved to the session 706ccfdf
  // won, and courtscheduler DELETEs the loser. An amendment (a02018a1) is then started which
  // marks that released line, and a NEW line is added under the same amendment carrying a fresh
  // hold (88f2f534, no sharedDate).
  //
  // 62984736 now has BOTH a sharedDate and an amendmentReason, so isSettledShare excludes it
  // from "settled" and the gate keeps asking courtscheduler about a booking that no longer
  // exists. It answered NOT_FOUND to eleven such calls over four hours, and every share on that
  // hearing was silently refused - "The session you reserved has expired and been released".
  //
  // Only 88f2f534 is a live hold the next share depends on. 62984736 went out in the 11:07:34
  // share, so progression resolved and recorded it then, and reads it from that record on every
  // later share without asking courtscheduler. It must not be checked: courtscheduler can only
  // ever answer NOT_FOUND for it now, so checking it refuses the share forever.
  it('does not check a released bookingReference on a line that was shared and then amended', () => {
    const draftResult = buildDraftResult({
      'merged-away-then-amended': {
        resultLineId: 'merged-away-then-amended',
        shortCode: 'NHMC',
        sharedDate: '2026-10-16T11:07:34.007Z',
        amendmentReason,
        resultPrompts: [bookingReferencePrompt('62984736-2c07-4465-8626-6b570d7af630')]
      },
      'listed-by-the-merge': {
        resultLineId: 'listed-by-the-merge',
        shortCode: 'NHMC',
        sharedDate: '2026-10-16T11:07:34.007Z',
        resultPrompts: [bookingReferencePrompt('706ccfdf-90f1-432e-b1d4-b1bfb04a2d29')]
      },
      'added-under-the-amendment': {
        resultLineId: 'added-under-the-amendment',
        shortCode: 'NHMC',
        amendmentReason,
        resultPrompts: [bookingReferencePrompt('88f2f534-b5ae-4c17-94fe-8e734590c0eb')]
      }
    });

    const lastShare = sharedResult([
      {
        resultLineId: 'merged-away-then-amended',
        prompts: [sharedPrompt('bookingReference', '62984736-2c07-4465-8626-6b570d7af630')]
      },
      {
        resultLineId: 'listed-by-the-merge',
        prompts: [sharedPrompt('bookingReference', '706ccfdf-90f1-432e-b1d4-b1bfb04a2d29')]
      }
    ]);

    expect(getBookingReferencesToCheck(draftResult, getSharedBookingReferences(lastShare))).toEqual(
      ['88f2f534-b5ae-4c17-94fe-8e734590c0eb']
    );
  });

  // When the last share cannot be fetched (or a legacy hearing has no shared lines) the set is
  // empty and the gate must behave exactly as it did before the set existed.
  it('without a last share, checks exactly what it checked before', () => {
    const draftResult = buildDraftResult({
      'merged-away-then-amended': {
        resultLineId: 'merged-away-then-amended',
        shortCode: 'NHMC',
        sharedDate: '2026-10-16T11:07:34.007Z',
        amendmentReason,
        resultPrompts: [bookingReferencePrompt('62984736-2c07-4465-8626-6b570d7af630')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult)).toEqual([
      '62984736-2c07-4465-8626-6b570d7af630'
    ]);
    expect(getBookingReferencesToCheck(draftResult, new Set())).toEqual([
      '62984736-2c07-4465-8626-6b570d7af630'
    ]);
  });

  // The case the amendmentReason clause exists for, now decided by the reference: amending and
  // re-picking leaves the original sharedDate on the line but gives it a reference the last
  // share never carried, so it is still checked.
  it('still checks an amended, re-picked line whose new reference was never shared', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'NHMC',
        sharedDate: '2026-10-14T23:42:21.797Z',
        amendmentReason,
        resultPrompts: [bookingReferencePrompt('re-picked-booking')]
      }
    });
    const lastShare = sharedResult([
      { resultLineId: 'line-1', prompts: [sharedPrompt('bookingReference', 'originally-shared')] }
    ]);

    expect(getBookingReferencesToCheck(draftResult, getSharedBookingReferences(lastShare))).toEqual(
      ['re-picked-booking']
    );
  });

  it('does not check a reference the last share carried, whichever line it now sits on', () => {
    const draftResult = buildDraftResult({
      'new-line': {
        resultLineId: 'new-line',
        shortCode: 'NHMC',
        resultPrompts: [bookingReferencePrompt('already-shared')]
      }
    });

    expect(getBookingReferencesToCheck(draftResult, new Set(['already-shared']))).toEqual([]);
  });

  it('handles an empty or missing draft result safely', () => {
    expect(getBookingReferencesToCheck(buildDraftResult({}))).toEqual([]);
    expect(getBookingReferencesToCheck(undefined as unknown as DraftResult)).toEqual([]);
  });
});

describe('getSharedBookingReferences', () => {
  it('collects the bookingReference value of every shared line', () => {
    const lastShare = sharedResult([
      { resultLineId: 'line-1', prompts: [sharedPrompt('bookingReference', 'booking-1')] },
      {
        resultLineId: 'line-2',
        prompts: [
          sharedPrompt('HDATE', '2026-10-20'),
          sharedPrompt('bookingReference', 'booking-2')
        ]
      }
    ]);

    expect(getSharedBookingReferences(lastShare)).toEqual(new Set(['booking-1', 'booking-2']));
  });

  it('ignores other prompts and empty values', () => {
    const lastShare = sharedResult([
      { resultLineId: 'line-1', prompts: [sharedPrompt('existingHearingId', 'hearing-1')] },
      { resultLineId: 'line-2', prompts: [sharedPrompt('bookingReference', '')] },
      { resultLineId: 'line-3' }
    ]);

    expect(getSharedBookingReferences(lastShare)).toEqual(new Set());
  });

  it('handles a missing shared result or one with no lines', () => {
    expect(getSharedBookingReferences(undefined)).toEqual(new Set());
    expect(getSharedBookingReferences(sharedResult([]))).toEqual(new Set());
  });
});
