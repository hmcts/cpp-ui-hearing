import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { mapTo, switchMap, take, tap } from 'rxjs/operators';
import { FutureHearingsService } from '../services';
import { AppState } from '../reducers';
import { select, Store } from '@ngrx/store';
import { FutureHearingsLoaded } from '../actions';
import { getCaseIdsForHearing } from '../selectors';

@Injectable()
export class LoadFutureHearingsGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private futureHearingsService: FutureHearingsService
  ) {}

  getFutureHearingForCases() {
    return this.store.pipe(
      select(getCaseIdsForHearing),
      take(1),
      switchMap(caseIds => {
        if (caseIds && caseIds.length) {
          return this.futureHearingsService.getFutureHearingForCases(caseIds).pipe(
            tap(futureHearings => this.store.dispatch(new FutureHearingsLoaded(futureHearings))),
            mapTo(true)
          );
        } else {
          return of(true);
        }
      })
    );
  }

  canActivate(): Observable<boolean> {
    return this.getFutureHearingForCases();
  }
}
