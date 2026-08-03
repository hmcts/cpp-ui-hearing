import { AppConfigService } from './../../../config/config.service';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CheckInBreadcrumbsComponent } from '../check-in-breadcrumbs/check-in-breadcrumbs.component';
import { PdkAlertComponent, PdkWarningTextComponent, PdkMarginDirective } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'check-in-outcome',
  template: `
    <check-in-breadcrumbs [appUrl]="appUrl"></check-in-breadcrumbs>
    @if (numberOfSuccessfulHearings && numberOfSuccessfulHearings > 0) {
    <pdk-alert icon="true" type="success">
      @if (numberOfSuccessfulHearings === 1) {
      {{ 'CHECK_IN.SUCCESSFUL_CHECK_IN_SINGULAR' | translate : successCheckInparams }}
      } @else {
      {{ 'CHECK_IN.SUCCESSFUL_CHECK_IN_PLURAL' | translate : successCheckInparams }}
      }
    </pdk-alert>
    } @if (!!failedCasesFormatted) {
    <pdk-warning-text pdk-margin-top="6">
      {{ ('CHECK_IN.FAIL_CHECK_IN' | translate) + failedCasesFormatted }}
    </pdk-warning-text>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CheckInBreadcrumbsComponent,
    PdkAlertComponent,
    PdkWarningTextComponent,
    PdkMarginDirective,
    TranslatePipe
  ]
})
export class CheckInOutcomeComponent implements OnInit {
  appUrl: string;
  numberOfSuccessfulHearings: number;
  failedCases: string[];
  courtHouse: string;
  role: string;

  constructor(
    private route: ActivatedRoute,
    private config: AppConfigService,
    private location: Location
  ) {}

  ngOnInit() {
    this.appUrl = this.config.getBaseUrl();
    const queryParams = this.route.snapshot.queryParams;
    this.numberOfSuccessfulHearings = Number(queryParams.numberOfSuccessfulHearings);
    this.failedCases =
      queryParams.failedCases && queryParams.failedCases.length > 0
        ? queryParams.failedCases.split(',')
        : [];
    this.courtHouse = queryParams.courtHouse;
    this.role = queryParams.role;
    this.location.replaceState(this.location.path().split('?')[0], '');
  }

  get successCheckInparams() {
    return {
      role: this.role,
      numberOfSuccessfulHearings: this.numberOfSuccessfulHearings,
      courtHouse: this.courtHouse
    };
  }

  get failedCasesFormatted() {
    return this.failedCases.length > 0 ? this.failedCases.join(', ') : '';
  }
}
