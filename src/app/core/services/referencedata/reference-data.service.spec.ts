import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { ReferenceDataService } from './reference-data.service';
import { mockJudicialMembers } from '../../../mock-data/test-mock-data';
import { toHttpParams } from '../../utils/utils';

const mockAlcoholLevels = [
  {
    id: '7950068c-900f-4b53-80e0-6f387d11e128',
    seqNo: 1,
    methodCode: 'A',
    methodDescription: 'Blood',
  },
  {
    id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c',
    seqNo: 2,
    methodCode: 'B',
    methodDescription: 'Breath',
  },
];

describe('ReferenceDataService', () => {
  let service: ReferenceDataService;
  let query: jest.Mock;

  beforeEach(() => {
    query = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        ReferenceDataService,
        {
          provide: CppHttp,
          useValue: {
            query,
          },
        },
      ],
      teardown: { destroyAfterEach: false },
    });
    service = TestBed.inject(ReferenceDataService);
  });

  describe('Get Alcohol Level Method', () => {
    const response = { alcoholLevelMethods: mockAlcoholLevels };
    const expected = mockAlcoholLevels;

    it('should fetch the alcohol level methods', () => {
      const response$ = cold('(-a|)', { a: response });
      const expected$ = cold('(-b|)', { b: expected });

      query.mockReturnValue(response$);

      const query$ = service.getAlcoholLevelMethod();

      expect(query$).toBeObservable(expected$);
      expect(query).toHaveBeenCalledWith({
        url: '/referencedata-query-api/query/api/rest/referencedata/alcohol-level-methods',
        requestType: 'application/vnd.referencedata.alcohol-level-methods+json',
      });
    });
  });

  describe('Get Judicial Members', () => {
    const response = { judiciaries: mockJudicialMembers };
    const expected = mockJudicialMembers;

    it('Should fetch judicial members by ids', () => {
      const response$ = cold('(-a|)', { a: response });
      const expected$ = cold('(-b|)', { b: expected });
      query.mockReturnValue(response$);

      const query$ = service.getJudicialMembersByIds(['1', '2', '3']);

      const params = toHttpParams({ ids: '1,2,3' });

      expect(query$).toBeObservable(expected$);
      expect(query).toHaveBeenCalledWith({
        url: '/referencedata-query-api/query/api/rest/referencedata/judiciaries',
        requestType: 'application/vnd.reference-data.judiciaries+json',
        params,
      });
    });

    it('Should fetch judicial members by name patterns', () => {
      const response$ = cold('(-a|)', { a: response });
      const expected$ = cold('(-b|)', { b: expected });
      query.mockReturnValue(response$);

      const query$ = service.getJudicialMembersByNamePattern('dav');

      const params = toHttpParams({ search: 'dav', limit: 20 });

      expect(query$).toBeObservable(expected$);
      expect(query).toHaveBeenCalledWith({
        url: '/referencedata-query-api/query/api/rest/referencedata/judiciaries',
        requestType: 'application/vnd.reference-data.judiciaries.all+json',
        params,
      });
    });
  });
});
