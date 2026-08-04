import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { ApiError, AppState, UserGroupsService } from '../../core';
import { hmctsOrganisationResolver } from './hmctsOrganisation.resolver';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

const userDetails = {
  userId: 'a085e359-6069-4694-8820-7810e7dfe762',
  firstName: 'Erica',
  lastName: 'Wilson',
  email: 'erica@test.hmcts.net',
  userType: 'User',
  organisationId: '1371dfe8-8aa5-47f7-bb76-275b83fc312d',
  prosecutingAuthorityAccess: 'ALL',
};

const orgDetails = {
  organisationId: '1371dfe8-8aa5-47f7-bb76-275b83fc312d',
  organisationType: 'HMCTS',
  organisationName: 'HMCTS',
  addressLine1: 'Digital Change Directorate',
  addressLine2: '6th Floor',
  addressLine3: '102 Petty France',
  addressLine4: 'London',
  addressPostcode: 'SW1H 9AJ',
  phoneNumber: '80012345678',
  email: 'test@test.hmcts.gsi.gov.uk',
};

describe('HmctsOrganisationResolver', () => {
  let getOrganisationDetails: jest.Mock;
  let store: MockStore<AppState>;
  const routeStub = {
    paramMap: {
      get: (_key: string) => '1',
    },
  };
  const stateStub = {};

  beforeEach(() => {
    getOrganisationDetails = jest.fn();

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        MockStore,
        provideMockStore({
          initialState: {
            usersGroups: {
              userDetails,
            },
          },
        }),
        {
          provide: UserGroupsService,
          useValue: {
            getOrganisationDetails,
          },
        },
      ],
    });
    store = TestBed.get(Store);
  });

  it('should return true if logged in user belongs to hmcts organisation', () => {
    const response$ = cold('-(a|)', { a: orgDetails });
    const expected$ = cold('-(b|)-', { b: true });
    getOrganisationDetails.mockReturnValue(response$);

    TestBed.runInInjectionContext(() => {
      const result = hmctsOrganisationResolver(
        routeStub as ActivatedRouteSnapshot,
        stateStub as RouterStateSnapshot
      );
      expect(result).toBeObservable(expected$);
      expect(getOrganisationDetails).toHaveBeenCalled();
    });
  });

  it('should dispatch error if api returns error', () => {
    jest.spyOn(store, 'dispatch');
    const error = new HttpErrorResponse({ status: 500 });
    const apiErrorAction = new ApiError({ error });
    const response$ = cold('--#', null, error);
    const expected$ = cold('--(b|)-', { b: false });

    getOrganisationDetails.mockReturnValue(response$);

    TestBed.runInInjectionContext(() => {
      const result = hmctsOrganisationResolver(
        routeStub as ActivatedRouteSnapshot,
        stateStub as RouterStateSnapshot
      );
      expect(result).toBeObservable(expected$);
      expect(store.dispatch).toHaveBeenCalledWith(apiErrorAction);
    });
  });
});
