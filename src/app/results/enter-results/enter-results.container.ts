import { Component } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { CPPDate, getCPPDate, getCurrentHearing } from '../../core';
import {
  caseStatus,
  currentHearingIsBoxHearing,
  getElectronicMonitoringOffences,
  getFirstSharedDate,
  getSelectedHearingOrderedDate,
  getUniquElectronicMonitoringAndWarrantOfArrestOffences,
  getWarrantOfArrestOffences,
  isCurrentHearingStandaloneBoxworkApplication,
  isSelectedHearingInFuture
} from '../../core/selectors/hearing';
import {
  DraftResultActions,
  getDelegatedPowers,
  getDraftResultError,
  getDraftResultPromptsValid,
  getDraftResultReadOnly,
  getDraftResultSaving,
  getProsecutortobenotified,
  getResultLinesGroupedByTargetId,
  getResultsValidationErrorMessagesByOffenceId,
  getResultsValidationSummaryErrors,
  getShadowListedOffenceIds,
  getSharedTargetIds,
  isExParteCivilCase,
  ResultsState,
  ResultsValidationActions
} from '../core/store';
import { ParseTextValue } from './draft-result/draft-result-body.component';
import { DelegatedPowersValue, EnterResultsComponent } from './offence-conditions.component';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { canAmendApplication, hasResultingAssistant } from '../../core/selectors/user-groups';
import { AsyncPipe } from '@angular/common';

@Component({
  template: `
    <cpp-enter-results
      [isSelectedHearingInFuture]="isSelectedHearingInFuture$ | async"
      [delegatedPowers]="delegatedPowers$ | async"
      [draftResultError]="draftResultError$ | async"
      [draftResultPromptsValid]="draftResultPromptsValid$ | async"
      [draftResultRelations]="draftResultRelations$ | async"
      [draftResultSaving]="draftResultSaving$ | async"
      [hearing]="hearing$ | async"
      [readonly]="readonly$ | async"
      [shadowListedOffenceIds]="shadowListedOffenceIds$ | async"
      [sharedTargetIds]="sharedTargetIds$ | async"
      [electronicMonitoringOffences]="electronicMonitoringOffences$ | async"
      [offencesWithConditions]="uniquElectronicMonitoringAndWarrantOfArrestOffences$ | async"
      [warrantOfArrestOffences]="warrantOfArrestOffences$ | async"
      [hasHmctsOrganisation]="isHmctsOrganisation$ | async"
      [prosecutorToBeNotified]="prosecutorToBeNotified$ | async"
      [isExParteCase]="isExParteCase$ | async"
      [canAllocateRelatedHearing]="canAllocateRelatedHearing$ | async"
      [amendApplicationPermission]="isAmendApplicationPermission$ | async"
      [caseStatus]="caseStatus$ | async"
      [validationErrorMessagesByOffenceId]="validationErrorMessagesByOffenceId$ | async"
      [validationSummaryErrors]="validationSummaryErrors$ | async"
      (delegatedPowersChange)="handleDelegatedPowers($event)"
      (parseTextValues)="handleParseTextValues($event)"
      (retryFailedAction)="store.dispatch($event)"
      (saveAndContinue)="handleSaveAndContinue()"
      (shadowListedOffenceIdsChange)="handleShadowListedOffenceIds($event)"
    >
    </cpp-enter-results>
  `,
  imports: [EnterResultsComponent, AsyncPipe]
})
export class EnterResultsContainerComponent {
  isSelectedHearingInFuture$ = this.store.pipe(select(isSelectedHearingInFuture));
  delegatedPowers$ = this.store.pipe(select(getDelegatedPowers));
  draftResultError$ = this.store.pipe(select(getDraftResultError));
  draftResultRelations$ = this.store.pipe(select(getResultLinesGroupedByTargetId));
  draftResultSaving$ = this.store.pipe(select(getDraftResultSaving));
  draftResultPromptsValid$ = this.store.pipe(select(getDraftResultPromptsValid));
  hearing$ = this.store.pipe(select(getCurrentHearing), take(1));
  readonly$ = this.store.pipe(select(getDraftResultReadOnly));
  shadowListedOffenceIds$ = this.store.pipe(select(getShadowListedOffenceIds));
  sharedTargetIds$ = this.store.pipe(select(getSharedTargetIds));
  electronicMonitoringOffences$ = this.store.pipe(select(getElectronicMonitoringOffences));
  warrantOfArrestOffences$ = this.store.pipe(select(getWarrantOfArrestOffences));
  uniquElectronicMonitoringAndWarrantOfArrestOffences$ = this.store.pipe(
    select(getUniquElectronicMonitoringAndWarrantOfArrestOffences)
  );
  isHmctsOrganisation$: Observable<boolean>;
  prosecutorToBeNotified$ = this.store.pipe(select(getProsecutortobenotified));
  isExParteCase$ = this.store.pipe(select(isExParteCivilCase));
  isAmendApplicationPermission$ = this.store.pipe(select(canAmendApplication));
  caseStatus$ = this.store.pipe(select(caseStatus));
  canAllocateRelatedHearing$ = this.store.pipe(
    select(isCurrentHearingStandaloneBoxworkApplication),
    map(value => !value)
  );
  validationErrorMessagesByOffenceId$ = this.store.pipe(
    select(getResultsValidationErrorMessagesByOffenceId)
  );
  validationSummaryErrors$ = this.store.pipe(select(getResultsValidationSummaryErrors));

  private readonly _cppDateUtil: CPPDate;
  constructor(
    public store: Store<ResultsState>,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this._cppDateUtil = getCPPDate();
    this.isHmctsOrganisation$ = this.route.data.pipe(map(data => data && data.isHmctsOrganisation));
  }

  handleDelegatedPowers(value: DelegatedPowersValue) {
    this.store.dispatch(DraftResultActions.setDelegatedPowers(value));
  }

  handleSaveAndContinue() {
    combineLatest([this.store.pipe(select(hasResultingAssistant)), this.hearing$])
      .pipe(take(1))
      .subscribe(([featureEnabled, hearing]) => {
        if (featureEnabled) {
          this.store.dispatch(
            ResultsValidationActions.validateResults({ navigateOnSuccess: true })
          );
        } else {
          this.router.navigate(['/manage', hearing.id]);
        }
      });
  }

  handleShadowListedOffenceIds(offenceIds: string[]) {
    this.store.dispatch(DraftResultActions.setShadowListedOffenceIds({ offenceIds }));
  }

  handleParseTextValues(values: ParseTextValue[]) {
    combineLatest([
      this.store.select(getSelectedHearingOrderedDate),
      this.store.select(currentHearingIsBoxHearing),
      this.store.select(getFirstSharedDate)
    ])
      .pipe(take(1))
      .subscribe(([orderedDate, isBoxwork, firstSharedDate]) => {
        let orderedDateToUpdate = orderedDate;

        if (isBoxwork) {
          orderedDateToUpdate = firstSharedDate
            ? this._cppDateUtil.format(firstSharedDate, this._cppDateUtil.US_DATE_FORMAT)
            : this._cppDateUtil.format(new Date(), this._cppDateUtil.US_DATE_FORMAT);
        }

        this.store.dispatch(
          DraftResultActions.parseNotepadItems({
            items: values.map(item => ({ orderedDate: orderedDateToUpdate, ...item }))
          })
        );
      });
  }
}
