import { DefendantAnswerPipe } from '../defendant-answer.pipe';

describe('DefendantAnswerPipe', () => {
  const pipe = new DefendantAnswerPipe();

  it('should return empty if the value is not set', () => {
    expect(pipe.transform()).toEqual('–');
    expect(pipe.transform(null)).toEqual('–');
  });

  it('should return `Yes` if the value is `true`', () => {
    expect(pipe.transform(true)).toEqual('Yes');
  });

  it('should return `No` if the value is `false`', () => {
    expect(pipe.transform(false)).toEqual('No');
  });
});
