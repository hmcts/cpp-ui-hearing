import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { referenceDataReducer } from '@cpp/reference-data';
import { HearingGuard } from './hearing-guard';
import { AppState } from '../reducers/index';
import { provideMockStore } from '@ngrx/store/testing';
import { HearingLockState } from '..';
import { RolePermission } from '@cpp/users-groups';

describe('HearingGuard', () => {
  let guard: HearingGuard;
  let store: Store<AppState>;
  let mockState: AppState;

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
        }
      },
      usersGroups: {
        userDetails: {
          userId: 'userId'
        },
        permissionsMap: {
          permissionId1: {
            permissionId: 'permissionId1',
            source: 'userId',
            target: 'noMatchHearingId',
            object: 'CaseAccess',
            action: 'View'
          } as RolePermission,
          permissionId2: {
            permissionId: 'permissionId2',
            source: 'userId',
            target: 'noMatchCaseId',
            object: 'CaseAccess',
            action: 'View'
          } as RolePermission
        } as Record<string, RolePermission>,
        userRoles: [{ userPlacements: [{ placementId: 'courtCentreOuCode' }] }]
      }
    } as AppState;
  };

  mockState = createState();

  let navigate: jest.Mock;

  const configureTestingModule = () => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(
          {
            referenceData: referenceDataReducer
          },
          {
            runtimeChecks: {}
          }
        ),
        provideMockStore({ initialState: mockState }),
        provideRouter([]),
        HearingGuard,
        {
          provide: Router,
          useValue: {
            navigate
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(HearingGuard);
    store = TestBed.inject(Store);

    jest.spyOn(store, 'dispatch');
  };

  const resetTestingModule = () => {
    TestBed.resetTestingModule();
    configureTestingModule();
  };

  beforeEach(() => {
    navigate = jest.fn();
    configureTestingModule();
  });

  const createSnapshot = (
    hearingId = 'hearingId',
    hearingGuardRouteId = 'hearing-list',
    referenceDataErrorRedirectTo = ''
  ) => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.params = { hearingId };
    snapshot.data = {
      hearingGuardRouteId,
      referenceDataErrorRedirectTo
    };
    return snapshot;
  };

  it(`should resolve to true when user's placementId matches the hearings court centre ouCode`, () => {
    expect.assertions(1);
    const snapshot = createSnapshot();

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
    });
  });

  it(`should resolve to true when user has a specific permission to the current hearing`, () => {
    mockState = createState();
    mockState.usersGroups.userRoles[0].userPlacements[0].placementId =
      'noMatchWithHearingCourtCentreId';
    mockState.usersGroups.permissionsMap['permissionId1'].target = 'hearingId';
    resetTestingModule();

    expect.assertions(1);
    const snapshot = createSnapshot();

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
    });
  });

  it(`should resolve to true when user has a specific permission to at least one case within the current hearing`, () => {
    mockState = createState();
    mockState.usersGroups.userRoles[0].userPlacements[0].placementId =
      'noMatchWithHearingCourtCentreId';
    mockState.usersGroups.permissionsMap['permissionId1'].target = 'noMatchingHearingId';
    mockState.usersGroups.permissionsMap['permissionId2'].target = 'caseId1';
    resetTestingModule();

    expect.assertions(1);
    const snapshot = createSnapshot();

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
    });
  });

  it(`should resolve to true when user does not have any placements (indicates national access)`, () => {
    mockState = createState();
    mockState.usersGroups.userRoles[0].userPlacements[0].placementId =
      'noMatchWithHearingCourtCentreId';
    mockState.usersGroups.permissionsMap['permissionId1'].target = 'noMatchHearingId';
    mockState.usersGroups.userRoles[0].userPlacements = [];
    resetTestingModule();

    expect.assertions(1);
    const snapshot = createSnapshot();

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
    });
  });

  it(`should navigate when user's placementId does not match the courtCentre ouCode and the user
    does not have a specific permission to either the hearing or any cases within a hearing`, () => {
    mockState = createState();
    mockState.usersGroups.userRoles[0].userPlacements = [
      { placementId: 'noMatchWithHearingCourtCentreId' }
    ];
    mockState.usersGroups.permissionsMap['permissionId1'].target = 'noMatchHearingId';
    resetTestingModule();

    expect.assertions(2);
    const snapshot = createSnapshot();

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(navigate).toHaveBeenCalledWith(['check-and-challenge', 'hearingId', 'hearing-list']);
      expect(didResolve).toEqual(false);
    });
  });
});
