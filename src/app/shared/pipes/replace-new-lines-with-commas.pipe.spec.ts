import { ReplaceNewLinesWithCommasPipe } from './replace-new-lines-with-commas.pipe';

describe('replaceNewLinesWithCommas', () => {
  const STRING_WITH_NO_NEW_LINES = 'a, b, c';
  const STRING_WITH_ONE_NEW_LINE = 'a, b\nc';
  const STRING_WITH_MULTIPLE_NEW_LINES = 'a\nb\nc';

  let pipe: ReplaceNewLinesWithCommasPipe;

  beforeEach(() => {
    pipe = new ReplaceNewLinesWithCommasPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('given that the string has no new lines to replace', () => {
    it('should return the string unchanged', () => {
      expect(pipe.transform(STRING_WITH_NO_NEW_LINES)).toEqual(STRING_WITH_NO_NEW_LINES);
    });
  });

  describe('given that the string has one line break to replace', () => {
    it('should return the string with line break replaced with new lines', () => {
      expect(pipe.transform(STRING_WITH_ONE_NEW_LINE)).toEqual(STRING_WITH_NO_NEW_LINES);
    });
  });

  describe('given that the string has one line break to replace', () => {
    it('should return the string with line break replaced with new lines', () => {
      expect(pipe.transform(STRING_WITH_MULTIPLE_NEW_LINES)).toEqual(STRING_WITH_NO_NEW_LINES);
    });
  });

  describe('given that the empty string is entered', () => {
    it('should return the empty string', () => {
      expect(pipe.transform('')).toEqual('');
    });
  });
});
