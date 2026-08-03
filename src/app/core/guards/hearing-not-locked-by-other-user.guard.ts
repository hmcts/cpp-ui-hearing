import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { getIsHearingLockedBySomeoneElse } from '../selectors';

@Injectable()
export class HearingNotLockedByOtherUserGuard implements CanActivate {
  constructor(private router: Router, private store: Store<AppState>) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.store.select(getIsHearingLockedBySomeoneElse).pipe(
      switchMap(isHearingLockedBySomeoneElse => {
        if (isHearingLockedBySomeoneElse) {
          this.router.navigate(['/unauthorised-access']);
        }
        return of(!isHearingLockedBySomeoneElse);
      }),
      catchError(() => {
        this.router.navigate(['/technical-error']);
        return of(false);
      })
    );
  }
}
