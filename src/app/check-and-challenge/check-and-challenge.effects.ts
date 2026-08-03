import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import {
  SaveCheckAndChallengeReasonAction,
  SaveCheckAndChallengeReasonSuccessAction
} from './check-and-challenge.actions';
import { Action } from '@ngrx/store';
import { UsersGroupsService, UsersGroupsActions } from '@cpp/users-groups';
import { UserGroupsService } from '../core/services/usergroups/usergroups.service';
import { Router } from '@angular/router';

@Injectable()
export class CheckAndChallengeEffects {
  saveCheckAndChallengeReason$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(SaveCheckAndChallengeReasonAction),
      switchMap(action => {
        return this.userGroupsService
          .saveCheckAndChallengeReason(action.payload.target, action.payload.description)
          .pipe(
            switchMap(() =>
              this.usersGroupsService.fetchUserPermissions().pipe(
                switchMap(({ groups: userGroups, permissions, switchableRoles }) => {
                  const successAction = SaveCheckAndChallengeReasonSuccessAction({
                    payload: action.payload.description
                  });
                  const updatePermissions = UsersGroupsActions.setUserPermissions({
                    userGroups,
                    permissions,
                    switchableRoles
                  });

                  return [updatePermissions, successAction];
                })
              )
            ),
            tap(() => {
              switch (action.payload.type) {
                case 'manage-hearing':
                  return this.router.navigate(['manage', action.payload.target]);
                case 'hearing-list':
                default:
                  return this.router.navigate(['list']);
              }
            })
          );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private router: Router,
    private userGroupsService: UserGroupsService,
    private usersGroupsService: UsersGroupsService
  ) {}
}
