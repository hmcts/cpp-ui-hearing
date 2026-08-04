import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { forkJoin, of } from 'rxjs';
import { catchError, mapTo, switchMap, take, tap } from 'rxjs/operators';
import { getSelectedHearingDate } from '../../../core';
import { ReusableInfoRemoteCacheService } from '../services/reusable-info-remote-cache.service';
import { ResultsState, DraftResultActions } from '../store';

export interface ExtendedDraftResultGuardParams {
  hearingId: string;
}

// This guard is not strictly necessary as the reusable info is fetched on
// demand when creating result lines. However, it can be added to the
// front-loading of a page (while other requests are also taking place) to avoid
// having an extra asynchronous action take place after the page has already
// loaded.

@Injectable({ providedIn: 'root' })
export class ReusableInfoGuard implements CanActivate {
  constructor(
    private reusableInfoRemoteCacheService: ReusableInfoRemoteCacheService,
    private router: Router,
    private store: Store<ResultsState>
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const parentParams = route.parent?.params || {};
    const currentParams = route.params;
    const { hearingId } = { ...parentParams, ...currentParams };

    return this.store.pipe(
      select(getSelectedHearingDate),
      take(1),
      switchMap((orderedDate) =>
        forkJoin([
          this.reusableInfoRemoteCacheService.fetchResuableInfoDefinitions(orderedDate),
          this.reusableInfoRemoteCacheService.fetchReusableInfo(hearingId).pipe(
            tap((reusableInfo) =>
              this.store.dispatch(
                DraftResultActions.setReusableInfoSuccess({
                  reusableResults: reusableInfo.reusablePrompts,
                })
              )
            )
          ),
        ])
      ),
      mapTo(true),
      tap({
        error: () => {
          this.router.navigate(['/technical-error']);
        },
      }),
      catchError(() => of(false))
    );
  }
}
