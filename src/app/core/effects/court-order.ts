import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { ApiError, setCourtApplication } from '../actions';
import * as CourtOrdersActions from '../actions/court-orders';
import {
  ClearCourtOrdersAction,
  CreateCourtOrdersAction,
  CreateCourtOrdersSuccessAction,
  LoadCourtOrdersAction,
  LoadCourtOrdersSuccessAction
} from '../actions/court-orders';
import { ProgressionService } from '../services/progression/progression.service';
import { CourtOrderService } from '../services';
import { AppState } from '../reducers';
import { Store } from '@ngrx/store';
import { getCourtOrdersQueryParams } from '../selectors/court-order';
import { ActiveCourtOrderByDefendantId, CourtOrdersQueryParams } from '../model/court-orders';
import * as HearingActions from '../actions/hearing';

@Injectable()
export class CourtOrderEffects {
  constructor(
    private actions$: Actions,
    private progressionService: ProgressionService,
    private courtOrderService: CourtOrderService,
    private store: Store<AppState>
  ) {}

  createCourtOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourtOrdersActions.CREATE_COURT_ORDERS),
      switchMap((action: CreateCourtOrdersAction) => {
        return this.progressionService.addBreachApplication(action.payload).pipe(
          switchMap(({ courtApplications }) => {
            return [
              new CreateCourtOrdersSuccessAction(),
              setCourtApplication({ courtApplications })
            ];
          }),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  loadCourtOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CourtOrdersActions.LOAD_COURT_ORDERS, HearingActions.UPDATE_PLEA_SUCCESS),
      withLatestFrom(this.store.select(getCourtOrdersQueryParams)),
      switchMap(
        ([_, { defendantIds, hearingDate, offenceDates }]: [
          LoadCourtOrdersAction,
          CourtOrdersQueryParams
        ]) => {
          if (!defendantIds.length) {
            return of(new ClearCourtOrdersAction());
          }

          return this.courtOrderService
            .getCourtOrdersByDefendantIdAndOffenceDate({ hearingDate, defendantIds, offenceDates })
            .pipe(
              map(
                (activeCourtOrders: ActiveCourtOrderByDefendantId) =>
                  new LoadCourtOrdersSuccessAction(activeCourtOrders)
              ),
              catchError(error => of(new ApiError(error)))
            );
        }
      )
    )
  );
}
