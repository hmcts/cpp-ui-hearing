import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {
  HearingSummary,
  RemoveFutureHearing,
  TrialType,
  AppState,
  RemoveFutureHearingsConfirmed,
  getFilteredFutureHearings,
  getHearingId,
  getTrialTypes
} from '../core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { PdkPaddingDirective } from '@cpp/pdk';
import { RemoveFutureHearingFormComponent } from './components/remove-future-hearing-form/remove-future-hearing-form.component';
import { ResultedHearingsComponent } from './components/resulted-hearings/resulted-hearings.component';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: 'remove-future-hearing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div pdk-padding-top="6">
      <remove-future-hearing-form
        [hearingId]="hearingId$ | async"
        [hearingSummaries]="notResultedFutureHearings$ | async"
        [reasonsForVacating]="reasonsForVacated$ | async"
        [isReadOnly]="isReadOnly"
        (remove)="removeFutureHearings($event)"
        (readonlyMode)="readOnlyMode($event)"
      >
      </remove-future-hearing-form>

      <resulted-hearings
        [hearingSummaries]="resultedFutureHearings$ | async"
        [isReadOnly]="isReadOnly"
      >
      </resulted-hearings>
    </div>
  `,
  styleUrls: ['remove-future-hearing.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    PdkPaddingDirective,
    RemoveFutureHearingFormComponent,
    ResultedHearingsComponent,
    AsyncPipe
  ]
})
export class RemoveFutureHearingContainer {
  notResultedFutureHearings$: Observable<HearingSummary[]>;
  resultedFutureHearings$: Observable<HearingSummary[]>;
  hearingId$: Observable<string>;
  reasonsForVacated$: Observable<TrialType[]>;
  isReadOnly: boolean = false;

  constructor(private store: Store<AppState>) {
    this.notResultedFutureHearings$ = this.store.pipe(
      select(getFilteredFutureHearings(false)),
      take(1)
    );
    this.resultedFutureHearings$ = this.store.pipe(
      select(getFilteredFutureHearings(true)),
      take(1)
    );

    this.hearingId$ = this.store.pipe(select(getHearingId), take(1));

    this.reasonsForVacated$ = this.store.pipe(
      select(getTrialTypes),
      take(1),
      map((trialTypes: TrialType[]) => {
        return trialTypes.filter(t => t.trialType.toLowerCase() === 'vacated');
      })
    );
  }

  removeFutureHearings(event: { removeFutureHearings: RemoveFutureHearing[] }) {
    this.store.dispatch(new RemoveFutureHearingsConfirmed(event.removeFutureHearings));
  }

  readOnlyMode(event: boolean) {
    this.isReadOnly = event;
  }
}
