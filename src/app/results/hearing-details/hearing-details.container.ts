import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
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
import { filter, map, take, tap } from 'rxjs/operators';
import { ValidationError, PdkTypographyDirective, PdkMarginDirective, PdkBackLink } from '@cpp/pdk';
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
    @if (currentStep() === availableHearingStep.COURT_SELECTION) {
    <court-selection
      [jurisdictionType]="jurisdictionType"
      [backUrl]="['/manage', route.snapshot.params['hearingId'], 'enter-results']"
      [courtCentre]="selectedOrganisationUnit"
      (continue)="onCourtSelected($event)"
      (errors)="showValidationError($event)"
    ></court-selection>
    } @if (currentStep() === availableHearingStep.WEEK_COMMENCING) {
    <fixed-date-week-commencing
      [initialValues]="weekCommencingInfo"
      (submitData)="submitWeekCommencing($event)"
      (goBack)="backToCourtSelection()"
    >
    </fixed-date-week-commencing>
    } @if (currentStep() === availableHearingStep.HEARING_DETAILS) {
    <div pdk-margin-bottom="1">
      <a pdk-back-link href="javascript:void(0)" (click)="backFromHearingDetails()">Back</a>
    </div>
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
      [weekCommencingType]="weekCommencingInfo?.dateType"
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
    PdkBackLink,
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
  currentStep = signal(AvailableHearingStep.COURT_SELECTION);
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

    this.router.events
      .pipe(
        filter(
          e =>
            e instanceof NavigationEnd &&
            this.router.lastSuccessfulNavigation?.trigger === 'popstate' &&
            this.currentStep() === AvailableHearingStep.HEARING_DETAILS
        ),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const childPath = this.route.firstChild?.snapshot.url[0]?.path;

        if (this.jurisdictionType === JurisdictionTypes.CROWN) {
          const hasCourtId = !!this.route.firstChild?.snapshot.queryParams?.courtId;
          if (childPath !== 'court-details' || !hasCourtId) {
            this.currentStep.set(AvailableHearingStep.WEEK_COMMENCING);
          }
        } else {
          const hasCourtId = !!this.route.firstChild?.snapshot.queryParams?.courtId;
          if (!hasCourtId) {
            this.goToCourtSelection();
          }
        }
      });
  }

  ngOnInit() {
    this.store.dispatch(new ResetAvailableHearingsAction());
  }

  backToCourtSelection(): void {
    this.goToCourtSelection();
  }

  backFromHearingDetails(): void {
    if (this.jurisdictionType === JurisdictionTypes.CROWN) {
      this.currentStep.set(AvailableHearingStep.WEEK_COMMENCING);
      this.clearHearingDetailsQueryParams();
      return;
    }
    this.goToCourtSelection();
  }

  private goToCourtSelection(): void {
    this.weekCommencingInfo = undefined;
    this.selectedOrganisationUnit = undefined;
    this.currentStep.set(AvailableHearingStep.COURT_SELECTION);
    this.clearHearingDetailsQueryParams();
  }

  private clearHearingDetailsQueryParams(): void {
    const childRoute = this.route.firstChild;
    if (childRoute) {
      this.router.navigate(['..'], {
        relativeTo: childRoute,
        queryParams: {},
        replaceUrl: true
      });
    } else {
      this.router.navigate(['.'], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  showValidationError(errors: ValidationError[]) {
    this.errors = errors;
  }

  onCourtSelected(organisationUnit: OrganisationUnit) {
    if (organisationUnit) {
      this.selectedOrganisationUnit = organisationUnit;

      if (this.jurisdictionType === JurisdictionTypes.CROWN) {
        this.weekCommencingInfo = { courtCentre: this.selectedOrganisationUnit };
        this.currentStep.set(AvailableHearingStep.WEEK_COMMENCING);
        return;
      }

      this.navigateToHearingDetails();
    }
  }

  submitWeekCommencing(weekCommencingDetails: HearingDateFormValues): void {
    this.weekCommencingInfo = { ...this.weekCommencingInfo, ...weekCommencingDetails };
    if (weekCommencingDetails.dateType === 'DATE_TO_BE_FIXED') {
      this.saveCourtDetailsPromtpsAndRedirect(weekCommencingDetails);
      return;
    }
    this.navigateToHearingDetails(weekCommencingDetails);
  }

  private navigateToHearingDetails(weekCommencingDetails?: HearingDateFormValues): void {
    this.router.navigate(['related-hearings'], {
      relativeTo: this.route,
      queryParams: {
        courtId: this.selectedOrganisationUnit.id,
        jurisdictionType: this.jurisdictionType,
        weekCommencingType: weekCommencingDetails ? weekCommencingDetails.dateType : undefined
      },
      queryParamsHandling: 'merge'
    });

    this.currentStep.set(AvailableHearingStep.HEARING_DETAILS);
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
