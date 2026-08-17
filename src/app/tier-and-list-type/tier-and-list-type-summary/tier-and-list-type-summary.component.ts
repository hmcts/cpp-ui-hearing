import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  PdkLinkDirective,
  PdkSummaryListActionsDirective,
  PdkSummaryListComponent,
  PdkSummaryListItemDirective,
  PdkSummaryListKeyDirective,
  PdkSummaryListValueDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { TierAndListType } from '../../core';
import {
  LIST_TYPE_FIXED_DATE,
  LIST_TYPE_OPTIONS,
  TIER_2,
  TIER_2_SUBCATEGORY_OPTIONS,
  TIER_OPTIONS
} from '../tier-options';

@Component({
  selector: 'tier-and-list-type-summary',
  templateUrl: './tier-and-list-type-summary.component.html',
  styleUrls: ['./tier-and-list-type-summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkLinkDirective,
    PdkSummaryListActionsDirective,
    PdkSummaryListComponent,
    PdkSummaryListItemDirective,
    PdkSummaryListKeyDirective,
    PdkSummaryListValueDirective,
    PdkVisuallyHiddenDirective,
    TranslatePipe
  ]
})
export class TierAndListTypeSummaryComponent {
  @Input() tierAndListType: TierAndListType;
  @Output() changeSelection = new EventEmitter<void>();

  get tierLabelKey(): string {
    return TIER_OPTIONS.find(({ value }) => value === this.tierAndListType?.tier)?.labelKey;
  }

  get tier2SubcategoryLabelKey(): string {
    if (this.tierAndListType?.tier !== TIER_2) {
      return null;
    }
    return TIER_2_SUBCATEGORY_OPTIONS.find(
      ({ value }) => value === this.tierAndListType?.tier2Subcategory
    )?.labelKey;
  }

  get listTypeLabelKey(): string {
    return LIST_TYPE_OPTIONS.find(({ value }) => value === this.tierAndListType?.listType)
      ?.labelKey;
  }

  get showFixedDateReason(): boolean {
    return this.tierAndListType?.listType === LIST_TYPE_FIXED_DATE;
  }
}
