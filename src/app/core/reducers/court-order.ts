import * as CourtOrderActions from '../actions/court-orders';
import { CourtOrderAction } from '../actions/court-orders';
import { ActiveCourtOrderByDefendantId } from '../model/court-orders';

export interface CourtOrderState {
  activeCourtOrder: ActiveCourtOrderByDefendantId;
}

const initialState: CourtOrderState = {
  activeCourtOrder: {}
};

export function courtOrderReducer(
  state: CourtOrderState = initialState,
  action: CourtOrderAction
): CourtOrderState {
  switch (action.type) {
    case CourtOrderActions.CLEAR_COURT_ORDERS:
      return { ...initialState };

    case CourtOrderActions.LOAD_COURT_ORDERS_SUCCESS:
      return {
        ...state,
        activeCourtOrder: { ...state.activeCourtOrder, ...action.payload }
      };

    default:
      return state;
  }
}
