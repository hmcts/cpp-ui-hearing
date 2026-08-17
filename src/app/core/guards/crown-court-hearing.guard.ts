import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { isTierAndListTypeApplicable } from '../selectors';

/**
 * Guards routes that only exist for Crown Court hearings. Reaching one from a
 * magistrates' or youth hearing means the URL was hand-edited or bookmarked, so
 * the route is treated as not existing rather than as a permissions failure.
 */
@Injectable()
export class CrownCourtHearingGuard implements CanActivate {
  constructor(private router: Router, private store: Store<AppState>) {}

  canActivate(): Observable<boolean> {
    return this.store.select(isTierAndListTypeApplicable).pipe(
      take(1),
      switchMap(isCrownCourtHearing => {
        if (!isCrownCourtHearing) {
          this.router.navigate(['/page-not-found']);
        }
        return of(isCrownCourtHearing);
      }),
      catchError(() => {
        this.router.navigate(['/technical-error']);
        return of(false);
      })
    );
  }
}
