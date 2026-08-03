import { Injectable, Inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest } from 'rxjs';
import { tap, take, switchMap, map, filter } from 'rxjs/operators';
import { AppState } from '../reducers/index';
import {
  getUserHasPermission,
  RolePermission,
  getUserDetails,
  PermissionOperator
} from '@cpp/users-groups';
import { findCourCentres } from '../selectors/reference-data';
import { getUserCourtCentreOuCodes } from '../selectors/user-groups';
import { getCurrentHearing, getCurrentCaseIds } from '../selectors/hearing';
import { HearingDetail } from '../model/hearing-detail';
import {
  EXPECTED_HEARING_USER_PERMISSIONS,
  HearingUserPermissions
} from '../../config/user-permissions';

@Injectable()
export class HearingGuard implements CanActivate {
  constructor(
    private router: Router,
    private store: Store<AppState>,
    @Inject(EXPECTED_HEARING_USER_PERMISSIONS) public expectedPermissions: HearingUserPermissions
  ) {}

  userHasPermissionToHearing(hearingId: string): Observable<boolean> {
    const userCourtCentreOuCodes$ = this.store.select(getUserCourtCentreOuCodes);
    const userCourtCentres$ = userCourtCentreOuCodes$.pipe(
      switchMap(ouCodes => this.store.select(findCourCentres(...ouCodes)))
    );
    const courtCentreIds$ = userCourtCentres$.pipe(
      map(courtCentres => courtCentres.map(({ id }) => id))
    );

    const inWorkingArea$ = combineLatest([
      this.store.select(getCurrentHearing),
      courtCentreIds$
    ]).pipe(
      filter(([currentHearing]) => !!currentHearing),
      map(([currentHearing, courtCentreIds]) =>
        courtCentreIds.includes((<HearingDetail>currentHearing).courtCentre.id)
      )
    );

    const userHashearingPermission$ = this.store.select(getUserDetails).pipe(
      filter(userDetails => !!userDetails),
      switchMap(({ userId }) => {
        const viewHearingPermission = {
          ...this.expectedPermissions.viewHearing,
          target: hearingId,
          source: userId
        } as RolePermission;
        return this.store.select(getUserHasPermission([viewHearingPermission]));
      })
    );

    const userHasCasePermission$ = combineLatest([
      this.store.select(getUserDetails),
      this.store.select(getCurrentCaseIds)
    ]).pipe(
      filter(([userDetails]) => !!userDetails),
      switchMap(([{ userId }, caseIds]) => {
        const permissionChecks = caseIds.map(caseId => {
          return {
            ...this.expectedPermissions.viewHearing,
            target: caseId,
            source: userId
          } as RolePermission;
        });
        return this.store.select(getUserHasPermission(permissionChecks, PermissionOperator.or));
      })
    );

    return combineLatest([
      inWorkingArea$,
      userHashearingPermission$,
      userHasCasePermission$,
      userCourtCentreOuCodes$
    ]).pipe(
      map(
        ([
          inWorkingArea,
          userHashearingPermission,
          userHasCasePermission,
          userCourtCentreOuCodes
        ]) =>
          inWorkingArea ||
          userHashearingPermission ||
          userHasCasePermission ||
          userCourtCentreOuCodes.length === 0
      ),
      take(1)
    );
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const hearingId = route.params['hearingId'];
    const { hearingGuardRouteId } = route.data as {
      hearingGuardRouteId: string;
    };
    return this.userHasPermissionToHearing(hearingId).pipe(
      tap(
        userHasAccessToHearing =>
          !userHasAccessToHearing &&
          this.router.navigate(['check-and-challenge', hearingId, hearingGuardRouteId])
      )
    );
  }
}
