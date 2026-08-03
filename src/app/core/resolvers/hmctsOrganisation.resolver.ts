import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { ApiError, UserGroupsService } from '../../core';
import { getUserDetails } from '@cpp/users-groups';

enum OrganisationType {
  HMCTS = 'HMCTS',
  CPS = 'CPS',
  POLICE = 'POLICE'
}

export const hmctsOrganisationResolver: ResolveFn<boolean> = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const userGroupsService = inject(UserGroupsService);
  const store = inject(Store);

  return store.pipe(
    select(getUserDetails),
    take(1),
    switchMap(loggedInUserDetails =>
      userGroupsService.getOrganisationDetails(loggedInUserDetails.organisationId).pipe(
        map(
          organsationDetails =>
            organsationDetails && organsationDetails.organisationType === OrganisationType.HMCTS
        ),
        catchError(error => {
          store.dispatch(new ApiError({ error }));
          return of(false);
        })
      )
    )
  );
};
