import { TestBed } from '@angular/core/testing';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { cold } from 'jasmine-marbles';
import { validAvailableHearingMock1 } from '../../../results/hearing-details/related-hearings/mock/data';
import {
  SearchAvailableHearingsFormOptions,
  SearchCriteriaAvailableHearingsType
} from '../../model/available-hearing';
import { ListingService } from './listing.service';

describe('ListingService', () => {
  let service: ListingService;
  let http: CppHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideCppCoreHttpServices(),
        ListingService,
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            commandSync: jest.fn()
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(ListingService);
  });

  describe('search tests', () => {
    const mockSearchAvailableHearingsFormOptions: SearchAvailableHearingsFormOptions = {
      hearingId: 'mock-test-hearing-id',
      searchCriterias: [SearchCriteriaAvailableHearingsType.CASE_IN_HEARING]
    };

    let url = '/listing-query-api/query/api/rest/listing/hearings/range-search';
    const searchAvailableHearingsRequestType = 'application/vnd.listing.search.hearings+json';
    const hearings = [validAvailableHearingMock1];
    it('#searchAvailableHearings - normal hearing', () => {
      url = '/listing-service/query/api/rest/listing/hearings/available-search/';
      const isBoxHearing = false;
      const matchedDefendantIds: string[] = [];
      const caseUrnForLinkedCases: string = null;

      const httpResponse$ = cold('-a|', { a: { hearings } });
      const expected$ = cold('-b|', { b: { hearings } });

      const querySpy = jest.fn().mockReturnValue(httpResponse$);
      http.query = querySpy;
      const query$ = service.searchAvailableHearings(
        mockSearchAvailableHearingsFormOptions,
        isBoxHearing,
        matchedDefendantIds,
        caseUrnForLinkedCases
      );
      expect(query$).toBeObservable(expected$);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].url).toEqual(url);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].requestType).toEqual(
        searchAvailableHearingsRequestType
      );
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('hearingId')
      ).toBeTruthy();
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('caseUrnForLinkedCases')
      ).toBeFalsy();
    });

    it('#searchAvailableHearings - boxwork hearing', () => {
      url = '/listing-service/query/api/rest/listing/hearings/available-search/';
      const isBoxHearing = true;
      const matchedDefendantIds: string[] = [];
      const caseUrnForLinkedCases = 'test-linked-case-urn';

      const httpResponse$ = cold('-a|', { a: { hearings } });
      const expected$ = cold('-b|', { b: { hearings } });

      const querySpy = jest.fn().mockReturnValue(httpResponse$);
      http.query = querySpy;
      const query$ = service.searchAvailableHearings(
        mockSearchAvailableHearingsFormOptions,
        isBoxHearing,
        matchedDefendantIds,
        caseUrnForLinkedCases
      );
      expect(query$).toBeObservable(expected$);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].url).toEqual(url);
      expect(querySpy.mock.calls[querySpy.mock.calls.length - 1][0].requestType).toEqual(
        searchAvailableHearingsRequestType
      );
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('hearingId')
      ).toBeFalsy();
      expect(
        querySpy.mock.calls[querySpy.mock.calls.length - 1][0].params.has('caseUrnForLinkedCases')
      ).toBeTruthy();
    });
  });
});
