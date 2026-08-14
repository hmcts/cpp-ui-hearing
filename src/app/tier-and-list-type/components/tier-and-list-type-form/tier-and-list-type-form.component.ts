import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PdkButton,
  PdkCore,
  PdkDividerComponent,
  PdkForm,
  PdkHintComponent,
  PdkInput,
  PdkRadio,
  PdkResizeDirective,
  PdkTextInput,
  ValidationError
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { map } from 'rxjs';
import { LIST_TYPE_OPTIONS, listTypeRequiresKeyReason } from '../../models/list-type-options';
import { PtphDetail, SavePtphDetailPayload } from '../../models/ptph-detail.model';
import { TIER_OPTIONS } from '../../models/tier-options';
import { buildTierAndListTypeFormGroup } from '../../utils/tier-and-list-type-form.utils';

@Component({
  selector: 'tier-and-list-type-form',
  templateUrl: './tier-and-list-type-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PdkForm,
    PdkRadio,
    PdkInput,
    PdkTextInput,
    PdkButton,
    PdkCore,
    PdkDividerComponent,
    PdkHintComponent,
    PdkResizeDirective,
    RouterLink,
    TranslatePipe
  ]
})
export class TierAndListTypeFormComponent {
  readonly ptphDetail = input<PtphDetail | null>(null);
  readonly hearingId = input.required<string>();
  readonly cancelRoute = input.required<string[]>();

  readonly save = output<SavePtphDetailPayload>();
  readonly errors = output<ValidationError[] | null>();
  readonly cancel = output<void>();

  readonly form = buildTierAndListTypeFormGroup();
  readonly tierOptions = TIER_OPTIONS;
  readonly listTypeOptions = LIST_TYPE_OPTIONS;

  readonly fixedDateSelected = toSignal(
    this.form.controls.listType.valueChanges.pipe(map(listTypeRequiresKeyReason)),
    { initialValue: false }
  );

  constructor() {
    effect(() => {
      const detail = this.ptphDetail();

      if (detail) {
        this.form.patchValue({
          tier: detail.tier ?? null,
          listType: detail.listType ?? null,
          keyReason: detail.keyReason ?? null
        });
      }
    });

    effect(() => this.applyListTypeRules(this.fixedDateSelected()));
  }

  clearListTypeSelection(): void {
    this.form.controls.listType.setValue(null);
  }

  onValidSubmit(): void {
    const { tier, listType, keyReason } = this.form.value;
    const payload: SavePtphDetailPayload = { hearingId: this.hearingId(), tier };

    if (listType) {
      payload.listType = listType;

      if (listTypeRequiresKeyReason(listType) && keyReason) {
        payload.keyReason = keyReason.trim();
      }
    }

    this.save.emit(payload);
  }

  private applyListTypeRules(fixedDate: boolean): void {
    const keyReason = this.form.controls.keyReason;

    if (fixedDate) {
      keyReason.setValidators(Validators.required);
    } else {
      keyReason.clearValidators();
      keyReason.setValue(null, { emitEvent: false });
    }

    keyReason.updateValueAndValidity({ emitEvent: false });
  }
}
