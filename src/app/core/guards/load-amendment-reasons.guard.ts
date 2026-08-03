import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { ERROR_ROUTE_PATHS } from '@cpp/application';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, mapTo, switchMap, take, tap } from 'rxjs/operators';
import { LoadAmendmentReasonsSuccessAction } from '../actions/hearing-reference-data';
import { AppState } from '../reducers';
import { getAmendmentReasons } from '../selectors/hearing-reference-data';
import { HearingService } from '../services/Hearing/hearing.service';

@Injectable()
export class LoadAmendmentReasonsGuard implements CanActivate {
  constructor(
    private store: Store<AppState>,
    private hearingService: HearingService,
    private router: Router
  ) {}

  hasAmendmentReasonsInStore() {
    return this.store.pipe(
      select(getAmendmentReasons),
      map(amendmentReasons => !!(amendmentReasons.length > 0)),
      take(1)
    );
  }

  hasAmendmentReasonsInApi() {
    return this.hearingService.getAmendmentReasons().pipe(
      tap(amendmentReasons =>
        this.store.dispatch(new LoadAmendmentReasonsSuccessAction(amendmentReasons))
      ),
      mapTo(true)
    );
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const { referenceDataErrorRedirectTo } = route.data as {
      referenceDataErrorRedirectTo?: string;
    };

    return this.hasAmendmentReasonsInStore().pipe(
      switchMap(hasInStore => (hasInStore ? of(true) : this.hasAmendmentReasonsInApi())),
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
