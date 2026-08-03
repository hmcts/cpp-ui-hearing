import { FutureHearingsService, HearingService } from '..';
import { TestBed } from '@angular/core/testing';

import { cold } from 'jasmine-marbles';
import { mockSummary } from '../../../mock-data/test-mock-data';
import { HttpParams } from '@angular/common/http';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';

describe('Future hearings service', () => {
  let service: FutureHearingsService;
  let http: CppHttp;
  let removeOffencesForHearing: jest.Mock;
  let markAsDuplicate: jest.Mock;

  beforeEach(() => {
    const mockResponse$ = cold('-a|', { a: {} });
    removeOffencesForHearing = jest.fn(() => mockResponse$);
    markAsDuplicate = jest.fn(() => mockResponse$);

    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        {
          provide: HearingService,
          useValue: {
            markAsDuplicate,
            removeOffencesForHearing
          }
        },
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn(),
            commandSync: jest.fn()
          }
        },
        FutureHearingsService
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(FutureHearingsService);
  });

  it('should query with case ids', () => {
    const mockResponse = { hearingSummaries: [mockSummary] };

    const mockResponse$ = cold('-a|', { a: mockResponse });
    const expected$ = cold('-b|', { b: mockResponse.hearingSummaries });

    http.query = jest.fn().mockReturnValue(mockResponse$);

    const query$ = service.getFutureHearingForCases(['case-a', 'case-b']);

    expect(query$).toBeObservable(expected$);

    expect(http.query).toHaveBeenCalledWith({
      url: '/hearing-query-api/query/api/rest/hearing/future-hearings-by-cases',
      requestType: 'application/vnd.hearing.get.future-hearings+json',
      params: new HttpParams().set('caseIds', 'case-a,case-b')
    });
  });

  it('should remove hearing with offences', () => {
    service.removeFutureHearing({
      hearingId: 'hearing-id',
      offenceIds: ['offence-id']
    });

    expect(removeOffencesForHearing).toHaveBeenCalled();
    expect(markAsDuplicate).not.toHaveBeenCalled();
  });

  it('should remove hearing', () => {
    service.removeFutureHearing({
      hearingId: 'hearing-id',
      offenceIds: [],
      hearingToRemove: true
    });

    expect(markAsDuplicate).toHaveBeenCalled();
    expect(removeOffencesForHearing).not.toHaveBeenCalled();
  });
});
