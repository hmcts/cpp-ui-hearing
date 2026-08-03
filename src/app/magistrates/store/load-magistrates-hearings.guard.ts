import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CanActivate, Router } from '@angular/router';

import { AppState } from '../../core/reducers';
import { HearingService } from '../../core/services/Hearing/hearing.service';
import { LoadMagistratesHearingListSuccessAction } from './magistrates-hearing.action';

import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable()
export class LoadMagistratesHearingGuard implements CanActivate {
  constructor(
    private router: Router,
    private hearingService: HearingService,
    private store: Store<AppState>
  ) {}

  canActivate(): Observable<boolean> {
    return this.hearingService.getHearingsForToday().pipe(
      map(hearings => new LoadMagistratesHearingListSuccessAction(hearings)),
      tap(action => this.store.dispatch(action)),
      map(Boolean),
      catchError(() => {
        this.router.navigate(['/technical-error']);
        return of(false);
      })
    );
  }
}
