import { getMinutesFromDurationValue } from './duration';

describe('getMinutesFromDurationValue', () => {
  it('returns the value unchanged when expressed in minutes', () => {
    expect(getMinutesFromDurationValue([{ label: 'MINUTES', value: 30 }])).toBe(30);
  });

  it('converts hours into minutes', () => {
    expect(getMinutesFromDurationValue([{ label: 'HOURS', value: 2 }])).toBe(120);
  });

  it('converts days into sitting-day minutes', () => {
    expect(getMinutesFromDurationValue([{ label: 'DAYS', value: 1 }])).toBe(360);
  });

  it('converts weeks into sitting-day minutes', () => {
    expect(getMinutesFromDurationValue([{ label: 'WEEKS', value: 1 }])).toBe(2520);
  });

  it('uses only the first value/unit pair', () => {
    expect(
      getMinutesFromDurationValue([
        { label: 'HOURS', value: 1 },
        { label: 'MINUTES', value: 30 }
      ])
    ).toBe(60);
  });
});
