import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { AppState } from '../reducers';
import { isCrownCourt } from '../selectors';

@Injectable({ providedIn: 'root' })
export class CrownCourtOnlyGuard implements CanActivate {
  constructor(private router: Router, private store: Store<AppState>) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const hearingId = route.params['hearingId'];

    return this.store.select(isCrownCourt).pipe(
      take(1),
      tap(crownCourt => !crownCourt && this.router.navigate(['/manage', hearingId]))
    );
  }
}
