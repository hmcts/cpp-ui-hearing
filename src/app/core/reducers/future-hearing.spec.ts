import { futureHearingsReducer, initialState } from './future-hearings';
import * as FutureHearingsActions from '../actions/future-hearings';
import { mockSummary } from '../../mock-data/test-mock-data';

describe('Future hearing reducer', () => {
  it('should store hearing summaries', () => {
    const action = new FutureHearingsActions.FutureHearingsLoaded([mockSummary]);
    const actual = futureHearingsReducer(initialState, action);
    expect(actual).toMatchSnapshot();
  });

  it('should store success', () => {
    const action = new FutureHearingsActions.RemoveFutureHearingsSuccess();
    const actual = futureHearingsReducer(initialState, action);
    expect(actual).toMatchSnapshot();
  });

  it('should reset', () => {
    const action = new FutureHearingsActions.RemoveFutureHearingsReset();
    const actual = futureHearingsReducer(initialState, action);
    expect(actual).toMatchSnapshot();
  });
});
