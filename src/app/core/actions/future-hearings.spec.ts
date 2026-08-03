import {
  FutureHearingsLoaded,
  RemoveFutureHearingsConfirmed,
  RemoveFutureHearingsSuccess,
  RemoveFutureHearingsReset
} from './future-hearings';
import * as FutureHearingsActions from './future-hearings';
import { mockSummary } from '../../mock-data/test-mock-data';

describe('Future hearings actions', () => {
  it('Should intialise a FutureHearingsLoaded action', () => {
    const action = new FutureHearingsLoaded([mockSummary]);
    expect({ ...action }).toEqual({
      type: FutureHearingsActions.FUTURE_HEARINGS_LOADED,
      payload: [mockSummary]
    });
  });

  it('Should intialise a RemoveFutureHearingsConfirmed action', () => {
    const action = new RemoveFutureHearingsConfirmed([]);
    expect({ ...action }).toEqual({
      type: FutureHearingsActions.REMOVE_FUTURE_HEARINGS_CONFIRMED,
      removeFutureHearings: []
    });
  });

  it('Should intialise a RemoveFutureHearingsSuccess action', () => {
    const action = new RemoveFutureHearingsSuccess();
    expect({ ...action }).toEqual({
      type: FutureHearingsActions.REMOVE_FUTURE_HEARINGS_SUCCESS
    });
  });

  it('Should intialise a RemoveFutureHearingsConfirmed action', () => {
    const action = new RemoveFutureHearingsReset();
    expect({ ...action }).toEqual({
      type: FutureHearingsActions.REMOVE_FUTURE_HEARINGS_RESET
    });
  });
});
