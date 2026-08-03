import { Component, OnDestroy, OnInit } from '@angular/core';
import { ValidationError } from '@cpp/pdk';
import { Store } from '@ngrx/store';
import { AppConfigService } from '../config/config.service';
import {
  AppState,
  CheckInAsProsecutor,
  CheckInAsProsecutorAction,
  CheckInHearings,
  CheckInPayload,
  clearCheckInHearingList,
  getCheckInHearingSummariesGroupedByCaseId,
  getCPPDate,
  getHasApiActivity,
  HearingSummariesGroupedByCaseId,
  loadCheckInHearingList
} from '../core';
import { Observable } from 'rxjs';
import { getUserDetails, getUserGroups, UserDetails, UserGroup } from '@cpp/users-groups';
import { OrganisationUnit } from '@cpp/reference-data';
import { CheckInBreadcrumbsComponent } from './components/check-in-breadcrumbs/check-in-breadcrumbs.component';
import { CheckInErrorSummaryComponent } from './components/check-in-error-summary/check-in-error-summary.component';
import { CheckInComponent } from './components/check-in/check-in.component';
import { AsyncPipe } from '@angular/common';
import { CheckInNoHearingsAvailableComponent } from './components/check-in-no-hearings-available/check-in-no-hearings-available.component';

@Component({
  selector: 'check-in-container',
  template: `
    <check-in-breadcrumbs [appUrl]="appUrl"></check-in-breadcrumbs>
    <check-in-error-summary [errors]="errors"></check-in-error-summary>
    <check-in
      [appUrl]="appUrl"
      [hearingSummariesGroupedByCaseId]="hearingSummariesGroupedByCaseId$ | async"
      [userGroups]="userGroup$ | async"
      [loggedInUser]="loggedInUser$ | async"
      [hasApiActivity]="hasApiActivity$ | async"
      (onSelectCourtCentre)="selectedCourtCentre($event)"
      (onAddCheckinErrors)="addCheckinErrors($event)"
      (onCheckInProsecution)="checkInProsecution($event)"
      (onCheckInHearing)="checkInHearing($event)"
    >
    </check-in>
    @if ( (hearingSummariesGroupedByCaseId$ | async).length === 0 && (hasApiActivity$ | async) ===
    false && !!courtCentre ) {
    <check-in-no-hearings-available></check-in-no-hearings-available>
    }
  `,
  imports: [
    CheckInBreadcrumbsComponent,
    CheckInErrorSummaryComponent,
    CheckInComponent,
    CheckInNoHearingsAvailableComponent,
    AsyncPipe
  ]
})
export class CheckInContainer implements OnInit, OnDestroy {
  appUrl: string;
  userGroup$: Observable<UserGroup[]>;
  hearingSummariesGroupedByCaseId$: Observable<HearingSummariesGroupedByCaseId[]>;
  hasApiActivity$: Observable<boolean>;
  errors: ValidationError[];
  cppDateUtil = getCPPDate();
  loggedInUser$: Observable<UserDetails>;
  courtCentre: OrganisationUnit;

  constructor(private config: AppConfigService, private store: Store<AppState>) {
    this.appUrl = this.config.getBaseUrl();
  }

  ngOnInit() {
    this.userGroup$ = this.store.select(getUserGroups);
    this.hearingSummariesGroupedByCaseId$ = this.store.select(
      getCheckInHearingSummariesGroupedByCaseId
    );
    this.hasApiActivity$ = this.store.select(getHasApiActivity);
    this.loggedInUser$ = this.store.select(getUserDetails);
  }

  selectedCourtCentre(courtCentre: OrganisationUnit) {
    this.courtCentre = courtCentre;
    this.store.dispatch(
      loadCheckInHearingList({
        date: this.cppDateUtil.format(
          this.cppDateUtil.getCurrentDate(),
          this.cppDateUtil.US_DATE_FORMAT
        ),
        courtCentreId: courtCentre.id
      })
    );
  }

  addCheckinErrors(errors: ValidationError[]) {
    this.errors = [...errors];
  }

  checkInProsecution(checkInProsecutionPayload: CheckInAsProsecutor[]) {
    this.store.dispatch(
      new CheckInAsProsecutorAction({
        checkInAsProsecutor: checkInProsecutionPayload,
        courtCentre: this.courtCentre
      })
    );
  }

  checkInHearing(payload: CheckInPayload) {
    this.store.dispatch(new CheckInHearings(payload, this.courtCentre));
  }

  ngOnDestroy(): void {
    this.store.dispatch(clearCheckInHearingList());
  }
}
