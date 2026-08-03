import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { OutstandingFinesService, CaseType } from './outstanding-fines.service';
import { OutstandingFine } from '../../../outstanding-fines.interfaces';
import { UsersGroupsService } from '@cpp/users-groups';
import { of } from 'rxjs';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';

describe('OutstandingFinesService', () => {
  let referenceData: OutstandingFinesService;
  let query: jest.Mock;
  let command: jest.Mock;

  beforeEach(() => {
    query = jest.fn();
    command = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideCppCoreHttpServices(),
        OutstandingFinesService,
        {
          provide: UsersGroupsService,
          useValue: {
            fetchLoggedInUserDetails: jest
              .fn()
              .mockReturnValue(of({ userId: 1, firstName: 'sdf', lastName: 'sdf' }))
          }
        },
        {
          provide: CppHttp,
          useValue: { query, command }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    referenceData = TestBed.inject(OutstandingFinesService);
  });

  describe('getDefendantOutstandingFines', () => {
    const outstandingFines: OutstandingFine[] = [];
    const defendantId = 'test-defendant-id';

    it('Should fetch outstanding fines for a CC case', () => {
      const response = { outstandingFines };
      const expected = { outstandingFines };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: expected });

      query.mockReturnValue(response$);

      const query$ = referenceData.getDefendantOutstandingFines(defendantId, CaseType.CC);

      expect(query$).toBeObservable(expected$);
      expect(query).toHaveBeenCalledWith({
        url: `/hearing-query-api/query/api/rest/hearing/defendant/${defendantId}/outstanding-fines`,
        requestType: 'application/vnd.hearing.defendant.outstanding-fines+json'
      });
    });

    it('Should fetch outstanding fines for a SJP case', () => {
      const response = { outstandingFines };
      const expected = { outstandingFines };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', { b: expected });

      query.mockReturnValue(response$);

      const query$ = referenceData.getDefendantOutstandingFines(defendantId, CaseType.SJP);

      expect(query$).toBeObservable(expected$);
      expect(query).toHaveBeenCalledWith({
        url: `/sjp-query-api/query/api/rest/sjp/defendant/${defendantId}/outstanding-fines`,
        requestType: 'application/vnd.sjp.query.defendant-outstanding-fines+json'
      });
    });
  });

  describe('getCourtroomOutstandingFines', () => {
    it('Should fetch outstanding fines for a CC case', () => {
      const response = { body: '{"courtRooms": []}' };
      const response$ = cold('-a|', { a: response });
      const expected$ = cold('-b|', {
        b: {
          courtRooms: [],
          createdBy: 'sdf sdf'
        }
      });

      command.mockReturnValue(response$);

      const command$ = referenceData.getCourtroomOutstandingFines(
        'court_centre_Id_001',
        ['room_id_001', 'room_id_002', 'room_id_003'],
        '2020-01-09'
      );

      expect(command$).toBeObservable(expected$);
      expect(command).toHaveBeenCalledWith({
        url: '/hearing-query-api/query/api/rest/hearing/outstanding-fines',
        requestType: 'application/vnd.hearing.query.outstanding-fines+json',
        body: {
          courtCentreId: 'court_centre_Id_001',
          courtRoomIds: ['room_id_001', 'room_id_002', 'room_id_003'],
          hearingDate: '2020-01-09'
        }
      });
    });
  });
});
