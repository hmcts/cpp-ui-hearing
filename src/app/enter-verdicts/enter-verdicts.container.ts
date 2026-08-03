import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import {
  AppState,
  UpdateVerdictAction,
  getHearingPleasFromCurrentHearing,
  getVerdictTypes,
  getCurrentHearingType,
  getCurrentHearing,
  getMomentValue,
  VerdictType,
  getFlattenedParams,
  Offence,
  Verdict,
  getHearingHasCivilCase,
  GroupedPlea,
  getSelectedHearingDate,
  UpdateVerdictData,
  storeDefendantVerdictData,
  resetVerdictAction,
  Defendant,
  OffenceType,
  setDefendantOffence,
  HearingDetail
} from '../core';
import {
  ValidationError,
  PdkErrorSummaryComponent,
  PdkTypographyDirective,
  PdkMarginDirective
} from '@cpp/pdk';
import { AsyncPipe } from '@angular/common';
import { VerdictFormComponent } from './verdicts-form/verdict-form.component';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'enter-verdicts',
  template: `
    @if (errors && errors.length) {
    <pdk-error-summary [errors]="errors"></pdk-error-summary>
    }
    <h1 pdk-typography="heading-xlarge" pdk-margin-top="8">
      {{ 'ENTER_VERDICTS.ENTER_VERDICTS' | translate }}
    </h1>
    <verdict-form
      [hearingType]="hearingType$ | async"
      [pleas]="pleas$ | async"
      [hasCivilCase]="hasCivilCase$ | async"
      [allVerdictTypes]="allVerdictTypes$ | async"
      [verdictTypesForHearingJurisdiction]="verdictTypesForHearingJurisdiction$ | async"
      [currentHearingDetail]="currrentHearing$ | async"
      (onSubmit)="verdictSubmit($event)"
      (updateVerdictData)="setVerdictData($event)"
      (onError)="updateError($event)"
      (updateDefendantOffenceData)="updateDefendantOffence($event)"
      (cancelVerdict)="cancelVerdict()"
    >
    </verdict-form>
  `,
  imports: [
    PdkErrorSummaryComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    VerdictFormComponent,
    AsyncPipe,
    TranslatePipe
  ]
})
export class EnterVerdictsContainer implements OnInit, OnDestroy {
  pleas$: Observable<GroupedPlea[]>;
  hearingType$: Observable<string>;
  allVerdictTypes$: Observable<VerdictType[]>;
  verdictTypesForHearingJurisdiction$: Observable<VerdictType[]>;

  hearingId: string;
  hearingDate: string;
  selectedHearingDate: string;
  errors: ValidationError[];
  hasCivilCase$: Observable<boolean>;
  currrentHearing$: Observable<HearingDetail>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  isFormSubmitted = false;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    @Inject('Window') private window: Window
  ) {}

  ngOnInit() {
    const { hearingId } = getFlattenedParams(this.activatedRoute.snapshot);
    this.hearingId = hearingId;
    this.hearingType$ = this.store.select(getCurrentHearingType);
    this.pleas$ = this.store.select(getHearingPleasFromCurrentHearing);
    this.hasCivilCase$ = this.store.select(getHearingHasCivilCase);
    this.allVerdictTypes$ = this.store.select(getVerdictTypes);
    this.currrentHearing$ = this.store.select(getCurrentHearing);
    this.store.pipe(select(getSelectedHearingDate), take(1)).subscribe(date => {
      this.selectedHearingDate = date;
    });
    this.verdictTypesForHearingJurisdiction$ = combineLatest([
      this.store.select(getVerdictTypes),
      this.store.select(getCurrentHearing)
    ]).pipe(
      map(([verdictTypes, currentHearing]) =>
        verdictTypes.filter(vt => vt.jurisdiction === currentHearing.jurisdictionType)
      )
    );
  }

  verdictSubmit(changedOffenceIds: string[]) {
    const verdicts: Verdict[] = [];
    this.isFormSubmitted = true;
    if (changedOffenceIds.length > 0) {
      this.store
        .select(getHearingPleasFromCurrentHearing)
        .pipe(take(1))
        .subscribe(currentPleas => {
          currentPleas.forEach(currentPlea => {
            const defendantWithcount = (currentPlea?.withCount || []).reduce<Defendant[]>(
              (acc, pleaWithcount) => {
                return [...acc, ...pleaWithcount.defendants];
              },
              []
            );
            const defendantsWithOrWithoutCount = [
              ...(currentPlea?.withoutCount || []),
              ...defendantWithcount
            ];
            defendantsWithOrWithoutCount.forEach(defendant => {
              defendant.offences.forEach(offence => {
                if (changedOffenceIds.includes(offence.id)) {
                  verdicts.push(this.createVerdictFromOffence(offence));
                }
              });
            });
          });
          this.store.dispatch(
            new UpdateVerdictAction({
              hearingId: this.hearingId,
              verdict: { verdicts: verdicts }
            })
          );
        });
    } else {
      this.cancelVerdict();
    }
  }

  createVerdictFromOffence(offence: Offence): Verdict {
    const { verdict } = offence;
    let offenceDefinitionId = offence.offenceDefinitionId;
    let offenceCode = offence.offenceCode;
    let offenceTitle = offence.offenceTitle;
    let offenceLegislation = offence.offenceLegislation;

    if (verdict.lesserOrAlternativeOffence) {
      offenceDefinitionId = verdict.lesserOrAlternativeOffence.offenceDefinitionId;
      offenceCode = verdict.lesserOrAlternativeOffence.offenceCode;
      offenceTitle = verdict.lesserOrAlternativeOffence.offenceTitle;
      offenceLegislation = verdict.lesserOrAlternativeOffence.offenceLegislation;
    }
    return {
      applicationId: verdict.applicationId || undefined,
      offenceId: !verdict.applicationId ? verdict.offenceId : undefined,
      verdictDate: getMomentValue(this.selectedHearingDate).format('YYYY-MM-DD'),
      originatingHearingId: verdict.originatingHearingId,
      verdictType: {
        id: verdict.verdictType.id,
        category: verdict.verdictType.category,
        categoryType: verdict.verdictType.categoryType
      },
      lesserOrAlternativeOffence: {
        offenceDefinitionId,
        offenceCode,
        offenceTitle,
        offenceLegislation
      },
      jurors: {
        numberOfJurors: verdict.jurors.numberOfJurors,
        numberOfSplitJurors: verdict.jurors.numberOfSplitJurors,
        unanimous: verdict.jurors.unanimous
      },
      isDeleted: verdict.isDeleted
    };
  }

  updateError(event: ValidationError[]) {
    this.errors = event;
    if (this.errors && this.errors.length) {
      this.window.scroll(0, 0);
    }
  }

  setVerdictData(verdictData: UpdateVerdictData[]) {
    this.store.dispatch(storeDefendantVerdictData({ verdictData }));
  }

  updateDefendantOffence({
    offence,
    defendant,
    offenceType
  }: {
    offence: Offence;
    defendant: Defendant;
    offenceType: OffenceType;
  }) {
    this.store.dispatch(setDefendantOffence({ offence, defendant, offenceType }));
  }

  cancelVerdict() {
    this.isFormSubmitted = false;
    this.router.navigate(['/manage', this.hearingId]).then(() => {
      this.window.scroll(0, 0);
    });
  }

  ngOnDestroy() {
    if (!this.isFormSubmitted) {
      this.store.dispatch(resetVerdictAction());
    }
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
