import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PdkButtonComponent,
  PdkButtonDirective,
  PdkButtonGroupComponent,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkHintComponent,
  PdkInputDirective,
  PdkLinkDirective,
  PdkMarginDirective,
  PdkRadioButtonComponent,
  PdkRadioConditionalComponent,
  PdkRadioGroupComponent,
  PdkResizeDirective,
  PdkTextInputDirective,
  ValidationError
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { ListType, Tier, Tier2Subcategory, TierAndListType } from '../../core';
import { NoWhitespaceValidator } from '../../shared/validators';
import {
  LIST_TYPE_FIXED_DATE,
  LIST_TYPE_OPTIONS,
  TIER_2,
  TIER_2_SUBCATEGORY_OPTIONS,
  TIER_OPTIONS
} from '../tier-options';

@Component({
  selector: 'tier-and-list-type-form',
  templateUrl: './tier-and-list-type-form.component.html',
  styleUrls: ['./tier-and-list-type-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NoWhitespaceValidator,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkButtonGroupComponent,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkHintComponent,
    PdkInputDirective,
    PdkLinkDirective,
    PdkMarginDirective,
    PdkRadioButtonComponent,
    PdkRadioConditionalComponent,
    PdkRadioGroupComponent,
    PdkResizeDirective,
    PdkTextInputDirective,
    TranslatePipe
  ]
})
export class TierAndListTypeFormComponent {
  @Input() set tierAndListType(value: TierAndListType) {
    this.tier = value?.tier ?? null;
    this.tier2Subcategory = value?.tier2Subcategory ?? null;
    this.listType = value?.listType ?? null;
    this.fixedDateReason = value?.fixedDateReason ?? '';
  }

  @Output() formSubmit = new EventEmitter<TierAndListType>();
  @Output() errors = new EventEmitter<ValidationError[] | null>();

  readonly tierOptions = TIER_OPTIONS;
  readonly tier2SubcategoryOptions = TIER_2_SUBCATEGORY_OPTIONS;
  readonly listTypeOptions = LIST_TYPE_OPTIONS;
  readonly tier2 = TIER_2;
  readonly fixedDateListType = LIST_TYPE_FIXED_DATE;

  tier: Tier = null;
  tier2Subcategory: Tier2Subcategory = null;
  listType: ListType = null;
  fixedDateReason = '';

  tierSelected(): void {
    if (this.tier !== TIER_2) {
      this.tier2Subcategory = null;
    }
  }

  listTypeSelected(): void {
    if (this.listType !== LIST_TYPE_FIXED_DATE) {
      this.fixedDateReason = '';
    }
  }

  clearListType(): void {
    this.listType = null;
    this.fixedDateReason = '';
  }

  handleValidSubmit(): void {
    this.formSubmit.emit({
      tier: this.tier,
      tier2Subcategory: this.tier === TIER_2 ? this.tier2Subcategory : undefined,
      listType: this.listType || undefined,
      fixedDateReason:
        this.listType === LIST_TYPE_FIXED_DATE ? this.fixedDateReason?.trim() : undefined
    });
  }
}
