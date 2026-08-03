import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable, of, zip } from 'rxjs';
import { catchError, mapTo, switchMap, take, tap } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { getAlcoholLevelMethods, getMotReasons, getSentencingIndicatations } from '../selectors';

import {
  LoadAlcoholLevelMethodsSuccessAction,
  LoadMotReasonSuccessAction,
  LoadSentencingIndicationsSuccessAction
} from '../actions';
import { HearingService } from '../services/Hearing/hearing.service';
import { MotReason } from '../model/mot-reason';
import { SentencingIndication } from '../model/sentencing-indication';
import { ReferenceDataService } from '../services';
import { AlcoholLevelMethod } from '../model';

@Injectable()
export class EnterPleasGuard implements CanActivate {
  constructor(
    private router: Router,
    private hearingService: HearingService,
    private referenceDataService: ReferenceDataService,
    private store: Store<AppState>
  ) {}

  hasMotReasons(): Observable<MotReason[]> {
    return this.store.pipe(
      select(getMotReasons),
      take(1),
      switchMap(codes => {
        if (codes.length) {
          return of(codes);
        }
        return this.hasMotReasonInApi();
      })
    );
  }

  hasMotReasonInApi(): Observable<MotReason[]> {
    return this.hearingService
      .getMotReasons()
      .pipe(tap(codes => this.store.dispatch(new LoadMotReasonSuccessAction(codes))));
  }

  hasSentencingIndications(): Observable<SentencingIndication[]> {
    return this.store.pipe(
      select(getSentencingIndicatations),
      take(1),
      switchMap(codes => {
        if (codes.length) {
          return of(codes);
        }
        return this.hasSentencingIndicationsInApi();
      })
    );
  }

  hasSentencingIndicationsInApi(): Observable<SentencingIndication[]> {
    return this.hearingService
      .getSentencingIndications()
      .pipe(tap(codes => this.store.dispatch(new LoadSentencingIndicationsSuccessAction(codes))));
  }

  hasAlcoholLevelMethodsInApi(): Observable<AlcoholLevelMethod[]> {
    return this.referenceDataService.getAlcoholLevelMethod().pipe(
      tap(codes => {
        this.store.dispatch(new LoadAlcoholLevelMethodsSuccessAction(codes));
      })
    );
  }

  hasAlcoholLevelMethodsInStore(): Observable<AlcoholLevelMethod[]> {
    return this.store.pipe(
      select(getAlcoholLevelMethods),
      take(1),
      switchMap(codes => {
        if (codes && codes.length) {
          return of(codes);
        }
        return this.hasAlcoholLevelMethodsInApi();
      })
    );
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    return of(true).pipe(
      take(1),
      switchMap(() =>
        zip(
          this.hasMotReasons(),
          this.hasSentencingIndications(),
          this.hasAlcoholLevelMethodsInStore()
        )
      ),
      mapTo(true),
      catchError(e => {
        this.router.navigate(['/technical-error']);
        return of(false);
      })
    );
  }
}
