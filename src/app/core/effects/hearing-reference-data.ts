import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import {
  ApiError,
  LoadCourtAplicationOutcomeTypesSuccessAction,
  LoadCourtAplicationResponseTypesSuccessAction,
  LoadVerdictsTypesAction,
  LoadVerdictsTypesSuccessAction
} from '../actions';
import * as ReferenceDataActions from '../actions/hearing-reference-data';
import { CourtApplicationResponseType } from '../model';
import { CourtApplicationOutcomeType } from '../model/court-application-outcome-type';
import { AppState } from '../reducers';
import { getAmendmentReasons, getCurrentApplicationTypeIds, getVerdictTypes } from '../selectors';
import { HearingService } from '../services/Hearing/hearing.service';

@Injectable()
export class HearingReferenceDataEffects {
  getVerdictsTypes$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenceDataActions.LOAD_VERDICT_TYPES),
      withLatestFrom(this.store.select(getVerdictTypes)),
      map(([action, verdictTypes]) => !(verdictTypes.length > 0) && action),
      filter(v => !!v),
      switchMap((action: LoadVerdictsTypesAction) => {
        return this.hearingService.getVerdictTypes().pipe(
          map(verdictsTypes => new LoadVerdictsTypesSuccessAction(verdictsTypes)),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  loadAmendmentReasons$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenceDataActions.LOAD_AMENDMENT_REASONS),
      withLatestFrom(this.store.select(getAmendmentReasons)),
      map(([action, amendmentReasons]) => !(amendmentReasons.length > 0) && action),
      filter(v => !!v),
      switchMap((action: ReferenceDataActions.LoadAmendmentReasonsAction) => {
        return this.hearingService.getAmendmentReasons().pipe(
          map(
            amendmentReasons =>
              new ReferenceDataActions.LoadAmendmentReasonsSuccessAction(amendmentReasons)
          ),
          catchError(err => of(new ApiError(err)))
        );
      })
    )
  );

  loadCourtApplicationOutcomeTypes$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenceDataActions.LOAD_COURT_APPLICATION_OUTCOME_TYPES),
      withLatestFrom(this.store.select(getCurrentApplicationTypeIds)),
      switchMap(([action, applicationTypeIds]) => {
        const observableArray = applicationTypeIds.map(applicationTypeId =>
          this.hearingService.getApplicationOutcomeTypes(applicationTypeId)
        );
        return forkJoin([...observableArray]).pipe(
          map(values => {
            const payload: Record<string, CourtApplicationOutcomeType[]> = {};
            applicationTypeIds.forEach((id, index) => {
              payload[id] = values[index];
            });

            return new LoadCourtAplicationOutcomeTypesSuccessAction(payload);
          }),
          catchError(err => of(new ApiError(err)))
        );
      })
    )
  );

  loadCourtApplicationResponseTypes$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(ReferenceDataActions.LOAD_COURT_APPLICATION_RESPONSE_TYPES),
      withLatestFrom(this.store.select(getCurrentApplicationTypeIds)),
      switchMap(([action, applicationTypeIds]) => {
        const observableArray = applicationTypeIds.map(applicationTypeId =>
          this.hearingService.getApplicationResponseTypes(applicationTypeId)
        );
        return forkJoin([...observableArray]).pipe(
          map(values => {
            const payload: Record<string, CourtApplicationResponseType[]> = {};
            applicationTypeIds.forEach((id, index) => {
              payload[id] = values[index];
            });

            return new LoadCourtAplicationResponseTypesSuccessAction(payload);
          }),
          catchError(err => of(new ApiError(err)))
        );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private hearingService: HearingService,
    private store: Store<AppState>
  ) {}
}
