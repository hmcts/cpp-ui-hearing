import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { caseStatus, getCurrentHearing } from '../../core';
import {
  DraftResultActions,
  getDraftResult,
  getInvalidResultLines,
  ResultsState
} from '../core/store';
import { CopyDraftResultsTarget } from '../results.interfaces';
import { canAmendApplication } from '../../core/selectors/user-groups';
import { CopyResultsComponent } from './copy-results.component';
import { AsyncPipe } from '@angular/common';

@Component({
  template: `
    <copy-results
      [copyFromTargetId]="copyFromTargetId"
      [draftResult]="draftResult$ | async"
      [hearing]="hearing$ | async"
      [invalidResultLines]="invalidResultLines$ | async"
      [amendApplicationPermission]="isAmendApplicationPermission$ | async"
      [caseStatus]="caseStatus$ | async"
      (copyResults)="handleCopyResults($event)"
    >
    </copy-results>
  `,
  imports: [CopyResultsComponent, AsyncPipe]
})
export class CopyResultsContainerComponent implements OnDestroy {
  copyFromTargetId = this.route.snapshot.paramMap.get('targetId');
  draftResult$ = this.store.pipe(select(getDraftResult));
  hearing$ = this.store.pipe(select(getCurrentHearing));
  invalidResultLines$ = this.store.pipe(select(getInvalidResultLines));
  isAmendApplicationPermission$ = this.store.pipe(select(canAmendApplication));
  caseStatus$ = this.store.pipe(select(caseStatus));

  constructor(private store: Store<ResultsState>, private route: ActivatedRoute) {}

  handleCopyResults(copyTargets: CopyDraftResultsTarget[]): void {
    this.store.dispatch(DraftResultActions.clearDraftResultLineErrors());
    this.store.dispatch(DraftResultActions.copyDraftResultLines({ copyTargets }));
  }

  ngOnDestroy(): void {
    this.store.dispatch(DraftResultActions.clearDraftResultLineErrors());
  }
}
