import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { UserGroup } from '@cpp/users-groups';
import { cold } from 'jasmine-marbles';
import { AppState } from '../../core';
import { CheckInGuard } from './check-in';

describe('CheckInGuard', () => {
  let guard: CheckInGuard;
  let navigate: jest.Mock;
  let store: MockStore;

  const mockUserGroups: UserGroup[] = [
    {
      groupId: 'test-group-id',
      groupName: 'Defence Users',
      description: 'Defence users group'
    }
  ];

  const mockInitialState: Partial<AppState> = {
    usersGroups: {
      userGroups: mockUserGroups
    }
  } as Partial<AppState>;

  beforeEach(() => {
    navigate = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMockStore({ initialState: mockInitialState }),
        {
          provide: Router,
          useValue: {
            navigate
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    store = TestBed.inject(MockStore);
    guard = TestBed.inject(CheckInGuard);
  });

  it('should resolve to true for allowed users', () => {
    const expected$ = cold('(b|)', { b: true });

    const activate$ = guard.canActivate();

    expect(activate$).toBeObservable(expected$);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should navigate to unauthorised-access for disallowed users', () => {
    const disallowedUserGroups: UserGroup[] = [
      {
        groupId: 'test-group-id',
        groupName: 'Unauthorized Group',
        description: 'Unauthorized group'
      }
    ];

    const disallowedState: Partial<AppState> = {
      usersGroups: {
        userGroups: disallowedUserGroups
      }
    } as Partial<AppState>;

    store.setState(disallowedState);

    const expected$ = cold('(b|)', { b: false });

    const activate$ = guard.canActivate();

    expect(activate$).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/unauthorised-access']);
  });

  it('should check if user groups include allowed users', () => {
    expect(
      guard.includesAllowedUsers([{ groupId: '1', groupName: 'Defence Users', description: '' }])
    ).toBe(true);
    expect(
      guard.includesAllowedUsers([{ groupId: '2', groupName: 'Advocates', description: '' }])
    ).toBe(true);
    expect(guard.includesAllowedUsers([{ groupId: '3', groupName: 'CPS', description: '' }])).toBe(
      true
    );
    expect(
      guard.includesAllowedUsers([
        { groupId: '4', groupName: 'Non CPS Prosecutors', description: '' }
      ])
    ).toBe(true);
    expect(
      guard.includesAllowedUsers([{ groupId: '5', groupName: 'Unauthorized', description: '' }])
    ).toBe(false);
  });

  it('should resolve navigation correctly', () => {
    expect(guard.resolveNavigation(true)).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    guard.resolveNavigation(false);
    expect(navigate).toHaveBeenCalledWith(['/unauthorised-access']);
  });
});
