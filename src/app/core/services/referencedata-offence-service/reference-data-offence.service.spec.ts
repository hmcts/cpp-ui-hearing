import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { ReferenceDataOffenceService } from '..';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { OffenceType } from '../..';

describe('ReferenceDataOffenceService', () => {
  let service: ReferenceDataOffenceService;
  let http: CppHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        ReferenceDataOffenceService,
        { provide: CppHttp, useValue: { query: jest.fn() } }
      ],
      teardown: { destroyAfterEach: false }
    });
    http = TestBed.inject(CppHttp);
    service = TestBed.inject(ReferenceDataOffenceService);
  });

  describe('#searchOffenceTypes', () => {
    it('Should buikld the right url and return the offences', () => {
      const offences: OffenceType[] = [
        {
          offenceId: '17bd3b5b-de61-46cb-a395-0f46e70774c4',
          cjsOffenceCode: 'GA96101',
          title:
            'Aircraft commander / tug driver fail to stop after aircraft accident within Gatwick Airport',
          legislation: 'whatever'
        },
        {
          offenceId: '42a5fdfe-1642-4358-99c3-7d5816927944',
          cjsOffenceCode: 'GA96011',
          title:
            'Allow a vehicle to be on Gatwick Airport after being forbidden to do so by a PC / airport official',
          legislation: 'whatever'
        }
      ];

      const offencesResponse: { offences: OffenceType[] } = {
        offences
      };

      const searchOffencesResponse$ = cold('-a|', { a: offencesResponse });
      const expected$ = cold('-b|', { b: offences });

      http.query = jest.fn().mockReturnValue(searchOffencesResponse$);

      expect(service.searchOffenceTypes('test', 20, '2001-01-01')).toBeObservable(expected$);
      expect(http.query).toHaveBeenCalledWith({
        // tslint:disable-next-line:max-line-length
        url: `/referencedataoffences-query-api/query/api/rest/referencedataoffences/offences/search?q=test&limit=20&offenceDate=2001-01-01`,
        requestType: 'application/vnd.referencedataoffences.offences-search+json'
      });
    });
  });
});
