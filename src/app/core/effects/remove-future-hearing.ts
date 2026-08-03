import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import * as FutureHearingsActions from '../actions/future-hearings';
import {
  RemoveFutureHearingsConfirmed,
  RemoveFutureHearingsSuccess
} from '../actions/future-hearings';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { FutureHearingsService } from '../services';
import { forkJoin, of } from 'rxjs';
import { ApiError } from '../actions';
import { RemoveFutureHearing } from '../model';
import { select, Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { getHearingId } from '../selectors';

@Injectable()
export class RemoveFutureHearingEffects {
  constructor(
    private store: Store<AppState>,
    private actions$: Actions,
    private router: Router,
    private service: FutureHearingsService
  ) {}

  removeFutureHearing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FutureHearingsActions.REMOVE_FUTURE_HEARINGS_CONFIRMED),
      switchMap((action: RemoveFutureHearingsConfirmed) => {
        return this.remove(action.removeFutureHearings).pipe(
          switchMap(() => this.navigate(action.removeFutureHearings)),
          map(() => new RemoveFutureHearingsSuccess()),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  remove(removeFutureHearings: RemoveFutureHearing[]) {
    return forkJoin(
      removeFutureHearings.map(hearing => {
        return this.service.removeFutureHearing(hearing);
      })
    );
  }

  navigate(removeFutureHearings: RemoveFutureHearing[]) {
    return this.store.pipe(
      select(getHearingId),
      take(1),
      map(hearingId => {
        const hearingIdsRemoved = removeFutureHearings
          .filter(h => !(h.offenceIds && h.offenceIds.length))
          .map(h => h.hearingId);

        return hearingIdsRemoved.includes(hearingId) || !hearingIdsRemoved.length
          ? '/'
          : `/manage/${hearingId}`;
      }),
      tap(navigatePath => {
        this.router.navigate([navigatePath]);
      })
    );
  }
}
