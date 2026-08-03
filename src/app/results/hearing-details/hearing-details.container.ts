import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { getOrganisationUnits, OrganisationUnit } from '@cpp/reference-data';
import {
  AvailableHearing,
  getApplicationHasSameJurisdiction,
  getAvailableFutureHearingsForApplication,
  getAvailableFutureHearingsWithOffenceSelected,
  getHasSameJurisdiction,
  isCurrentHearingStandaloneBoxworkApplication,
  ResetAvailableHearingsAction
} from '../../core';
import { select, Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { take, tap } from 'rxjs/operators';
import { ValidationError, PdkTypographyDirective, PdkMarginDirective } from '@cpp/pdk';
import { JurisdictionTypes } from '../../hearing-events-log/core/models/jurisdiction-types';
import {
  HearingDateFormValues,
  FixedDateWeekCommencingComponent
} from './week-commencing/fixed-date-week-commencing.component';
import { DraftResultActions, getDraftResultLineById, ResultsState } from '../core/store';
import { ExtendedResolvedDraftResultLine } from '../results.interfaces';
import {
  createDraftResultPromptsFromValueMap,
  createNameAddressResultPromptForCourtCentre,
  isNameAddressPromptChoice
} from '../core/helpers';
import { AsyncPipe } from '@angular/common';
import { CourtSelectionComponent } from './court-selection/court-selection.component';
import { ChangeOfJurisdictionComponent } from './change-of-jurisdiction/change-of-jurisdiction.component';
import { HearingDetailsTabsComponent } from './hearing-details-tabs.component';

enum AvailableHearingStep {
  WEEK_COMMENCING,
  COURT_SELECTION,
  HEARING_DETAILS
}
@Component({
  selector: 'hearing-details-container',
  template: `
    @if (currentStep === availableHearingStep.COURT_SELECTION) {
    <court-selection
      [jurisdictionType]="jurisdictionType"
      (cancel)="handleReturnToResults()"
      (continue)="onCourtSelected($event)"
      (errors)="showValidationError($event)"
    ></court-selection>
    } @if (currentStep === availableHearingStep.WEEK_COMMENCING) {
    <fixed-date-week-commencing
      [initialValues]="weekCommencingInfo"
      (submitData)="submitWeekCommencing($event)"
      (goBack)="backToCourtSelection()"
    >
    </fixed-date-week-commencing>
    } @if (currentStep === availableHearingStep.HEARING_DETAILS) {
    <h1 pdk-typography="heading-large" pdk-margin-bottom="4" pdk-margin-top="2">
      Search for available sessions
    </h1>
    <cpp-change-of-jurisdiction
      [hasSameJurisdiction]="hasSameJurisdiction$ | async"
      [hearings]="hearings$ | async"
      [jurisdictionType]="jurisdictionType"
      [mapOrganisationUnits]="mapOrganisationUnits"
    ></cpp-change-of-jurisdiction>
    <cpp-hearing-details-tabs
      [canAllocateRelatedHearing]="canAllocateRelatedHearing$ | async"
      [jurisdictionType]="jurisdictionType"
    ></cpp-hearing-details-tabs>
    <router-outlet></router-outlet>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CourtSelectionComponent,
    FixedDateWeekCommencingComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    ChangeOfJurisdictionComponent,
    HearingDetailsTabsComponent,
    RouterOutlet,
    AsyncPipe
  ]
})
export class HearingDetailsContainer implements OnInit {
  canAllocateRelatedHearing$: Observable<boolean>;
  organisationUnits: OrganisationUnit[];
  selectedOrganisationUnit: OrganisationUnit;
  errors: ValidationError[] = null;
  jurisdictionType: JurisdictionTypes;
  availableHearingStep = AvailableHearingStep;
  currentStep = AvailableHearingStep.COURT_SELECTION;
  weekCommencingInfo: HearingDateFormValues;
  hasSameJurisdiction$: Observable<boolean>;
  hearings$: Observable<AvailableHearing[]>;
  mapOrganisationUnits: Record<string, OrganisationUnit>;

  constructor(
    public route: ActivatedRoute,
    private router: Router,
    private store: Store<ResultsState>
  ) {
    this.canAllocateRelatedHearing$ = this.store.pipe(
      select(isCurrentHearingStandaloneBoxworkApplication),
      map(value => !value)
    );
    this.store
      .select(getOrganisationUnits)
      .pipe(
        tap(orgUnits => (this.organisationUnits = orgUnits)),
        take(1)
      )
      .subscribe();

    this.jurisdictionType = route.snapshot.data.jurisdictionType;

    if (!!this.route.snapshot.queryParams.isApplication) {
      this.hearings$ = this.store.pipe(select(getAvailableFutureHearingsForApplication));
      this.hasSameJurisdiction$ = this.store.pipe(select(getApplicationHasSameJurisdiction));
    } else {
      this.hearings$ = this.store.pipe(select(getAvailableFutureHearingsWithOffenceSelected));
      this.hasSameJurisdiction$ = this.store.pipe(select(getHasSameJurisdiction));
    }

    this.mapOrganisationUnits = (this.organisationUnits || []).reduce(
      (acc, curr) => ({
        ...acc,
        [curr.id]: { ...curr }
      }),
      {}
    );
  }

  ngOnInit() {
    this.store.dispatch(new ResetAvailableHearingsAction());
    if (this.route.snapshot.queryParams.courtId) {
      this.selectedOrganisationUnit = this.organisationUnits.find(
        ({ id }) => this.route.snapshot.queryParams.courtId === id
      );
    }
  }

  handleReturnToResults(): void {
    this.router.navigate(['/manage', this.route.snapshot.params.hearingId, 'enter-results']);
  }

  backToCourtSelection(): void {
    this.currentStep = AvailableHearingStep.COURT_SELECTION;
  }

  showValidationError(errors: ValidationError[]) {
    this.errors = errors;
  }

  onCourtSelected(organisationUnit: OrganisationUnit) {
    if (organisationUnit) {
      this.selectedOrganisationUnit = organisationUnit;

      if (this.jurisdictionType === JurisdictionTypes.CROWN) {
        this.weekCommencingInfo = { courtCentre: this.selectedOrganisationUnit };
        this.currentStep = AvailableHearingStep.WEEK_COMMENCING;
        return;
      }

      this.navigateToHearingDetails();
    }
  }

  submitWeekCommencing(weekCommencingDetails: HearingDateFormValues): void {
    if (weekCommencingDetails.dateType === 'DATE_TO_BE_FIXED') {
      this.saveCourtDetailsPromtpsAndRedirect(weekCommencingDetails);
      return;
    }
    this.navigateToHearingDetails(weekCommencingDetails);
  }

  private navigateToHearingDetails(weekCommencingDetails?: HearingDateFormValues): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        courtId: this.selectedOrganisationUnit.id,
        jurisdictionType: this.jurisdictionType,
        weekCommencingType: weekCommencingDetails ? weekCommencingDetails.dateType : undefined
      },
      queryParamsHandling: 'merge'
    });

    this.currentStep = AvailableHearingStep.HEARING_DETAILS;
  }

  private saveCourtDetailsPromtpsAndRedirect({
    courtCentre,
    hearingType,
    hearingDuration
  }: HearingDateFormValues) {
    const parentParams = this.route.parent?.snapshot.params || {};
    const currentParams = this.route.snapshot.params;
    const { hearingId, resultLineId } = { ...parentParams, ...currentParams };

    this.store
      .pipe(
        select(getDraftResultLineById(resultLineId)),
        take(1),
        map(resultLine => {
          const { promptChoices } = resultLine as ExtendedResolvedDraftResultLine;

          const redirectTo = ['/manage', hearingId, 'enter-results'];

          const promptRefToValueMap = {
            dateToBeFixed: true,
            HTYPE: hearingType.hearingDescription,
            HEST: hearingDuration
          };

          return DraftResultActions.updateResultPromptsForDraftResultLine({
            resultLineId,
            redirectTo,
            resultPrompts: [
              ...createDraftResultPromptsFromValueMap(promptChoices, promptRefToValueMap),
              createNameAddressResultPromptForCourtCentre(
                promptChoices.find(isNameAddressPromptChoice),
                courtCentre
              )
            ]
          });
        })
      )
      .subscribe(this.store);
  }
}
