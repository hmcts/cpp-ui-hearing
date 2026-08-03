import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { CourtOrderService } from './court-order.service';
import * as mockData from './mocks.json';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';

describe('CourtOrderService', () => {
  let service: CourtOrderService;
  let http: CppHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn(),
            commandSync: jest.fn()
          }
        },
        CourtOrderService
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(CourtOrderService);
  });

  it('getCourtOrders Should get the specified court orders', () => {
    const response = (mockData as any).courtOrders;

    const courtOrders$ = cold('-a|', { a: response });
    const expected$ = cold('-b|', { b: response.courtOrders });

    http.query = jest.fn().mockReturnValue(courtOrders$);

    const query$ = service.getCourtOrders('123');

    expect(query$).toBeObservable(expected$);

    expect(http.query).toHaveBeenCalledWith({
      url: '/applicationscourtorders-query-api/query/api/rest/courtorders/court-order/defendant/123',
      requestType: 'application/vnd.courtorders.query.court-order-by-defendant-id+json',
      params: new HttpParams().set('active', 'true')
    });
  });

  it('getCourtOrdersByDefendantIdAndOffenceDate should get court orders and return them grouped by masterDefendantId', () => {
    const response = {
      courtOrders: (mockData as any).courtOrders.map((o: any) => ({
        ...o,
        masterDefendantId: 'masterDefendantId'
      }))
    };

    const courtOrders$ = cold('-a|', { a: response });
    const expectedMapping = { masterDefendantId: response.courtOrders };
    const expected$ = cold('-b|', { b: expectedMapping });

    (http.query as jest.Mock).mockReturnValue(courtOrders$);

    const query$ = service.getCourtOrdersByDefendantIdAndOffenceDate({
      hearingDate: '2025-06-12',
      defendantIds: ['masterDefendantId'],
      offenceDates: ['2020-01-01']
    });

    expect(query$).toBeObservable(expected$);

    expect(http.query).toHaveBeenCalledWith({
      url: '/applicationscourtorders-query-api/query/api/rest/courtorders/court-order/defendant-id-and-offence-date',
      requestType:
        'application/vnd.courtorders.query.court-order-by-defendant-id-and-offence-date+json',
      params: new HttpParams()
        .set('hearingDate', '2025-06-12')
        .set('filterCriteria', 'masterDefendantId:2020-01-01')
    });
  });
});
