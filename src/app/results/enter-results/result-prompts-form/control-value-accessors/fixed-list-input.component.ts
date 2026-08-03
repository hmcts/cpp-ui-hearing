import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Injector,
  Input,
  Type
} from '@angular/core';
import { ControlValueAccessor, NgControl, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import {
  FormFieldControl,
  FormFieldControlV2,
  PdkBorderColorDirective,
  PdkCheckboxComponent,
  PdkCheckboxConditionalComponent,
  PdkCheckboxGroupComponent,
  PdkFormFieldComponent,
  PdkInputDirective,
  PdkLinkDirective,
  PdkMarginDirective,
  PdkMinCountValidatorDirective,
  PdkPaddingDirective,
  PdkSelectComponent,
  PdkTextInputDirective,
  generateId
} from '@cpp/pdk';
import { uniq } from 'lodash-es';

@Component({
  selector: 'cpp-fixed-list-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if ((fixedList || []).length > limit || limit === 1) { @for (valueIndex of valueIndexes; track
    $index; let i = $index) {
    <pdk-select
      [ariaDescribedBy]="ariaDescribedBy"
      [(ngModel)]="valueIndexes[i]"
      [ngModelOptions]="{}"
      (ngModelChange)="onChange()"
      [hasError]="hasError"
      justified
      [ariaLabel]="ariaLabel"
      [required]="(actualValues || []).length < limit"
    >
      @for (fixedListValue of fixedList; track $index; let idx = $index) {
      <option [value]="idx">{{ fixedListValue }}</option>
      } @if (customOptionEnabled) {
      <option [value]="customOptionIndex">Other</option>
      }
    </pdk-select>
    @if (valueIndexes.includes(customOptionIndex)) {
    <div
      pdk-margin-top="2"
      pdk-border-colour="mid-grey"
      pdk-padding-left="3"
      pdk-padding-top="3"
      style="border-left: 4px solid"
    >
      <pdk-form-field label="Enter description" labelType="small">
        <input
          type="text"
          pdk-input
          pdk-text-input
          [(ngModel)]="customOptionText"
          (ngModelChange)="onChange()"
          [ngModelOptions]="{}"
          required
        />
      </pdk-form-field>
    </div>
    } @if ((valueIndexes || []).length > 1) {
    <div pdk-margin-top="1" pdk-margin-bottom="2">
      <a
        pdk-link
        role="button"
        href="javascript:void(0)"
        (click)="valueIndexes.splice(i, 1); onChange()"
        >Delete</a
      >
    </div>
    } } @if ((valueIndexes || []).length < limit) {
    <div pdk-margin-top="3">
      <a pdk-link role="button" href="javascript:void(0)" (click)="valueIndexes.push(null)"
        >Add another option</a
      >
    </div>
    } } @if ((fixedList || []).length <= limit && limit !== 1) {
    <pdk-checkbox-group
      [ariaDescribedBy]="ariaDescribedBy"
      [(ngModel)]="valueIndexes"
      [ngModelOptions]="{}"
      (ngModelChange)="onChange()"
      [minCount]="required ? 1 : null"
    >
      @for (fixedListValue of fixedList; track $index; let idx = $index) {
      <pdk-checkbox [value]="idx.toString()">{{ fixedListValue }}</pdk-checkbox>
      } @if (customOptionEnabled) {
      <pdk-checkbox [value]="customOptionIndex">Other</pdk-checkbox>
      @if (valueIndexes.includes(customOptionIndex)) {
      <pdk-checkbox-conditional>
        <pdk-form-field label="Other" labelType="none">
          <input
            type="text"
            pdk-input
            pdk-text-input
            [(ngModel)]="customOptionText"
            [ngModelOptions]="{}"
            (ngModelChange)="onChange()"
            required
          />
        </pdk-form-field>
      </pdk-checkbox-conditional>
      } }
    </pdk-checkbox-group>
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FixedListInputComponent),
      multi: true
    },
    {
      provide: FormFieldControl,
      useExisting: forwardRef(() => FixedListInputComponent)
    }
  ],
  imports: [
    FormsModule,
    PdkCheckboxGroupComponent,
    PdkCheckboxComponent,
    PdkInputDirective,
    PdkTextInputDirective,
    PdkMarginDirective,
    PdkSelectComponent,
    PdkFormFieldComponent,
    PdkCheckboxConditionalComponent,
    PdkBorderColorDirective,
    PdkPaddingDirective,
    PdkMinCountValidatorDirective,
    PdkLinkDirective
  ]
})
export class FixedListInputComponent implements ControlValueAccessor, FormFieldControlV2 {
  @Input() ariaDescribedBy: string;
  // When true, the fixed list supports adding custom text via the 'Other' option
  @Input() customOptionEnabled = false;
  @Input() hasError = false;
  @Input() fixedList: string[] = [];
  @Input() limit = Infinity;
  @Input() required = false;
  @Input() ariaLabel: string | null;

