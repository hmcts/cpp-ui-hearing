import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AppState } from '../../core/reducers';
import { getHasFutureHearings } from '../../core/selectors';
import { take, tap } from 'rxjs/operators';

@Injectable()
export class CheckFutureHearingsGuard implements CanActivate {
  constructor(private store: Store<AppState>, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const hearingId = route.params['hearingId'];
    return this.store.pipe(
      select(getHasFutureHearings),
      take(1),
      tap(hasFutureHearings => {
        if (!hasFutureHearings) {
          this.router.navigate(['manage', hearingId]);
        }
      })
    );
  }
}
