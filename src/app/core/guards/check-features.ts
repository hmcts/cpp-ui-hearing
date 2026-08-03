import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, CanActivateChild } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { getFeatures } from '../selectors/features';

@Injectable()
export class CheckFeaturesGuard implements CanActivate, CanActivateChild {
  constructor(private router: Router, private store: Store<AppState>) {}

  getFeaturesFromStore(): Observable<string[]> {
    return this.store.select(getFeatures).pipe(take(1));
  }

  includesAllowedFeatures(allFeatures: string[] = [], allowedFeatures: string[] = []): boolean {
    return allowedFeatures.some(feature => allFeatures.includes(feature));
  }

  resolveNavigation(canActivate: boolean): Observable<boolean> {
    if (!canActivate) {
      this.router.navigate(['/unauthorised-access']);
    }
    return of(canActivate);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot): Observable<boolean> {
    return this.canActivate(childRoute);
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const allowedFeatures = route.data.allowedFeatures as string[];
    return this.getFeaturesFromStore().pipe(
      switchMap(featuresFromStore => {
        if (!!featuresFromStore) {
          return this.resolveNavigation(
            this.includesAllowedFeatures(featuresFromStore, allowedFeatures)
          );
        }
        return this.resolveNavigation(false);
      }),
      catchError(() => this.resolveNavigation(false))
    );
  }
}