  id = generateId('cpp-fixed-list-group-input');

  controlType = 'select';
  customOptionText = '';
  errorMessages = [{ rule: 'required', message: 'Select an option' }];
  multi = true;
  // Unfortunately, indexes must be stored as strings because angular was
  // released less than 6 years ago, and it takes longer than that for an
  // <option> element to handle binding a value as anything other than a
  // string. Check back in ten years, when they might have fixed this
  // (they won't have). You could try using [ngValue] on the <option> but
  // that won't work either because whatever.
  valueIndexes: string[] = [];

  constructor(private cdr: ChangeDetectorRef, private injector: Injector) {}

  get customOptionIndex(): string {
    return String((this.fixedList || []).length);
  }

  get ngControl(): NgControl {
    return this.injector.get(NgControl as Type<NgControl>);
  }

  get actualValues(): string[] {
    // omit any "empty" values used for rendering to determine actual values
    return this.valueIndexes.filter(Boolean);
  }

  markForCheck() {
    this.cdr.markForCheck();
  }

  onChange = (): void => undefined;

  registerOnChange(fn: (_?: string | string[]) => void): void {
    this.onChange = () => {
      const values = this.valueIndexes
        .map(valueIndex => this.fixedList[Number(valueIndex)])
        .filter(Boolean);

      if (this.valueIndexes.includes(this.customOptionIndex)) {
        values.push(this.customOptionText);
      } else {
        this.customOptionText = '';
      }
      // Where limit is 1 (i.e. the component does not collect multiple values,
      // emit this as a non-array)
      fn(this.limit === 1 ? values[0] || null : (values || []).length === 0 ? null : uniq(values));
    };
  }

  registerOnTouched() {}

  writeValue(rawValue: string | string[] | null) {
    const values = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
    const valueIndexes: string[] = [];
    const unknownValues: string[] = [];
    // pull out any provided values that are not valid by the fixed list
    values.forEach(value => {
      const idx = this.fixedList.indexOf(value.trim());

      if (idx > -1) {
        valueIndexes.push(String(idx));
      } else {
        unknownValues.push(value);
      }
    });

    if (this.customOptionEnabled && (unknownValues || []).length > 0) {
      // Any unknown value can be used to populate the 'Other' option when the
      // customOptionEnabled flag is true. If more than one unknown value is
      // provided, we concatenate these into a single value for population in
      // the customOptionText
      this.customOptionText = unknownValues.join(' ');
      // When customOptionText is found, add the `customOptionIndex` to the list
      // of selected values so that the UI behaves accordingly
      valueIndexes.push(this.customOptionIndex);
    }
    // create a blank entry so that at least one value exists for rendering in
    // the UI via ngFor – use a negative index so that it never maps to an
    // actual entry in the fixed list
    this.valueIndexes = (valueIndexes || []).length === 0 ? ['-1'] : valueIndexes;
    this.markForCheck();
  }
}
