import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { filter, map, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import {
  SetSelectedHearingDateAction,
  SET_SELECTED_HEARING_DATE,
  currentHearingIsBoxHearing,
  getFirstSharedDate
} from '../../../core';
import { ResultsService } from '../services/results.service';
import { DraftResultActions, getDraftResult, ResultsState } from '../store';

// Selecting a hearing day should update the url and hence refreshing of draft
// result is always driven by the guards, instead of in both guards and
// effects/components as it is now. This effect patches the refresh of draft
// result when the selected hearing day changes.

const REGEX_TO_MATCH_MANAGE_HEARING = /^\/manage\/[^\/]*$/;
const REGEX_TO_MATCH_ENTER_RESULTS = /^\/manage\/.*\/enter-results?[^/]*$/;

@Injectable({ providedIn: 'root' })
export class HearingDayEffects {
  constructor(
    private actions$: Actions,
    private resultService: ResultsService,
    private router: Router,
    private store: Store<ResultsState>
  ) {}

  private navigationEndEvents$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd)
  );

  reloadHearingOnSelectedDayChanged$ = createEffect(() =>
    this.navigationEndEvents$.pipe(
      filter(
        event =>
          REGEX_TO_MATCH_MANAGE_HEARING.test(event.urlAfterRedirects) ||
          REGEX_TO_MATCH_ENTER_RESULTS.test(event.urlAfterRedirects)
      ),
      switchMap(() =>
        this.actions$.pipe(
          ofType<SetSelectedHearingDateAction>(SET_SELECTED_HEARING_DATE),
          withLatestFrom(
            this.store.pipe(select(getDraftResult)),
            this.store.pipe(select(currentHearingIsBoxHearing)),
            this.store.pipe(select(getFirstSharedDate))
          ),
          switchMap(
            ([{ payload: selectedHearingDate }, { hearingId }, isBoxwork, firstSharedDate]) =>
              this.resultService.fetchExtendedDraftResult(
                hearingId,
                selectedHearingDate,
                isBoxwork,
                firstSharedDate
              )
          ),
          map(draftResult => DraftResultActions.setDraftResult({ draftResult })),
          takeUntil(this.navigationEndEvents$)
        )
      )
    )
  );
}
