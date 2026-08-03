import { CapitalizePipe } from './capitalize.pipe';

describe('CapitalizePipe', () => {
  let pipe: CapitalizePipe;

  beforeAll(() => {
    pipe = new CapitalizePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns capitalize string from whatever string', () => {
    expect(pipe.transform('myWord')).toBe('MyWord');
    expect(pipe.transform('myWord', false)).toBe('Myword');
    expect(pipe.transform('MyWord')).toBe('MyWord');
    expect(pipe.transform('MyWord', false)).toBe('Myword');
  });
});
