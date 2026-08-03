import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, mapTo, switchMap, tap } from 'rxjs/operators';
import { AppState } from '../../../../core';
import {
  loadHearingSlotsSuccess,
  loadListingNotes,
  resetHearingSlots,
  SchedulingService,
  SearchHearingSlotsParams
} from '@cpp/scheduling';

export interface AllocationQueryParams extends Params {
  mf?: string;
}

export interface AllocationSnapshot extends ActivatedRouteSnapshot {
  queryParams: AllocationQueryParams;
}

@Injectable()
export class AllocationGuard implements CanActivate {
  constructor(
    private router: Router,
    private store: Store<AppState>,
    private scheduling: SchedulingService
  ) {}

  searchWithParams({ ...params }: SearchHearingSlotsParams) {
    const searchParams = {
      ...params,
      pageSize: 10
    };
    return this.scheduling.searchHearingSlots(searchParams).pipe(
      tap(result => {
        this.store.dispatch(
          loadHearingSlotsSuccess({
            params: searchParams,
            hearingSlots: result.hearingSlots,
            totalResults: result.totalResults
          })
        );
        this.store.dispatch(loadListingNotes({ notes: result.notes }));
      }),
      mapTo(true)
    );
  }

  canActivate(snapshot: AllocationSnapshot) {
    return of(snapshot.queryParams).pipe(
      switchMap(queryParams => {
        const { mf } = queryParams as AllocationQueryParams;
        if (mf) {
          return this.searchWithParams(JSON.parse(mf));
        }
        return of(true).pipe(
          tap(() => {
            this.store.dispatch(resetHearingSlots());
          })
        );
      }),
      catchError(() => of(false)),
      tap(canActivate => {
        if (!canActivate) {
          this.store.dispatch(resetHearingSlots());
          this.router.navigate(['/technical-error']);
        }
      })
    );
  }
}
