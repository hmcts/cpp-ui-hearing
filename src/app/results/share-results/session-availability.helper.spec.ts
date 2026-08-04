import { DraftResult } from '../results.interfaces';
import { getSessionAvailabilityValidationData } from './session-availability.helper';

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

const durationPrompt = (value: unknown) => ({
  type: 'DURATION',
  promptId: 'duration-prompt-id',
  promptRef: 'HEST',
  label: 'Estimated duration',
  value
});

const crownLine = (resultLineId: string, prompts: unknown[]) => ({
  resultLineId,
  shortCode: 'nhccs',
  resultPrompts: prompts
});

describe('getSessionAvailabilityValidationData', () => {
  it('reads the courtScheduleId from the bookingReference prompt and the duration from the DURATION prompt', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [
        bookingReferencePrompt('court-schedule-1'),
        durationPrompt([{ label: 'MINUTES', value: 30 }])
      ])
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([
      { courtScheduleId: 'court-schedule-1', duration: 30 }
    ]);
  });

  it('matches the NHCCS shortCode case-insensitively', () => {
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'NHCCS',
        resultPrompts: [
          bookingReferencePrompt('court-schedule-1'),
          durationPrompt([{ label: 'MINUTES', value: 30 }])
        ]
      }
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([
      { courtScheduleId: 'court-schedule-1', duration: 30 }
    ]);
  });

  it('converts DURATION prompts expressed in hours into minutes', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [
        bookingReferencePrompt('court-schedule-1'),
        durationPrompt([{ label: 'HOURS', value: 1 }])
      ])
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([
      { courtScheduleId: 'court-schedule-1', duration: 60 }
    ]);
  });

  it('deserializes a DURATION prompt held as a serialized string', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [
        bookingReferencePrompt('court-schedule-1'),
        durationPrompt('1 HOURS')
      ])
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([
      { courtScheduleId: 'court-schedule-1', duration: 60 }
    ]);
  });

  it('validates every Crown court line separately, including repeated courtScheduleIds, each with its own duration', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [
        bookingReferencePrompt('court-schedule-1'),
        durationPrompt([{ label: 'MINUTES', value: 20 }])
      ]),
      'line-2': crownLine('line-2', [
        bookingReferencePrompt('court-schedule-2'),
        durationPrompt([{ label: 'MINUTES', value: 45 }])
      ]),
      'line-3': crownLine('line-3', [
        bookingReferencePrompt('court-schedule-1'),
        durationPrompt([{ label: 'MINUTES', value: 15 }])
      ])
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([
      { courtScheduleId: 'court-schedule-1', duration: 20 },
      { courtScheduleId: 'court-schedule-2', duration: 45 },
      { courtScheduleId: 'court-schedule-1', duration: 15 }
    ]);
  });

  it('ignores result lines that are not a Crown Court next hearing, even if they carry a bookingReference', () => {
    // A magistrates NHMC line provisionally books the slot and stores its bookingId
    // in the same bookingReference prompt - it must NOT be re-validated.
    const draftResult = buildDraftResult({
      'line-1': {
        resultLineId: 'line-1',
        shortCode: 'nhmc',
        resultPrompts: [
          bookingReferencePrompt('provisional-booking-id'),
          durationPrompt([{ label: 'MINUTES', value: 30 }])
        ]
      }
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([]);
  });

  it('returns no courtScheduleIds when the Crown line has no bookingReference prompt', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [durationPrompt([{ label: 'MINUTES', value: 30 }])])
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([]);
  });

  it('returns an undefined duration when the booked line has no DURATION prompt', () => {
    const draftResult = buildDraftResult({
      'line-1': crownLine('line-1', [bookingReferencePrompt('court-schedule-1')])
    });

    expect(getSessionAvailabilityValidationData(draftResult)).toEqual([
      { courtScheduleId: 'court-schedule-1', duration: undefined }
    ]);
  });

  it('handles an empty or missing draft result safely', () => {
    expect(getSessionAvailabilityValidationData(buildDraftResult({}))).toEqual([]);
    expect(getSessionAvailabilityValidationData(undefined as unknown as DraftResult)).toEqual([]);
  });
});
