import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ValidationError,
  PdkErrorSummaryComponent,
  PdkPaddingDirective,
  PdkMarginDirective,
  PdkBorderColorDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { getOrganisationUnits, OrganisationUnit } from '@cpp/reference-data';
import { select, Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { AppConfigService } from '../../../config';
import {
  AvailableHearing,
  CourtCentre,
  CPPDate,
  getAvailableHearings,
  getCourtCentres,
  getCPPDate,
  getCurrentHearing,
  getCurrentResultLineCaseUrns,
  getHasApiActivity,
  getHearingHasCivilCase,
  getMappedFutureHearings,
  HearingDetail,
  RelatedHearingSlot,
  SearchAvailableHearingsAction,
  SearchAvailableHearingsFormOptions
} from '../../../core';
import {
  createNameAddressResultPromptForCourtCentre,
  createDraftResultPromptsFromValueMap,
  getDurationValueFromMinutes,
  isNameAddressPromptChoice
} from '../../core/helpers';
import { DraftResultActions, getDraftResultLineById, ResultsState } from '../../core/store';
import { ExtendedResolvedDraftResultLine } from '../../results.interfaces';
import { JurisdictionTypes } from '../../../hearing-events-log/core/models/jurisdiction-types';
import { AsyncPipe } from '@angular/common';
import { FindAvailableHearingComponent } from './components/find-available-hearing/find-available-hearing.component';
import { AvailableHearingsComponent } from './components/available-hearings/available-hearings.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'related-hearings-container',
  templateUrl: './related-hearings.container.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkErrorSummaryComponent,
    PdkPaddingDirective,
    PdkMarginDirective,
    PdkBorderColorDirective,
    FindAvailableHearingComponent,
    AvailableHearingsComponent,
    PdkLinkDirective,
    TranslatePipe,
    AsyncPipe
  ]
})
export class RelatedHearingsContainer implements OnInit, OnDestroy {
  hearing$: Observable<HearingDetail>;
  availableHearings$: Observable<AvailableHearing[]>;
  hasApiActivity$: Observable<boolean>;
  currentResultLineCaseUrns$: Observable<string[]>;
  isCivil$: Observable<boolean>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  futureHearingsById$: Observable<Record<string, AvailableHearing>>;

  courtCentres: CourtCentre[];
  jurisdictionType: JurisdictionTypes;
  dateUtil: CPPDate;
  organisationUnits: OrganisationUnit[];
  errors: ValidationError[];

  constructor(
    private store: Store<ResultsState>,
    private appConfig: AppConfigService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.jurisdictionType = this.activatedRoute.snapshot.data.jurisdictionType;

    this.hearing$ = this.store.select(getCurrentHearing);
    this.availableHearings$ = this.store.select(getAvailableHearings);
    this.currentResultLineCaseUrns$ = this.store.select(getCurrentResultLineCaseUrns);
    this.hasApiActivity$ = this.store.select(getHasApiActivity);
    this.futureHearingsById$ = this.store.select(getMappedFutureHearings);
    this.isCivil$ = this.store.select(getHearingHasCivilCase);

    this.store
      .select(getCourtCentres)
      .pipe(takeUntil(this.destroy$))
      .subscribe(courtCentres => (this.courtCentres = courtCentres));

    this.store
      .select(getOrganisationUnits)
      .pipe(takeUntil(this.destroy$))
      .subscribe(organisationUnits => (this.organisationUnits = organisationUnits));
  }

  findAvailableHearings(formOptions: SearchAvailableHearingsFormOptions): void {
    this.store.dispatch(
      new SearchAvailableHearingsAction({
        ...formOptions,
        returnAllHearings: true,
        jurisdictionType: this.jurisdictionType
      })
    );
  }

  viewHearingDetails(hearing: AvailableHearing): void {
    const courtCentre = this.courtCentres.find(
      currentCourtCentre => currentCourtCentre.id === hearing.courtCentreId
    );
    const courtRoom = courtCentre.courtrooms.find(
      currentCourtRoom => currentCourtRoom.id === hearing.courtRoomId
    );
    window.open(
      `${this.appConfig.getBaseUrl()}/hearing/list?hearingDate=${
        hearing.hearingDays[0].hearingDate
      }&courtCentreName=${courtCentre.name}&courtCentreId=${courtCentre.id}&courtRoomName=${
        courtRoom.name
      }&courtRoomId=${courtRoom.id}&hearingId=${hearing.id}`,
      '_blank'
    );
  }

  hearingSelection(relatedHearingSlot: RelatedHearingSlot): void {
    const parentParams = this.activatedRoute.parent?.snapshot.params || {};
    const currentParams = this.activatedRoute.snapshot.params;
    const { hearingId, resultLineId } = { ...parentParams, ...currentParams };

    this.dateUtil = getCPPDate();

    this.store
      .pipe(
        select(getDraftResultLineById(resultLineId)),
        take(1),
        map(resultLine => {
          const { promptChoices } = resultLine as ExtendedResolvedDraftResultLine;
          const courtCentre = this.courtCentres.find(
            currentCourtCentre => currentCourtCentre.id === relatedHearingSlot.courtCentreId
          );
          const courtRoom = courtCentre.courtrooms.find(
            currentCourtRoom => currentCourtRoom.id === relatedHearingSlot.courtRoomId
          );
          const hearingDateTime = this.dateUtil.localDate(relatedHearingSlot.startTime);
          const promptRefToValueMap = {
            fixedDate: this.dateUtil.format(hearingDateTime, 'YYYY-MM-DD'),
            HDATE: this.dateUtil.format(hearingDateTime, 'YYYY-MM-DD'),
            timeOfHearing: this.dateUtil.format(hearingDateTime, 'HH:mm'),
            HCROOM: courtRoom ? courtRoom.name : undefined,
            HTYPE: relatedHearingSlot.hearingType,
            HEST: getDurationValueFromMinutes(relatedHearingSlot.estimatedMinutes),
            existingHearingId: relatedHearingSlot.hearingId
          };

          return DraftResultActions.updateResultPromptsForDraftResultLine({
            resultLineId,
            redirectTo: ['/manage', hearingId, 'enter-results'],
            resultPrompts: [
              ...createDraftResultPromptsFromValueMap(promptChoices, promptRefToValueMap),
              createNameAddressResultPromptForCourtCentre(
                promptChoices.find(isNameAddressPromptChoice),
                this.organisationUnits.find(ou => ou.oucode === courtCentre.oucode)
              )
            ]
          });
        })
      )
      .subscribe(this.store);
  }

  showValidationError(errors: ValidationError[]) {
    this.errors = errors;
  }

  handleCancel(): void {
    this.router.navigate([
      '/manage',
      this.activatedRoute.snapshot.params.hearingId,
      'enter-results'
    ]);
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
