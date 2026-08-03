import { Component, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ValidationError } from '@cpp/pdk';
import { select, Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import {
  AlcoholLevelMethod,
  ApplyDecisionAction,
  ApplyDecisionPayload,
  AppState,
  Defendant,
  getAlcoholLevelMethods,
  getAllPleasHaveDelegatedPowers,
  getCivilCaseHearingPleaOptions,
  getCurrentHearingType,
  getDefendantsFromAllCases,
  getFlattenedParams,
  getGuiltyPleasValues,
  getHearingAllOffences,
  getHearingEitherWayPleaOptions,
  getHearingExtraPleaOptions,
  getHearingHasCivilCase,
  getHearingPleasFromCurrentHearing,
  getHearingStandardPleaOptions,
  getIndicatedPleasOptions,
  getMotReasonsOptions,
  getSelectedHearingDate,
  getSentencingDecisionOptions,
  GroupedPlea,
  Offence,
  PleaData,
  PleaOption,
  ResetPleasAction,
  SelectOption,
  StoreDefendantsPleaAction,
  UpdatePleaAction
} from '../core';
import { AsyncPipe } from '@angular/common';
import { PdkMarginDirective, PdkTypographyDirective, PdkErrorSummaryComponent } from '@cpp/pdk';
import { DelegatedPowersComponent } from '../shared/components/delegated-powers/delegated-powers.component';
import { PleaFormComponent } from './plea-form/plea-form.component';
import { ApplyDecisionContainer } from './decision-apply-all/apply-decision.container';

@Component({
  selector: 'enter-pleas',
  template: `
    @if (enterPleasStep === 'ENTER_PLEAS') {
    <header>
      <h1 pdk-margin-top="3" pdk-typography="heading-xlarge">Enter pleas</h1>
      <delegated-powers
        [delegatedPowers]="delegatedPowers"
        (delegatedPowersChange)="handleDelegatedPowers($event)"
      ></delegated-powers>
    </header>
    @if (errors) {
    <pdk-error-summary [errors]="errors"></pdk-error-summary>
    }
    <plea-form
      [isDelegatedPowers]="delegatedPowers"
      [hearingId]="hearingId"
      [pleas]="pleas$ | async"
      [hasCivilCase]="hasCivilCase$ | async"
      [standardPleaOptions]="standardPleaOptions$ | async"
      [eitherWayPleaOptions]="eitherWayPleaOptions$ | async"
      [indicatedPleaOptions]="indicatedPleaOptions$ | async"
      [magsExtraPleaOptions]="magsExtraPleaOptions$ | async"
      [crownExtraPleaOptions]="crownExtraPleaOptions$ | async"
      [civilCasePleaOptions]="civilCasePleaOptions$ | async"
      [alcoholMethodsOptions]="alcoholMethodsOptions$ | async"
      [motReasonOptions]="motReasonOptions$ | async"
      [sentencingDecisionOptions]="sentencingDecisionOptions$ | async"
      [selectedHearingDate]="selectedHearingDate$ | async"
      [hearingType]="hearingType$ | async"
      (onPleaChange)="onPleaChange($event)"
      (onError)="errors = $event"
      (onSubmit)="submitUpdatePlea($event)"
      (applyDecision)="applyDecision($event)"
    >
    </plea-form>
    } @if (enterPleasStep === 'APPLY_DECISION') {
    <apply-all
      [hearingId]="hearingId"
      [currentOffence]="applyDecisionOffence"
      [defendant]="applyDecisionDefendant"
      (submitUpdatePlea)="submitApplyDecisionPleas($event, applyDecisionOffence)"
      (cancel)="cancelApplyDecision()"
    >
    </apply-all>
    }
  `,
  styles: [
    `
      header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
      }
    `
  ],
  imports: [
    AsyncPipe,
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkErrorSummaryComponent,
    DelegatedPowersComponent,
    PleaFormComponent,
    ApplyDecisionContainer
  ]
})
export class EnterPleasContainer implements OnDestroy {
  pleas$: Observable<GroupedPlea[]>;
  hearingType$: Observable<string>;
  hearingId: string;
  delegatedPowers: boolean;
  guiltyPleasValues: string[];
  motReasonOptions$: Observable<SelectOption[]>;
  selectedHearingDate$: Observable<string>;
  hasCivilCase$: Observable<boolean>;
  sentencingDecisionOptions$: Observable<SelectOption[]>;
  standardPleaOptions$: Observable<PleaOption[]>;
  eitherWayPleaOptions$: Observable<PleaOption[]>;
  indicatedPleaOptions$: Observable<PleaOption[]>;
  civilCasePleaOptions$: Observable<PleaOption[]>;

  magsExtraPleaOptions$: Observable<PleaOption[]>;
  crownExtraPleaOptions$: Observable<PleaOption[]>;

  alcoholMethodsOptions$: Observable<AlcoholLevelMethod[]>;

  allHearingOffences$: Observable<Offence[]>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  errors: ValidationError[];
  originalOffencesMap: Record<string, Offence> = {};

  enterPleasStep: 'ENTER_PLEAS' | 'APPLY_DECISION' = 'ENTER_PLEAS';
  applyDecisionOffence: Offence;
  applyDecisionDefendant: Defendant;
  hearingDefendants: Defendant[] = [];
  isFormSubmitted = false;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject('Window') private window: Window
  ) {
    const { hearingId } = getFlattenedParams(this.activatedRoute.snapshot);
    this.hearingId = hearingId;
    this.hearingType$ = this.store.pipe(select(getCurrentHearingType), take(1));
    this.pleas$ = this.store.pipe(select(getHearingPleasFromCurrentHearing));
    this.motReasonOptions$ = this.store.pipe(select(getMotReasonsOptions), take(1));
    this.sentencingDecisionOptions$ = this.store.pipe(
      select(getSentencingDecisionOptions),
      take(1)
    );
    this.selectedHearingDate$ = this.store.pipe(select(getSelectedHearingDate));
    this.standardPleaOptions$ = this.store.pipe(select(getHearingStandardPleaOptions));
    this.eitherWayPleaOptions$ = this.store.pipe(select(getHearingEitherWayPleaOptions));
    this.indicatedPleaOptions$ = this.store.pipe(select(getIndicatedPleasOptions));
    this.civilCasePleaOptions$ = this.store.pipe(select(getCivilCaseHearingPleaOptions));

    this.magsExtraPleaOptions$ = this.store.pipe(
      select(getHearingExtraPleaOptions('MAGISTRATES')),
      take(1)
    );
    this.crownExtraPleaOptions$ = this.store.pipe(
      select(getHearingExtraPleaOptions('CROWN')),
      take(1)
    );
    this.alcoholMethodsOptions$ = this.store.pipe(select(getAlcoholLevelMethods), take(1));

    this.hasCivilCase$ = this.store.pipe(select(getHearingHasCivilCase));
    this.allHearingOffences$ = this.store.pipe(select(getHearingAllOffences), take(1));

    this.store
      .pipe(select(getGuiltyPleasValues), takeUntil(this.destroy$))
      .subscribe(guiltyPleas => (this.guiltyPleasValues = guiltyPleas));

    this.store
      .pipe(select(getDefendantsFromAllCases), takeUntil(this.destroy$))
      .subscribe(defendants => (this.hearingDefendants = defendants));

    // We have to take a snapshot here as there's mutation somewhere in the view hierachy
    // that screws with data comparison when the pleas are submitted

    this.store
      .pipe(
        select(getHearingAllOffences),
        map((offences: Offence[]) =>
          offences.reduce(
            (offenceMap, offence) => ({
              ...offenceMap,
              [offence.id]: offence
            }),
            {} as Record<string, Offence>
          )
        ),
        take(1)
      )
      .subscribe(offencesMap => {
        this.originalOffencesMap = offencesMap;
      });

    this.store
      .pipe(select(getAllPleasHaveDelegatedPowers), take(1))
      .subscribe(allPleasDelegatedPowers => {
        this.delegatedPowers = allPleasDelegatedPowers;
      });
  }

  handleDelegatedPowers(delegatedPowers: boolean): void {
    this.delegatedPowers = delegatedPowers;
  }

  submitUpdatePlea(pleaData: PleaData[]) {
    this.isFormSubmitted = true;
    const modifiedPleas = this.getModifiedPleas(pleaData);
    if (modifiedPleas.length > 0) {
      this.store.dispatch(
        new UpdatePleaAction({
          hearingId: this.hearingId,
          body: modifiedPleas
        })
      );
    } else {
      this.router.navigate(['/manage', this.hearingId]).then(() => {
        this.window.scroll(0, 0);
      });
    }
  }

  applyDecision({ offence, defendant }: ApplyDecisionPayload): void {
    this.applyDecisionOffence = offence;
    this.applyDecisionDefendant = this.hearingDefendants.find(
      hearingDefendant => hearingDefendant.id === defendant.id
    );
    this.enterPleasStep = 'APPLY_DECISION';
    this.window.scroll(0, 0);
  }

  submitApplyDecisionPleas(defendant: Defendant, offence: Offence): void {
    this.store.dispatch(new ApplyDecisionAction(defendant, offence));
    this.enterPleasStep = 'ENTER_PLEAS';
    this.window.scroll(0, 0);
  }

  cancelApplyDecision() {
    this.enterPleasStep = 'ENTER_PLEAS';
    this.window.scroll(0, 0);
  }

  onPleaChange(pleas: PleaData[]): void {
    this.store.dispatch(new StoreDefendantsPleaAction(pleas, this.guiltyPleasValues));
  }

  private getModifiedPleas(pleaData: PleaData[]): PleaData[] {
    // Let's default falsy values to `null` so we can reliably compare
    const getValue = (value: unknown) => value || null;

    return pleaData.filter(pleaDataValue => {
      const { allocationDecision, indicatedPlea, plea } =
        this.originalOffencesMap[pleaDataValue.offenceId];
      const prevPleaValue = getValue(plea && plea.pleaValue);
      const nextPleaValue = getValue(pleaDataValue.plea && pleaDataValue.plea.pleaValue);

      const prevIndicatedPleaValue = getValue(indicatedPlea && indicatedPlea.indicatedPleaValue);
      const nextIndicatedPleaValue = getValue(
        pleaDataValue.indicatedPlea && pleaDataValue.indicatedPlea.indicatedPleaValue
      );

      const prevMotReasonId = getValue(allocationDecision && allocationDecision.motReasonId);
      const nextMotReasonId = getValue(
        pleaDataValue.allocationDecision && pleaDataValue.allocationDecision.motReasonId
      );

      const prevSentenceTypeId = getValue(
        allocationDecision &&
          allocationDecision.courtIndicatedSentence &&
          allocationDecision.courtIndicatedSentence.courtIndicatedSentenceTypeId
      );

      const nextSentenceTypeId = getValue(
        pleaDataValue.allocationDecision &&
          pleaDataValue.allocationDecision.courtIndicatedSentence &&
          pleaDataValue.allocationDecision.courtIndicatedSentence.courtIndicatedSentenceTypeId
      );

      return (
        prevPleaValue !== nextPleaValue ||
        prevIndicatedPleaValue !== nextIndicatedPleaValue ||
        prevMotReasonId !== nextMotReasonId ||
        prevSentenceTypeId !== nextSentenceTypeId
      );
    });
  }

  ngOnDestroy() {
    if (!this.isFormSubmitted) {
      this.store.dispatch(new ResetPleasAction());
    }
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
