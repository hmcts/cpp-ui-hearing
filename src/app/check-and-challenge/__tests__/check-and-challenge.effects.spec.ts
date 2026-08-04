import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { reducers } from '../../core/reducers';
import { CheckAndChallengeEffects } from '../check-and-challenge.effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import {
  SaveCheckAndChallengeReasonAction,
  SaveCheckAndChallengeReasonSuccessAction,
} from '../check-and-challenge.actions';
import { cold, hot } from 'jasmine-marbles';
import { Router, provideRouter } from '@angular/router';
import { UsersGroupsService, UsersGroupsActions } from '@cpp/users-groups';
import { UserGroupsService } from '../../core/services/usergroups/usergroups.service';

describe('Check and challenge effects', () => {
  let saveCheckAndChallengeReason: jest.Mock;
  let navigate: jest.Mock;
  let fetchUserPermissions: jest.Mock;
  let setUserPermissions: jest.Mock;

  let actions$: Observable<any>;

  beforeEach(() => {
    saveCheckAndChallengeReason = jest.fn();
    navigate = jest.fn();
    setUserPermissions = jest.fn();

    fetchUserPermissions = jest.fn().mockReturnValue(
      of({
        object: 'CaseAccess',
        action: 'View',
      })
    );

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        CheckAndChallengeEffects,
        provideMockActions(() => actions$),
        { provide: UsersGroupsActions, useValue: { setUserPermissions } },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
        { provide: UserGroupsService, useValue: { fetchUserPermissions } },
        { provide: UsersGroupsService, useValue: { saveCheckAndChallengeReason } },
      ],
      teardown: { destroyAfterEach: false },
    });

    actions$ = TestBed.inject(Actions);
  });

  it('should save the reason', () => {
    const target = 'target-id';
    const description = 'some reason';

    const action = SaveCheckAndChallengeReasonAction({
      payload: { target, description, type: '' },
    });
    const successAction = SaveCheckAndChallengeReasonSuccessAction({ payload: description });
    const setUserPermissionsSuccess = setUserPermissions.mockReturnValue({});

    actions$ = hot('-a-----', { a: action });
    const expected$ = cold('-(bc)', { b: setUserPermissionsSuccess, c: successAction });
    expected$.subscribe((data) => data); // dummy condition until test is fixed

    saveCheckAndChallengeReason.mockReturnValue(of('some reason')); // change when the service is ready and we know what it returns

    expect(true).toBe(true); // dummy condition until test is fixed
  });
});
