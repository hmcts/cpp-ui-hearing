import { Action } from '@ngrx/store';
import { ActiveCourtOrderByDefendantId } from '../model/court-orders';
import { DefendantBreachApplication } from '../model/breach-application';

export const CLEAR_COURT_ORDERS = 'CLEAR_COURT_ORDERS';
export const LOAD_COURT_ORDERS_SUCCESS = 'LOAD_COURT_ORDERS_SUCCESS';

export const CREATE_COURT_ORDERS = 'CREATE_COURT_ORDERS';
export const CREATE_COURT_ORDERS_SUCCESS = 'CREATE_COURT_ORDERS_SUCCESS';

export const LOAD_COURT_ORDERS = 'LOAD_COURT_ORDERS';

export class ClearCourtOrdersAction implements Action {
  readonly type = CLEAR_COURT_ORDERS;

  constructor() {}
}

export class LoadCourtOrdersSuccessAction implements Action {
  readonly type = LOAD_COURT_ORDERS_SUCCESS;

  constructor(public readonly payload: ActiveCourtOrderByDefendantId) {}
}

export class CreateCourtOrdersAction implements Action {
  readonly type = CREATE_COURT_ORDERS;

  constructor(public readonly payload: DefendantBreachApplication) {}
}

export class CreateCourtOrdersSuccessAction implements Action {
  readonly type = CREATE_COURT_ORDERS_SUCCESS;

  constructor() {}
}

export class LoadCourtOrdersAction implements Action {
  readonly type = LOAD_COURT_ORDERS;

  constructor(public readonly payload: { hearingDate: string }) {}
}

export type CourtOrderAction =
  | ClearCourtOrdersAction
  | LoadCourtOrdersSuccessAction
  | CreateCourtOrdersAction
  | CreateCourtOrdersSuccessAction
  | LoadCourtOrdersAction;
