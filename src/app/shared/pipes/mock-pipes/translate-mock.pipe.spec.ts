import { TranslateMockPipe } from './translate-mock.pipe';

describe('TranslateMockPipe', () => {
  let pipe: TranslateMockPipe;

  beforeEach(() => {
    pipe = new TranslateMockPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the same value passed to it', () => {
    const testValue = 'COMMON.TEST_KEY';
    expect(pipe.transform(testValue)).toBe(testValue);
  });

  it('should handle empty strings', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should handle complex translation keys', () => {
    const complexKey = 'MODULE.SECTION.NESTED.KEY';
    expect(pipe.transform(complexKey)).toBe(complexKey);
  });
});
