import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import {} from '@angular/router/testing';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { Actions } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { cold, hot } from 'jasmine-marbles';
import { of } from 'rxjs';
import {
  getActions,
  TestActions,
  mockCourtOrderOne,
  mockCourtOrders
} from '../../mock-data/test-mock-data';
import { ApiError, setCourtApplication } from '../actions';
import {
  CreateCourtOrdersAction,
  CreateCourtOrdersSuccessAction,
  LoadCourtOrdersAction,
  LoadCourtOrdersSuccessAction
} from '../actions/court-orders';
import { AppState, reducers } from '../reducers';
import { ProgressionService } from '../services/progression/progression.service';
import { CourtOrderEffects } from './court-order';
import { applicationTypeMockOne } from '@cpp/reference-data';
import { CourtApplication } from '../model';
import { CourtOrderService } from '../services';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { getCourtOrdersQueryParams } from '../selectors/court-order';
import { CourtOrdersQueryParams } from '../model/court-orders';

describe('Court Order effects', () => {
  let actions$: TestActions;
  let effects: CourtOrderEffects;
  let store: MockStore<AppState>;
  const addBreachApplication = jest.fn();
  const getCourtOrdersByDefendantIdAndOffenceDate = jest.fn();
  const navigateSpy = jest.fn().mockReturnValue(
    new Promise<void>((resolve, reject) => {
      resolve();
    })
  );
  const queryParamsMock: CourtOrdersQueryParams = {
    hearingDate: '2025-06-12',
    defendantIds: ['masterDefendantId1', 'masterDefendantId2'],
    offenceDates: ['2020-01-01', '2020-01-02']
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideCppCoreHttpServices(),
        CourtOrderEffects,
        {
          provide: ProgressionService,
          useValue: {
            addBreachApplication
          }
        },
        {
          provide: CourtOrderService,
          useValue: {
            getCourtOrdersByDefendantIdAndOffenceDate
          }
        },
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            commandSync: jest.fn()
          }
        },
        { provide: Actions, useFactory: getActions },
        { provide: Router, useValue: { navigate: navigateSpy } },
        provideMockStore({ initialState: {} }),
        MockStore
      ],
      teardown: { destroyAfterEach: false }
    });
    actions$ = TestBed.inject(Actions) as TestActions;
    effects = TestBed.inject(CourtOrderEffects);
    store = TestBed.inject(MockStore);
    store.overrideSelector(getCourtOrdersQueryParams, queryParamsMock);
  });

  describe('createCourtOrder$', () => {
    const inputAction = new CreateCourtOrdersAction({
      hearingId: '6be38d04-e3c7-437a-9327-d4e24cbc781a',
      masterDefendantId: '750e1e1-f142-4e79-8a1f-0ae75ef17256',
      breachedApplications: [
        {
          courtOrder: mockCourtOrderOne,
          applicationType: applicationTypeMockOne
        }
      ]
    });

    it('should create the court orders', () => {
      const createCourtOrdersSuccessAction = new CreateCourtOrdersSuccessAction();

      const setCourtApplicationAction = setCourtApplication({
        courtApplications: []
      });

      actions$.stream = hot('-a---', { a: inputAction });
      const expected$ = cold('-(bc)-', {
        b: createCourtOrdersSuccessAction,
        c: setCourtApplicationAction
      });

      addBreachApplication.mockReturnValue(
        of({
          courtApplications: [] as CourtApplication[]
        })
      );
      expect(effects.createCourtOrder$).toBeObservable(expected$);
    });

    it('should not create the court orders and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');

      actions$.stream = hot('-a---', { a: inputAction });
      const error$ = cold('#');
      const expected$ = cold('-b', { b: expectedAction });

      addBreachApplication.mockReturnValue(error$);
      expect(effects.createCourtOrder$).toBeObservable(expected$);
    });
  });

  describe('loadCourtOrder$', () => {
    const inputAction = new LoadCourtOrdersAction({ hearingDate: '2025-06-12' });

    it('should load the court orders', () => {
      const loadCourtOrdersSuccessAction = new LoadCourtOrdersSuccessAction({
        '123': mockCourtOrders
      });

      actions$.stream = hot('-a---', { a: inputAction });
      const expected$ = cold('-(b)-', {
        b: loadCourtOrdersSuccessAction
      });

      getCourtOrdersByDefendantIdAndOffenceDate.mockReturnValue(of({ '123': mockCourtOrders }));

      expect(effects.loadCourtOrder$).toBeObservable(expected$);
    });

    it('should not load the court orders and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');

      actions$.stream = hot('-a---', { a: inputAction });
      const error$ = cold('#');
      const expected$ = cold('-b', { b: expectedAction });

      getCourtOrdersByDefendantIdAndOffenceDate.mockReturnValue(error$);
      expect(effects.loadCourtOrder$).toBeObservable(expected$);
    });
  });
});
