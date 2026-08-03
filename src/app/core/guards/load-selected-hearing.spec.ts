import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { ReferenceDataService } from '@cpp/reference-data';
import { UserDetails } from '@cpp/users-groups';
import { provideStore } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { LoadHearingDetailSuccessAction } from '..';
import { LoadAmendingUserDetailsSuccessAction } from '../actions';
import { HearingDetail, HearingLockState } from '../model';
import { AppState, reducers } from '../reducers';
import { hearing as mockHearing } from '../selectors/mock/mock-data';
import { HearingService } from '../services';
import { LoadSelectedHearingGuard } from './load-selected-hearing';

describe('LoadSelectedHearingGuard', () => {
  let guard: LoadSelectedHearingGuard;
  let store: MockStore<AppState>;
  let snapshot: ActivatedRouteSnapshot;
  let hearingService: HearingService;
  let refDataService: ReferenceDataService;
  let mockState;
  let dispatchSpy: jest.SpyInstance;

  const getHearing = jest.fn();
  const fetchJudicialMembers = jest.fn();
  const navigate = jest.fn();

  const mockJudiciaries = mockHearing.judiciary;

  beforeEach(() => {
    const createState = () => {
      return {
        referenceData: {
          organisationUnits: [
            {
              id: 'organisationUnitId',
              oucode: 'courtCentreOuCode'
            }
          ]
        },
        hearings: {
          current: {
            hearing: {
              id: 'hearingId',
              courtCentre: {
                id: 'organisationUnitId'
              },
              prosecutionCases: [{ id: 'caseId1' }, { id: 'caseId2' }]
            },
            hearingState: HearingLockState.INITIALISED
          },
          selectedHearingDate: '2021-01-01'
        },
        usersGroups: {
          userDetails: {
            userId: 'userId'
          },
          permissionsMap: [
            {
              permissionId: 'permissionId1',
              source: 'userId',
              target: 'noMatchHearingId',
              object: 'CaseAccess',
              action: 'View'
            },
            {
              permissionId: 'permissionId2',
              source: 'userId',
              target: 'noMatchCaseId',
              object: 'CaseAccess',
              action: 'View'
            }
          ],
          userRoles: [{ userPlacements: [{ placementId: 'courtCentreOuCode' }] }]
        }
      };
    };

    mockState = createState();

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideCppCoreHttpServices(),
        MockStore,
        LoadSelectedHearingGuard,
        CppHttp,
        provideMockStore({ initialState: mockState }),
        { provide: Router, useValue: { navigate } },
        { provide: HearingService, useValue: { getHearing } },
        { provide: ReferenceDataService, useValue: { fetchJudicialMembers } }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(LoadSelectedHearingGuard);
    store = TestBed.inject(MockStore);
    hearingService = TestBed.inject(HearingService);
    refDataService = TestBed.inject(ReferenceDataService);

    dispatchSpy = jest.spyOn(store, 'dispatch');
    hearingService.getHearing = jest.fn().mockReturnValue(of({ hearing: mockHearing }));
    refDataService.fetchJudicialMembers = jest.fn().mockReturnValue(of(mockJudiciaries));
    hearingService.getUserDetails = jest.fn().mockReturnValue(of({ firstName: 'Jessica' }));
  });

  beforeEach(
    () =>
      (snapshot = { ...new ActivatedRouteSnapshot(), params: { hearingId: 'hearing-id' } } as any)
  );

  it('should resolve amendment user details if hearing is locked', () => {
    hearingService.getHearing = jest.fn().mockReturnValue(
      of({
        hearing: mockHearing,
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
        amendedByUserId: 'amendingUserId'
      })
    );

    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(dispatchSpy).toHaveBeenCalledWith(
      new LoadHearingDetailSuccessAction({
        hearing: mockHearing as unknown as HearingDetail,
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
        amendedByUserId: 'amendingUserId'
      })
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      new LoadAmendingUserDetailsSuccessAction({ firstName: 'Jessica' } as UserDetails)
    );
  });

  it('should not resolve amendment user details if hearing is not locked', () => {
    hearingService.getHearing = jest.fn().mockReturnValue(
      of({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED,
        amendedByUserId: 'amendingUserId'
      })
    );

    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(dispatchSpy).toHaveBeenCalledWith(
      new LoadHearingDetailSuccessAction({
        hearing: mockHearing as unknown as HearingDetail,
        hearingState: HearingLockState.INITIALISED,
        amendedByUserId: 'amendingUserId'
      })
    );

    expect(dispatchSpy).not.toHaveBeenCalledWith(
      new LoadAmendingUserDetailsSuccessAction({ firstName: 'Jessica' } as UserDetails)
    );
  });

  it('should not resolve amendment user details if hearing is locked but viewing by the same user who amends', () => {
    hearingService.getHearing = jest.fn().mockReturnValue(
      of({
        hearing: mockHearing,
        hearingState: HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
        amendedByUserId: 'userId'
      })
    );

    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(store.dispatch).toHaveBeenCalledTimes(2);
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      new LoadAmendingUserDetailsSuccessAction({ firstName: 'Jessica' } as UserDetails)
    );
  });

  it('should resolve to true when hearing details and draft results successfully returned', () => {
    const expected$ = cold('(a|)', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$.pipe(take(1))).toBeObservable(expected$);
  });

  it('should dispatch store values belong to response of hearing and draft results call', () => {
    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
      expect(store.dispatch).toHaveBeenCalledTimes(2);
    });
  });

  it('should redirect to /technical-error page when retrieving the hearing fails', () => {
    const error$ = cold('#');
    hearingService.getHearing = jest.fn().mockReturnValue(error$);
    const expected$ = cold('(a|)', { a: false });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/technical-error']);
  });

  it('should redirect to /page-not-found when hearing is not found', () => {
    const error$ = cold('#', undefined, { status: 404 });
    hearingService.getHearing = jest.fn().mockReturnValue(error$);
    const expected$ = cold('(a|)', { a: false });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/page-not-found']);
  });

  it('should redirect to /unauthorised-access when user is not authorised to view a hearing', () => {
    const error$ = cold('#', undefined, { status: 403 });
    hearingService.getHearing = jest.fn().mockReturnValue(error$);
    const expected$ = cold('(a|)', { a: false });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/unauthorised-access']);
  });
});
