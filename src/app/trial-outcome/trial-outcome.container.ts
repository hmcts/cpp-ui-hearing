import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  AppState,
  SetTrialTypeAction,
  HearingDetail,
  VacateTrialAction,
  getTrialTypesSortedBySeqNo,
  TrialType
} from '../core';
import { CrackedIneffectiveSubReason } from '../core/model/shared/cracked-ineffective-sub-reason';
import * as HearingActions from '../core/actions/hearing';
import { getSubReasons, selectTrialEffectivenessError } from '../core/selectors/hearing';
import { setTrialEffectivenessError } from '../core';
import { hasCitSubreason } from '../core/selectors/user-groups';
import { ValidationError } from '@cpp/pdk';
import cleanDeep from 'clean-deep';
import { TrialTypeComponent } from './trial-type/trial-type.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'trial-outcome',
  template: `
    <trial-type
      [trialTypes]="trialTypes$ | async"
      [hearing]="hearing"
      [subReasons]="subReasons$ | async"
      [trialEffectivenessError]="trialEffectivenessError$ | async"
      [citSubreasonEnabled]="citSubreasonEnabled"
      (onSaveTrialType)="saveTrialType($event)"
    ></trial-type>
  `,
  imports: [TrialTypeComponent, AsyncPipe]
})
export class TrialOutcomeContainer implements OnInit, OnDestroy {
  @Input() hearing: HearingDetail;
  @Output() trialTypeSelected = new EventEmitter<void>();

  trialTypes$: Observable<TrialType[]>;
  subReasons$: Observable<CrackedIneffectiveSubReason[]>;
  trialEffectivenessError$: Observable<ValidationError[] | null>;
  citSubreasonEnabled = false;

  constructor(readonly store: Store<AppState>) {}

  ngOnInit() {
    this.trialTypes$ = this.store.select(getTrialTypesSortedBySeqNo);
    this.subReasons$ = this.store.select(getSubReasons);
    this.trialEffectivenessError$ = this.store.select(selectTrialEffectivenessError);

    this.store
      .select(hasCitSubreason)
      .pipe(take(1))
      .subscribe(enabled => {
        this.citSubreasonEnabled = enabled;
        if (enabled) {
          this.store.dispatch(HearingActions.loadCrackedIneffectiveSubReasons());
        }
      });
  }

  ngOnDestroy(): void {
    this.store.dispatch(HearingActions.clearCrackedIneffectiveSubReasons());
  }

  saveTrialType(trialType: TrialType) {
    const { vacateTrial, crackedIneffectiveSubReasonId } = trialType;

    if (vacateTrial) {
      this.store.dispatch(
        new VacateTrialAction({
          hearingId: this.hearing.id,
          vacatedTrialReasonId: trialType.id,
          crackedIneffectiveSubReasonId
        })
      );
    } else {
      const trialTypeBody = cleanDeep({
        isEffectiveTrial: trialType.trialType === 'Effective' ? true : undefined,
        trialTypeId: trialType.trialType === 'Effective' ? undefined : trialType.id,
        crackedIneffectiveSubReasonId
      });
      this.store.dispatch(new SetTrialTypeAction({ hearingId: this.hearing.id, trialTypeBody }));
    }

    this.trialTypeSelected.emit();
    this.store.dispatch(setTrialEffectivenessError({ error: null }));
  }
}
