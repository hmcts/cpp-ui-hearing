import { TestBed } from '@angular/core/testing';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { SessionTimesService } from './session-times.service';
import { mockSessionTimesCourt } from '../../../mock-data/test-mock-data';
import { cold } from 'jasmine-marbles';
import { HttpParams } from '@angular/common/http';

describe('SessionTimesService', () => {
  let service: SessionTimesService;
  let query: jest.Mock;
  let command: jest.Mock;

  beforeEach(() => {
    query = jest.fn();
    command = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        SessionTimesService,
        {
          provide: CppHttp,
          useValue: {
            query,
            command
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    service = TestBed.inject(SessionTimesService);
  });

  describe('Get Session Times', () => {
    const courtHouseId = '123';
    const courtRoomId = '456';
    const sessionDate = 'some-date';

    it('should return session times for previously saved session times for a courthouse/courtroom combination', () => {
      const response$ = cold('(-a|)', { a: { ...mockSessionTimesCourt } });
      const expected$ = cold('(-b|)', { b: mockSessionTimesCourt });
      query.mockReturnValue(response$);

      const query$ = service.getSessionTimes(courtHouseId, courtRoomId, sessionDate);
      const httpParams = new HttpParams().set('courtSessionDate', sessionDate);

      expect(query$).toBeObservable(expected$);
      expect(query).toHaveBeenCalledWith({
        url: `/hearing-query-api/query/api/rest/hearing/session-time/${courtHouseId}/${courtRoomId}`,
        requestType: 'application/vnd.hearing.query.session-time+json',
        params: httpParams
      });
    });

    it('should return a 404 which is then converted to null for a courthouse/courtroom combination that not previously saved', () => {
      const response$ = cold('-#', null, { status: 404 });
      const expected$ = cold('-(b|)', { b: null });

      query.mockReturnValue(response$);

      const query$ = service.getSessionTimes(courtHouseId, courtRoomId, sessionDate);
      const httpParams = new HttpParams().set('courtSessionDate', sessionDate);

      expect(query$).toBeObservable(expected$);
      expect(query).toHaveBeenCalledWith({
        url: `/hearing-query-api/query/api/rest/hearing/session-time/${courtHouseId}/${courtRoomId}`,
        requestType: 'application/vnd.hearing.query.session-time+json',
        params: httpParams
      });
    });
  });
});
