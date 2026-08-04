import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { getUserGroups, UserGroup } from '@cpp/users-groups';
import { select, Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { AppState } from '../../core';

@Injectable({ providedIn: 'root' })
export class CheckInGuard implements CanActivate {
  allowedUsers = ['defence users', 'advocates', 'cps', 'non cps prosecutors'];

  constructor(private router: Router, private store: Store<AppState>) {}

  canActivate() {
    return this.store.pipe(
      select(getUserGroups),
      take(1),
      map((userGroups) => this.resolveNavigation(this.includesAllowedUsers(userGroups)))
    );
  }

  includesAllowedUsers(userGroups: UserGroup[]): boolean {
    const userGroupsName = userGroups.map((ug) => ug.groupName.toLowerCase());
    return this.allowedUsers.some((user) => userGroupsName.includes(user));
  }

  resolveNavigation(isUserAllowed: boolean): boolean {
    if (!isUserAllowed) {
      this.router.navigate(['/unauthorised-access']);
    }
    return isUserAllowed;
  }
}
