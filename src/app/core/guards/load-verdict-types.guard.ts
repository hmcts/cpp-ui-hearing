import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { ERROR_ROUTE_PATHS } from '@cpp/application';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, mapTo, switchMap, take, tap } from 'rxjs/operators';
import { LoadVerdictsTypesSuccessAction } from '../actions/hearing-reference-data';
import { AppState } from '../reducers';
import { getVerdictTypes } from '../selectors/hearing-reference-data';
import { HearingService } from '../services/Hearing/hearing.service';

@Injectable()
export class LoadVerdictTypesGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private hearingService: HearingService,
    private router: Router
  ) {}

  hasVerdictTypesInStore() {
    return this.store.pipe(
      select(getVerdictTypes),
      map(verdictTypes => !!(verdictTypes.length > 0)),
      take(1)
    );
  }

  hasVerdictTypesInApi() {
    return this.hearingService.getVerdictTypes().pipe(
      tap(verdictsTypes => this.store.dispatch(new LoadVerdictsTypesSuccessAction(verdictsTypes))),
      mapTo(true)
    );
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const { referenceDataErrorRedirectTo } = route.data as {
      referenceDataErrorRedirectTo?: string;
    };

    return this.hasVerdictTypesInStore().pipe(
      switchMap(hasInStore => (hasInStore ? of(true) : this.hasVerdictTypesInApi())),
      tap({
        error: () => {
          if (referenceDataErrorRedirectTo) {
            this.router.navigateByUrl(referenceDataErrorRedirectTo);
          } else {
            this.router.navigate([ERROR_ROUTE_PATHS.technicalError]);
          }
        }
      }),
      catchError(() => of(false))
    );
  }
}
