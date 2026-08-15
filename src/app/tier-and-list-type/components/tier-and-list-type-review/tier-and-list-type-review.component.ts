import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PdkButton,
  PdkCore,
  PdkInsetTextComponent,
  PdkSummaryList,
  PdkWarningTextComponent
} from '@cpp/pdk';
import { TranslateModule } from '@ngx-translate/core';
import { listTypeOption } from '../../models/list-type-options';
import { PtphDetail } from '../../models/ptph-detail.model';
import { TIER_OPTIONS } from '../../models/tier-options';

@Component({
  selector: 'tier-and-list-type-review',
  templateUrl: './tier-and-list-type-review.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkSummaryList,
    PdkButton,
    PdkCore,
    PdkInsetTextComponent,
    PdkWarningTextComponent,
    RouterLink,
    TranslateModule
  ]
})
export class TierAndListTypeReviewComponent {
  readonly ptphDetail = input.required<PtphDetail>();
  readonly canFinalise = input(false);
  readonly formRoute = input.required<string[]>();

  readonly finalise = output<void>();
  readonly delete = output<void>();

  readonly isFinalised = computed(() => this.ptphDetail().finalised === true);

  readonly tierOption = computed(() => {
    const tier = this.ptphDetail().tier;
    return tier ? TIER_OPTIONS.find(option => option.value === tier) : undefined;
  });

  readonly listTypeOption = computed(() => listTypeOption(this.ptphDetail().listType));
}
