import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, mapTo, switchMap, take, tap } from 'rxjs/operators';
import { LoadDefendantsTrackingStatusSuccessAction } from '../actions/hearing';
import { AppState } from '../reducers';
import { getDefendantIdsFromCurrentHearing } from '../selectors/hearing';
import { HearingService } from '../services/Hearing/hearing.service';

@Injectable()
export class LoadDefendantsTrackingStatusGuard implements CanActivate {
  constructor(
    private router: Router,
    private hearingService: HearingService,
    private store: Store<AppState>
  ) {}

  hasDefendantsTrackingStatusInApi(): Observable<boolean> {
    return this.store.select(getDefendantIdsFromCurrentHearing).pipe(
      switchMap(defendantIds => {
        if (defendantIds.length) {
          return this.hearingService.getDefendantsTrackingStatus(defendantIds).pipe(
            tap(defendantsTrackingStatus =>
              this.store.dispatch(
                new LoadDefendantsTrackingStatusSuccessAction(defendantsTrackingStatus)
              )
            ),
            mapTo(true)
          );
        } else {
          return of(true);
        }
      })
    );
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return of(true).pipe(
      take(1),
      switchMap(() => this.hasDefendantsTrackingStatusInApi()),
      mapTo(true),
      catchError(e => {
        this.router.navigate(['/technical-error']);
        return of(false);
      })
    );
  }
}
