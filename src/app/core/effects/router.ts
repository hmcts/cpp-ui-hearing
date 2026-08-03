import { map, tap, withLatestFrom } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as ApiActions from '../actions/api';
import { ApiError } from '../actions';
import { select, Store } from '@ngrx/store';
import { AppState } from '..';
import { getCurrentUrl } from '../selectors/app';
import { ErrorRouteState } from '@cpp/application';
import { Injectable } from '@angular/core';

@Injectable()
export class RouterEffects {
  navigateApiError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ApiActions.API_ERROR),
        withLatestFrom(this.store.pipe(select(getCurrentUrl))),
        map(([{ response }, currentUrl]: [ApiError, string]): ErrorRouteState => {
          const state = {
            redirectUrl: `/hearing${currentUrl}`
          } as ErrorRouteState;

          switch (response.status) {
            case 0:
              return {
                ...state,
                errorPath: '/timed-out-error'
              };
            case 403:
              return {
                ...state,
                errorPath: '/unauthorised-access'
              };
            case 404:
              return {
                ...state,
                errorPath: '/page-not-found'
              };
            case 401:
              return {
                ...state,
                errorPath: '/signed-out-error'
              };
            default:
              return {
                ...state,
                errorPath: '/technical-error'
              };
          }
        }),
        tap(state => this.router.navigate([state.errorPath], { state }))
      ),
    { dispatch: false }
  );

  constructor(private actions$: Actions, private router: Router, private store: Store<AppState>) {}
}
