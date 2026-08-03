import { magistratesHearingReducer, MagistratesHearingState } from './magistrates-hearing.reducer';
import { hearingSummaryMock } from '../mock-data/test-mock-data';
import { LoadMagistratesHearingListSuccessAction } from './magistrates-hearing.action';

describe('hearingReducer', () => {
  const state: MagistratesHearingState = {
    summaries: null
  };

  it('should add the hearing summaries to the store', () => {
    const actual = magistratesHearingReducer(
      state,
      new LoadMagistratesHearingListSuccessAction(hearingSummaryMock)
    );
    expect(actual).toMatchSnapshot();
  });
});
