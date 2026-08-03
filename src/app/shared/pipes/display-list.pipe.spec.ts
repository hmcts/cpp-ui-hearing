import { DisplayListPipe } from './display-list.pipe';

describe('DisplayListPipe', () => {
  let pipe: DisplayListPipe;

  beforeAll(() => (pipe = new DisplayListPipe()));

  it('returns an empty string when no list is provided', () => {
    expect(pipe.transform()).toEqual('');
  });

  it('returns the entry when the list contains a single entry', () => {
    expect(pipe.transform(['Single'])).toEqual('Single');
  });

  it(`returns entries joined with an 'and' when the list contains two entries`, () => {
    expect(pipe.transform(['One', 'Two'])).toEqual('One and Two');
  });

  it(`returns entries joined with commas and an 'and' when the list contains more than two entries`, () => {
    expect(pipe.transform(['One', 'Two', 'Three'])).toEqual('One, Two and Three');
  });

  it(`returns entries joined with a custom 'and' string, if provided`, () => {
    expect(pipe.transform(['Eins', 'Zwei', 'Drei'], 'und')).toEqual('Eins, Zwei und Drei');
  });
});
