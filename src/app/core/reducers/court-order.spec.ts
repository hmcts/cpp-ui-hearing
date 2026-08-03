import { mockCourtOrders } from '../../mock-data/test-mock-data';
import { ClearCourtOrdersAction, LoadCourtOrdersSuccessAction } from '../actions/court-orders';
import { courtOrderReducer, CourtOrderState } from './court-order';

describe('CourtOrderReducer', () => {
  const state: CourtOrderState = {
    activeCourtOrder: {
      '321': []
    }
  };

  it('Should clear the court orders', () => {
    const actual = courtOrderReducer(state, new ClearCourtOrdersAction());
    expect(actual).toEqual({ activeCourtOrder: {} });
  });

  it('Should load the court orders', () => {
    const actual = courtOrderReducer(
      state,
      new LoadCourtOrdersSuccessAction({ '123': mockCourtOrders })
    );
    expect(actual).toEqual(<CourtOrderState>{
      activeCourtOrder: {
        '123': mockCourtOrders,
        '321': []
      }
    });
  });
});
