import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import {
  ApiError,
  currentHearingIsBoxHearing,
  getFirstSharedDate,
  getSelectedHearingDate
} from '../../../core';
import { ResultsService } from '../services/results.service';
import {
  DraftResultActions,
  getDraftResult,
  ResultsState,
  ResultsValidationActions
} from '../store';

export interface ExtendedDraftResultGuardParams {
  hearingId: string;
}

@Injectable({ providedIn: 'root' })
export class ExtendedDraftResultGuard implements CanActivate {
  constructor(
    private resultsService: ResultsService,
    private store: Store<ResultsState>,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const { hearingId } = route.params as ExtendedDraftResultGuardParams;
    // Skip re-validation when we've just navigated here from a validated
    // save (e.g. EnterResultsContainer's Save & Continue), which already
    // called ResultsValidationService.validate for this draft result.
    const skipResultsValidation =
      this.router.getCurrentNavigation()?.extras?.state?.skipResultsValidation === true;
    // // In Angular 19, we need to look up the route tree to find the hearingId param
    // // which is defined in a parent route
    // let hearingId = route.params['hearingId'];
    // let currentRoute = route;
    // while (!hearingId && currentRoute.parent) {
    //   currentRoute = currentRoute.parent;
    //   hearingId = currentRoute.params['hearingId'];
    // }

    // if (!hearingId) {
    //   return of(false);
    // }

    return this.store.pipe(
      select(getSelectedHearingDate),
      take(1),
      withLatestFrom(
        this.store.pipe(select(getDraftResult)),
        this.store.pipe(select(currentHearingIsBoxHearing)),
        this.store.pipe(select(getFirstSharedDate))
      ),
      switchMap(([hearingDay, draftResultFromStore, isBoxwork, firstSharedDate]) => {
        if (
          draftResultFromStore &&
          draftResultFromStore.hearingId === hearingId &&
          draftResultFromStore.hearingDay === hearingDay
        ) {
          if (!skipResultsValidation) {
            this.store.dispatch(
              ResultsValidationActions.validateResults({ navigateOnSuccess: false })
            );
          }
          return of(draftResultFromStore);
        }
        return this.resultsService
          .fetchExtendedDraftResult(hearingId, hearingDay, isBoxwork, firstSharedDate)
          .pipe(
            tap({
              next: draftResult => {
                this.store.dispatch(DraftResultActions.setDraftResult({ draftResult }));
              }
            })
          );
      }),
      map(() => true),
      catchError(error => {
        this.store.dispatch(new ApiError(error));
        return of(false);
      })
    );
  }
}
