import { Component, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { DraftResultActions, getManageHearingError, ResultsState } from '../results/core/store';
import { ManageHearingPublicEventError } from './manage-hearing-error-page.interfaces';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ManageHearingErrorPageComponent } from './manage-hearing-error-page.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'manage-hearing-error-page-container',
  template: `
    <manage-hearing-error-page
      [manageHearingError]="manageHearingError$ | async"
      [hearingId]="hearingId"
    ></manage-hearing-error-page>
  `,
  imports: [ManageHearingErrorPageComponent, AsyncPipe]
})
export class ManageHearingErrorPageContainer implements OnDestroy {
  // manageHearingError contains the hearingId but we get it from the route params
  // as it wont be available in the store if the user refreshes the page
  hearingId = this.route.snapshot.params['hearingId'];
  manageHearingError$: Observable<ManageHearingPublicEventError>;

  constructor(public store: Store<ResultsState>, private route: ActivatedRoute) {
    this.manageHearingError$ = this.store.pipe(select(getManageHearingError));
  }

  ngOnDestroy(): void {
    this.store.dispatch(DraftResultActions.removeManageHearingError());
  }
}
