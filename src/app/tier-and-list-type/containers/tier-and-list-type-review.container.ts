import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PdkCore, PdkDividerComponent } from '@cpp/pdk';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { AppState, getCurrentHearingUrn } from '../../core';
import { getFlattenedParams } from '../../core/utils/utils';
import { TierAndListTypeReviewComponent } from '../components/tier-and-list-type-review/tier-and-list-type-review.component';
import { TierAndListTypeStore } from '../store/tier-and-list-type.store';
import { formRoute } from '../utils/tier-and-list-type.paths';

@Component({
  selector: 'tier-and-list-type-review-container',
  template: `
    <h1 pdk-typography="heading-large">{{ 'TIER_AND_LIST_TYPE.REVIEW_HEADING' | translate }}</h1>

    @if (caseUrn(); as urn) {
    <pdk-divider pdk-margin-vertical="2" />
    <strong pdk-typography="body-small">{{ urn }}</strong>
    <pdk-divider pdk-margin-vertical="2" />
    } @if (store.detail(); as detail) {
    <tier-and-list-type-review
      [ptphDetail]="detail"
      [canFinalise]="store.canFinalise()"
      [formRoute]="formRoute"
      (finalise)="onFinalise()"
      (delete)="onDelete()"
    />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TierAndListTypeReviewComponent, PdkDividerComponent, PdkCore, TranslateModule]
})
export class TierAndListTypeReviewContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly appStore = inject(Store<AppState>);
  private readonly hearingId = getFlattenedParams(this.route.snapshot)['hearingId'];

  readonly caseUrn = this.appStore.selectSignal(getCurrentHearingUrn);
  readonly store = inject(TierAndListTypeStore);
  readonly formRoute = formRoute(this.hearingId);

  onFinalise(): void {
    this.store.finalise(this.hearingId);
  }

  onDelete(): void {
    this.store.remove(this.hearingId);
  }
}
