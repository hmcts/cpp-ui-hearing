import {
  ClearCourtOrdersAction,
  LoadCourtOrdersSuccessAction,
  CreateCourtOrdersAction,
  CreateCourtOrdersSuccessAction,
  LoadCourtOrdersAction
} from './court-orders';
import * as CourtOrderAcions from './court-orders';
import { mockCourtOrderOne } from '../../mock-data/test-mock-data';
import { applicationTypeMockOne } from '@cpp/reference-data';

describe('Load court-order actions', () => {
  it('Should create a LoadCourtOrdersAction action', () => {
    const action = new ClearCourtOrdersAction();
    expect({ ...action }).toEqual({
      type: CourtOrderAcions.CLEAR_COURT_ORDERS
    });
  });

  it('Should create a LoadCourtOrdersSuccessAction action', () => {
    const action = new LoadCourtOrdersSuccessAction({ '123': [] });
    expect({ ...action }).toEqual({
      type: CourtOrderAcions.LOAD_COURT_ORDERS_SUCCESS,
      payload: { '123': [] }
    });
  });

  it('Should create a LoadCourtOrdersAction action', () => {
    const action = new LoadCourtOrdersAction({ hearingDate: '2025-06-12' });
    expect({ ...action }).toEqual({
      type: CourtOrderAcions.LOAD_COURT_ORDERS,
      payload: { hearingDate: '2025-06-12' }
    });
  });

  describe('Create Breach actions', () => {
    it('Should create a CreateCourtOrdersAction action', () => {
      const action = new CreateCourtOrdersAction({
        masterDefendantId: '6be38d04-e3c7-437a-9327-d4e24cbc781a',
        hearingId: '750e1e1-f142-4e79-8a1f-0ae75ef17256',
        breachedApplications: [
          {
            courtOrder: mockCourtOrderOne,
            applicationType: applicationTypeMockOne
          }
        ]
      });
      expect({ ...action }).toEqual({
        type: CourtOrderAcions.CREATE_COURT_ORDERS,
        payload: {
          masterDefendantId: '6be38d04-e3c7-437a-9327-d4e24cbc781a',
          hearingId: '750e1e1-f142-4e79-8a1f-0ae75ef17256',
          breachedApplications: [
            {
              courtOrder: mockCourtOrderOne,
              applicationType: applicationTypeMockOne
            }
          ]
        }
      });
    });

    it('Should create a CreateCourtOrdersSuccessAction action', () => {
      const action = new CreateCourtOrdersSuccessAction();
      expect({ ...action }).toEqual({
        type: CourtOrderAcions.CREATE_COURT_ORDERS_SUCCESS
      });
    });
  });
});
