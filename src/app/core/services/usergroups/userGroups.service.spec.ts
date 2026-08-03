import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';

import { CppHttp } from '@cpp/core';
import { UserGroupsService } from './usergroups.service';
import { repeatUntil } from '@cpp/core';

describe('UserGroupsService', () => {
  let service: UserGroupsService;
  let http: CppHttp;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserGroupsService,
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            command: jest.fn(),
            commandSync: jest.fn(),
            repeatUntil
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });
    service = TestBed.inject(UserGroupsService);
    http = TestBed.inject(CppHttp);
  });

  describe('saveCheckAndChallengeReason', () => {
    it('Should save check and challenge reason', () => {
      const response$ = cold('-a|', {
        a: {}
      });
      const expected$ = cold('-b|', { b: {} });

      (http.commandSync as jest.Mock).mockReturnValue(response$);
      const command$ = service.saveCheckAndChallengeReason('target', 'description');

      expect(command$).toBeObservable(expected$);
      expect(http.commandSync).toHaveBeenCalledWith({
        body: {
          caseId: 'target',
          description: 'description'
        },
        url: '/usersgroups-query-api/command/api/rest/usersgroups/permissions',
        requestType: 'application/vnd.usersgroups.create-permission-for-user-to-view-case+json',
        successEvent: 'public.usersgroups.permission-created'
      });
    });
  });

  it('#getOrganisationDetails: should get an organisation details for the given organisation id', () => {
    const expected = {
      organisationId: '1371dfe8-8aa5-47f7-bb76-275b83fc312d',
      organisationType: 'HMCTS',
      organisationName: 'HMCTS',
      addressLine1: 'Digital Change Directorate',
      addressLine2: '6th Floor',
      addressLine3: '102 Petty France',
      addressLine4: 'London',
      addressPostcode: 'SW1H 9AJ',
      phoneNumber: '80012345678',
      email: 'test@test.hmcts.gsi.gov.uk'
    };

    const expected$ = cold('-a|', { a: expected });

    (http.query as jest.Mock).mockReturnValue(expected$);

    const query$ = service.getOrganisationDetails('1371dfe8-8aa5-47f7-bb76-275b83fc312d');

    expect(query$).toBeObservable(expected$);

    expect(http.query).toHaveBeenCalledWith({
      url: `/usersgroups-query-api/query/api/rest/usersgroups/organisations/1371dfe8-8aa5-47f7-bb76-275b83fc312d`,
      requestType: 'application/vnd.usersgroups.get-organisation-details+json'
    });
  });
});
