import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { of, throwError } from 'rxjs';
import { mockCourtOrders } from '../../mock-data/test-mock-data';
import { AppState } from '../reducers/index';
import { CourtOrderService } from '../services/court-order/court-order.service';
import { LoadCourtOrdersGuard } from './load-court-orders';
import { getCourtOrdersQueryParams } from '../selectors/court-order';

describe('LoadCourtOrdersGuard', () => {
  let guard: LoadCourtOrdersGuard;
  let store: MockStore<AppState>;
  let snapshot: ActivatedRouteSnapshot;
  let courtOrdersService: CourtOrderService;
  const navigate = jest.fn();

  let getCourtOrdersByDefendantIdAndOffenceDate: jest.Mock;

  beforeEach(() => {
    getCourtOrdersByDefendantIdAndOffenceDate = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        LoadCourtOrdersGuard,
        {
          provide: CourtOrderService,
          useValue: {
            getCourtOrdersByDefendantIdAndOffenceDate
          }
        },
        { provide: Router, useValue: { navigate } },
        provideMockStore({
          initialState: {},
          selectors: [
            {
              selector: getCourtOrdersQueryParams,
              value: {
                hearingDate: '2018-08-01',
                defendantIds: ['36273b86-ca5d-497b-a265-e8cb85c5881e'],
                offenceDates: ['2022-02-16']
              }
            }
          ]
        })
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(LoadCourtOrdersGuard);
    store = TestBed.inject(MockStore);
    courtOrdersService = TestBed.inject(CourtOrderService);

    jest.spyOn(store, 'dispatch');
    courtOrdersService.getCourtOrdersByDefendantIdAndOffenceDate = jest
      .fn()
      .mockReturnValue(of({ '36273b86-ca5d-497b-a265-e8cb85c5881e': mockCourtOrders }));
  });

  beforeEach(() => {
    snapshot = { ...new ActivatedRouteSnapshot(), params: { hearingId: 'hearing-id' } } as any;
  });

  it('should resolve to true when courtOrders successfully returned', () => {
    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
  });

  it('should dispatch store values belong to response of court orders service call call', () => {
    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(store.dispatch).toHaveBeenCalledTimes(1);
  });

  it('should resolve to false when hearing service catch an error', () => {
    courtOrdersService.getCourtOrdersByDefendantIdAndOffenceDate = jest
      .fn()
      .mockReturnValue(throwError('any'));

    const expected$ = cold('(a|)', { a: false });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/technical-error']);
  });

  it('should resolve to true when no defendants with guilty pleas exist', () => {
    store.overrideSelector(getCourtOrdersQueryParams, {
      hearingDate: '2018-08-01',
      defendantIds: [],
      offenceDates: []
    });

    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(store.dispatch).toHaveBeenCalledTimes(1);
  });
});
