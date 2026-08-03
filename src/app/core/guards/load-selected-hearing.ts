import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router } from '@angular/router';
import { getUserDetails } from '@cpp/users-groups';
import { Store } from '@ngrx/store';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { catchError, map, mapTo, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import {
  LoadAmendingUserDetailsSuccessAction,
  LoadHearingDetailSuccessAction,
  SetSelectedHearingDateAction
} from '../actions';
import { HearingLockState } from '../model/hearing-detail';
import { AppState } from '../reducers';
import { getSelectedHearingDate } from '../selectors/hearing';
import { HearingService } from '../services';
import { getFlattenedParams } from '../utils/utils';
import { ReferenceDataService } from '@cpp/reference-data';

@Injectable()
export class LoadSelectedHearingGuard implements CanActivate, CanActivateChild {
  constructor(
    private store: Store<AppState>,
    private hearingService: HearingService,
    private refDataService: ReferenceDataService,
    private router: Router
  ) {}

  canLoadSelectedHearing(id: string): Observable<boolean> {
    return of(null).pipe(
      switchMap(() => {
        return this.hearingService.getHearing(id).pipe(
          withLatestFrom(this.store.select(getUserDetails)),
          switchMap(([hearing, userDetails]) => {
            if (
              hearing.hearingState !== HearingLockState.INITIALISED &&
              hearing.hearingState !== HearingLockState.SHARED &&
              userDetails.userId !== hearing.amendedByUserId
            ) {
              return this.hearingService.getUserDetails(hearing.amendedByUserId).pipe(
                tap(amendedByUserDetails =>
                  this.store.dispatch(
                    new LoadAmendingUserDetailsSuccessAction(amendedByUserDetails)
                  )
                ),
                mapTo(hearing)
              );
            }
            return of(hearing);
          }),
          switchMap(hearing => {
            if (!!hearing.hearing.judiciary.length) {
              const ids = hearing.hearing.judiciary
                .map(judiciary => judiciary.judicialId)
                .join(',');
              return this.refDataService.fetchJudicialMembers({ ids }).pipe(
                map(judiciaries => {
                  hearing.hearing.judiciary.forEach(judiciary => {
                    judiciary.judicialMember = judiciaries.find(
                      incoming => incoming.id === judiciary.judicialId
                    );
                  });
                  return hearing;
                })
              );
            }
            return of(hearing);
          }),
          tap(hearing => this.store.dispatch(new LoadHearingDetailSuccessAction(hearing)))
        );
      }),
      withLatestFrom(this.store.select(getSelectedHearingDate), (hearing, hearingDay) => {
        return hearingDay || moment(hearing.hearing.hearingDays[0].sittingDay).format('YYYY-MM-DD');
      }),
      tap(hearingDay => this.store.dispatch(new SetSelectedHearingDateAction(hearingDay))),
      mapTo(true),
      catchError(error => {
        switch (error.status) {
          case 403:
            this.router.navigate(['/unauthorised-access']);
            break;
          case 404:
            this.router.navigate(['/page-not-found']);
            break;
          default:
            this.router.navigate(['/technical-error']);
            break;
        }
        return of(false);
      })
    );
  }

  canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.canActivate(route);
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const { hearingId } = getFlattenedParams(route);
    if (hearingId) {
      return this.canLoadSelectedHearing(hearingId);
    }
    return of(false);
  }
}
