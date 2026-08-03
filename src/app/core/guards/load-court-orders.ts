import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, mapTo, tap, filter, take, switchMap } from 'rxjs/operators';
import { ClearCourtOrdersAction, LoadCourtOrdersSuccessAction } from '../actions/court-orders';
import { ActiveCourtOrderByDefendantId, CourtOrdersQueryParams } from '../model/court-orders';
import { AppState } from '../reducers';
import { getCourtOrdersQueryParams } from '../selectors/court-order';
import { CourtOrderService } from '../services/court-order/court-order.service';

@Injectable()
export class LoadCourtOrdersGuard implements CanActivate, CanActivateChild {
  constructor(
    private store: Store<AppState>,
    private courtOrderService: CourtOrderService,
    private router: Router
  ) {}

  canLoadCourtOrders(): Observable<boolean> {
    return this.store.select(getCourtOrdersQueryParams).pipe(
      filter(params => !!params.hearingDate),
      take(1),
      switchMap(({ defendantIds, hearingDate, offenceDates }: CourtOrdersQueryParams) => {
        if (!defendantIds.length) {
          this.store.dispatch(new ClearCourtOrdersAction());
          return of(true);
        }
        return this.courtOrderService
          .getCourtOrdersByDefendantIdAndOffenceDate({ hearingDate, defendantIds, offenceDates })
          .pipe(
            tap((courtOrders: ActiveCourtOrderByDefendantId) =>
              this.store.dispatch(new LoadCourtOrdersSuccessAction(courtOrders))
            ),
            mapTo(true)
          );
      })
    );
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return this.canLoadCourtOrders().pipe(
      catchError(() => {
        this.router.navigate(['/technical-error']);
        return of(false);
      })
    );
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot): Observable<boolean> {
    return this.canActivate(childRoute);
  }
}
