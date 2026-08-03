import { Component, OnDestroy, OnInit } from '@angular/core';
import { CourtCentre, CourtOfficerTypeaheadOptions, CourtType } from '../core/model';
import { ValidationError, PdkErrorSummaryComponent, PdkTypographyDirective } from '@cpp/pdk';
import { AppState } from '../core/reducers';
import { Store, select } from '@ngrx/store';
import { getCourtCentres } from '../core/selectors';
import { takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import {
  CourtFilterOptions,
  SessionTimesCourt,
  GetCourtSessionOfficersByRoleAction,
  COURT_CLERKS,
  COURT_ASSOCIATE,
  LEGAL_ADVISERS,
  RecordSessionTimesAction,
  ClearSessionTimesAction
} from '../core';
import { GetSessionTimesAction } from '../core';
import {
  getCurrentSessionTimes,
  getCourtOfficerTypeaheadOptions
} from '../core/selectors/session-times';
import { AppConfigService } from '../config';
import { SessionTimesBreadcrumbsComponent } from './session-times-breadcrumbs/session-times-breadcrumbs.component';
import { AsyncPipe } from '@angular/common';
import { SessionTimesCourtFilterComponent } from './session-times-court-filter/session-times-court-filter.component';
import { SessionTimesJudiciaryComponent } from './session-times-judiciary/session-times-judiciary.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'session-times',
  template: `
    <session-times-breadcrumbs [appUrl]="appUrl"></session-times-breadcrumbs>
    @if (errors) {
    <pdk-error-summary focusOnChange="true" tabindex="0" [errors]="errors"> </pdk-error-summary>
    }
    <h1 pdk-typography="heading-large" class="record-court-room-title">
      {{ 'SESSION_TIMES.TITLE' | translate }}
    </h1>
    @if (courtCentres?.length) {
    <session-times-court-filter
      (courtFilterFormErrors)="formErrors($event)"
      (onCourtFilterFormSubmit)="onCourtFilersSubmit($event)"
    >
    </session-times-court-filter>
    }
    <session-times-judiciary-form
      [selectedCourtCentre]="courtCentreName"
      [selectedCourtRoom]="courtRoomName"
      [sessionDate]="sessionDate"
      [sessionTimesCourt]="sessionTimesCourt$ | async"
      [courtOfficerOptions]="courtOfficerTypeaheadOptions$ | async"
      (onCourtJudiciaryFormSubmit)="onCourtJudiciarySubmit($event)"
    ></session-times-judiciary-form>
  `,
  styleUrls: ['./session-times.container.scss'],
  imports: [
    SessionTimesBreadcrumbsComponent,
    PdkErrorSummaryComponent,
    PdkTypographyDirective,
    SessionTimesCourtFilterComponent,
    SessionTimesJudiciaryComponent,
    AsyncPipe,
    TranslatePipe
  ]
})
export class SessionTimesContainer implements OnInit, OnDestroy {
  appUrl: string;
  errors: ValidationError[];
  courtCentres: CourtCentre[];
  destroy$: Subject<boolean> = new Subject<boolean>();

  sessionTimesCourt$: Observable<SessionTimesCourt>;
  courtOfficerTypeaheadOptions$: Observable<CourtOfficerTypeaheadOptions>;

  courtFilterOptions: CourtFilterOptions;
  courtCentreName: string;
  courtRoomName: string;
  sessionDate: string;

  constructor(private config: AppConfigService, private store: Store<AppState>) {
    this.store.dispatch(
      new GetCourtSessionOfficersByRoleAction([COURT_CLERKS, COURT_ASSOCIATE, LEGAL_ADVISERS])
    );
    this.appUrl = this.config.getBaseUrl();
  }

  ngOnInit(): void {
    this.store
      .select(getCourtCentres)
      .pipe(takeUntil(this.destroy$))
      .subscribe(courtCentres => {
        this.courtCentres = courtCentres;
      });
    this.sessionTimesCourt$ = this.store.pipe(select(getCurrentSessionTimes));
    this.courtOfficerTypeaheadOptions$ = this.store.pipe(select(getCourtOfficerTypeaheadOptions));
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  formErrors(errors: ValidationError[]) {
    this.errors = errors;
  }

  onCourtFilersSubmit(options: CourtFilterOptions) {
    this.store.dispatch(new ClearSessionTimesAction());

    this.courtFilterOptions = options;
    const { courtCentre, courtRoomId, sessionDate } = this.courtFilterOptions;
    this.courtCentreName = courtCentre.oucodeL3Name;
    this.courtRoomName = courtCentre.courtrooms.find(
      courtRoom => courtRoom.id === courtRoomId
    ).courtroomName;

    this.sessionDate = sessionDate;
    const { id, oucodeL1Code } = courtCentre;

    const oucode = courtCentre.oucode;

    this.store.dispatch(
      new GetSessionTimesAction(id, oucode, courtRoomId, oucodeL1Code as CourtType, sessionDate)
    );
  }

  onCourtJudiciarySubmit(judiciaryForm: SessionTimesCourt) {
    this.store.dispatch(new RecordSessionTimesAction(judiciaryForm));
  }
}
