import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PdkCore, PdkDividerComponent, PdkErrorSummaryComponent, ValidationError } from '@cpp/pdk';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { AppState, getCurrentHearingUrn } from '../../core';
import { getFlattenedParams } from '../../core/utils/utils';
import { TierAndListTypeFormComponent } from '../components/tier-and-list-type-form/tier-and-list-type-form.component';
import { SavePtphDetailPayload } from '../models/ptph-detail.model';
import { TierAndListTypeStore } from '../store/tier-and-list-type.store';
import { formRoute, reviewRoute } from '../utils/tier-and-list-type.paths';

@Component({
  selector: 'tier-and-list-type-form-container',
  template: `
    @let errors = formErrors(); @if (errors && errors.length > 0) {
    <pdk-error-summary [errors]="errors" />
    }

    <h1 pdk-typography="heading-large">{{ 'TIER_AND_LIST_TYPE.ENTRY_HEADING' | translate }}</h1>

    @if (caseUrn(); as urn) {
    <pdk-divider pdk-margin-vertical="2" />
    <strong pdk-typography="body-small">{{ urn }}</strong>
    <pdk-divider pdk-margin-vertical="2" />
    }

    <tier-and-list-type-form
      [ptphDetail]="store.detail()"
      [hearingId]="hearingId"
      [cancelRoute]="cancelRoute()"
      (save)="onSave($event)"
      (errors)="onErrors($event)"
      (cancel)="onCancel()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TierAndListTypeFormComponent,
    PdkErrorSummaryComponent,
    PdkDividerComponent,
    PdkCore,
    TranslateModule
  ]
})
export class TierAndListTypeFormContainer {
  private readonly route = inject(ActivatedRoute);
  private readonly appStore = inject(Store<AppState>);

  readonly hearingId = getFlattenedParams(this.route.snapshot)['hearingId'];
  readonly caseUrn = this.appStore.selectSignal(getCurrentHearingUrn);
  readonly store = inject(TierAndListTypeStore);
  readonly formErrors = signal<ValidationError[] | null>(null);

  readonly cancelRoute = computed(() =>
    this.store.detail()?.tier ? reviewRoute(this.hearingId) : formRoute(this.hearingId)
  );

  onSave(payload: SavePtphDetailPayload): void {
    this.store.save(payload);
  }

  onErrors(errors: ValidationError[] | null): void {
    this.formErrors.set(errors);
    this.store.dismissAlert();
  }

  onCancel(): void {
    this.store.dismissAlert();
  }
}
