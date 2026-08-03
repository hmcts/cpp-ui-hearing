/**/
import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { HttpParams } from '@angular/common/http';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { CrackedIneffectiveSubReasonService } from './cracked-ineffective-sub-reason.service';
import { constructApiEndPointUrl } from '../utils/utils';

describe('CrackedIneffectiveSubReasonService', () => {
  let service: CrackedIneffectiveSubReasonService;
  let http: CppHttp;

  const mockSubReasons = [
    { id: '1', subReasonCode: 'SUB1', subReasonDesc: 'Sub Reason 1', primaryReasonCode: 'CRACKED' },
    { id: '2', subReasonCode: 'SUB2', subReasonDesc: 'Sub Reason 2', primaryReasonCode: 'CRACKED' },
    {
      id: '3',
      subReasonCode: 'SUB3',
      subReasonDesc: 'Sub Reason 3',
      primaryReasonCode: 'INEFFECTIVE'
    },
    { id: '4', subReasonCode: 'SUB4', subReasonDesc: 'Sub Reason 4', primaryReasonCode: 'CRACKED' }
  ];

  const mockSubReasonsResponse = {
    crackedIneffectiveSubReasons: mockSubReasons
  };

  const mockSingleSubReasonResponse = {
    crackedIneffectiveSubReason: {
      id: '2',
      subReasonCode: 'SUB2',
      subReasonDesc: 'Sub Reason 2',
      primaryReasonCode: 'CRACKED'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn()
          }
        },
        CrackedIneffectiveSubReasonService
      ],
      teardown: { destroyAfterEach: false }
    });

    http = TestBed.inject(CppHttp);
    service = TestBed.inject(CrackedIneffectiveSubReasonService);

    jest.clearAllMocks();
  });

  describe('getSubReasons', () => {
    it('should fetch all sub reasons and map the response', () => {
      const expectedUrl = constructApiEndPointUrl(
        'referenceDataQuery',
        'cracked-ineffective-sub-reasons'
      );
      const expectedRequestType =
        'application/vnd.referencedata.query.cracked-ineffective-sub-reasons+json';
      const response$ = cold('-a|', { a: mockSubReasonsResponse });
      const expected$ = cold('-b|', { b: mockSubReasons });

      (http.query as jest.Mock).mockReturnValue(response$);

      const result$ = service.getSubReasons();

      expect(result$).toBeObservable(expected$);
      expect(http.query).toHaveBeenCalledTimes(1);
      expect(http.query).toHaveBeenCalledWith({
        url: expectedUrl,
        requestType: expectedRequestType
      });
    });
  });

  describe('getSubReasonById', () => {
    it('should fetch a single sub reason by ID and map the response', () => {
      const subReasonId = '2';
      const expectedUrl = constructApiEndPointUrl(
        'referenceDataQuery',
        'cracked-ineffective-sub-reasons'
      );
      const expectedRequestType =
        'application/vnd.referencedata.query.cracked-ineffective-sub-reason+json';
      const expectedParams = new HttpParams().set('subReasonId', subReasonId);

      const response$ = cold('-a|', { a: mockSingleSubReasonResponse });
      const expected$ = cold('-b|', { b: mockSingleSubReasonResponse.crackedIneffectiveSubReason });

      (http.query as jest.Mock).mockReturnValue(response$);

      const result$ = service.getSubReasonById(subReasonId);

      expect(result$).toBeObservable(expected$);
      expect(http.query).toHaveBeenCalledTimes(1);
      expect(http.query).toHaveBeenCalledWith({
        url: expectedUrl,
        requestType: expectedRequestType,
        params: expectedParams
      });
    });

    it('should handle error when sub reason not found', () => {
      const subReasonId = '999';
      const error = { status: 404, message: 'Not found' };

      const response$ = cold('-#', null, error);

      (http.query as jest.Mock).mockReturnValue(response$);

      const result$ = service.getSubReasonById(subReasonId);

      expect(result$).toBeObservable(cold('-#', null, error));
    });
  });

  describe('URL construction', () => {
    it('should construct correct URLs for both methods', () => {
      const response$ = cold('-a|', { a: mockSubReasonsResponse });
      (http.query as jest.Mock).mockReturnValue(response$);

      service.getSubReasons().subscribe();
      service.getSubReasonById('123').subscribe();

      expect(http.query).toHaveBeenCalledTimes(2);

      const firstCall = (http.query as jest.Mock).mock.calls[0][0];
      const secondCall = (http.query as jest.Mock).mock.calls[1][0];

      expect(firstCall.url).toContain('cracked-ineffective-sub-reasons');
      expect(secondCall.url).toContain('cracked-ineffective-sub-reasons');
      expect(firstCall.requestType).toBe(
        'application/vnd.referencedata.query.cracked-ineffective-sub-reasons+json'
      );
      expect(secondCall.requestType).toBe(
        'application/vnd.referencedata.query.cracked-ineffective-sub-reason+json'
      );
      expect(secondCall.params.get('subReasonId')).toBe('123');
    });
  });
});
