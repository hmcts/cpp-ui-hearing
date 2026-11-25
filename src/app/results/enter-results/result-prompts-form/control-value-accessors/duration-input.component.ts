import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Injector,
  Input,
  QueryList,
  Type,
  ViewChildren
} from '@angular/core';
import {
  ControlValueAccessor,
  UntypedFormControl,
  NgControl,
  NgModel,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  FormsModule
} from '@angular/forms';
import {
  FormFieldControl,
  FormFieldControlV2,
  generateId,
  PdkLabelDirective,
  PdkLabelComponent,
  PdkInputComponent,
  PdkInputDirective,
  PdkMarginDirective
} from '@cpp/pdk';
import {
  DraftResultPrompt,
  DraftResultPromptValue,
  DurationPromptChoice
} from '../../../results.interfaces';

@Component({
  selector: 'cpp-duration-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (child of promptChoice.children; track $index) {
    <div style="display: inline-block">
      <label pdk-label [attr.for]="id + child.label">{{ child.label }}</label>
      <input
        [ngModel]="writtenValues[child.label]"
        (ngModelChange)="handleDurationChange()"
        [ngModelOptions]="{ standalone: true }"
        [pdk-input]="3"
        [hasError]="hasError"
        [attr.aria-describedby]="ariaDescribedBy"
        [attr.id]="id + child.label"
        [name]="child.label"
        type="text"
        pattern="^(?:[1-9][0-9]*)"
        maxlength="4"
        autocomplete="off"
        pdk-margin-right="2"
        (keydown)="handleKeyDown($event)"
      />
    </div>
    }
  `,
  providers: [
    {
      provide: FormFieldControl,
      useExisting: forwardRef(() => DurationInputComponent)
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DurationInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DurationInputComponent),
      multi: true
    }
  ],
  imports: [
    PdkLabelDirective,
    PdkLabelComponent,
    FormsModule,
    PdkInputComponent,
    PdkInputDirective,
    PdkMarginDirective
  ]
})
export class DurationInputComponent implements ControlValueAccessor, FormFieldControlV2, Validator {
  readonly digitsOnlyRegex = /^\d+$/;

  @Input() ariaDescribedBy: string;
  @Input() hasError = false;
  @Input() promptChoice: DurationPromptChoice;

  id = generateId('cpp-result-prompts-form-duration-input');

  @ViewChildren(NgModel) durationInputs: QueryList<NgModel>;

  controlType = 'duration';
  errorMessages = [
    {
      rule: 'required',
      message: 'Enter a number under one unit of time, for example 22 days'
    },
    {
      rule: 'durationUnitType',
      message: 'Use only one duration unit'
    },
    {
      rule: 'durationFormat',
      message: 'Enter a valid number'
    },
    {
      rule: 'maximumValue',
      message: `Enter a value that is not greater than {{maxValue}}`
    },
    {
      rule: 'minimumValue',
      message: `Enter a value that is greater than or equal to {{minValue}}`
    },
    {
      rule: 'number',
      message: `Enter a valid number`
    }
  ];
  multi = true;
  writtenValues: Record<string, string> = {};

  constructor(private cdr: ChangeDetectorRef, private injector: Injector) {}

  get ngControl(): NgControl {
    return this.injector.get(NgControl as Type<NgControl>);
  }

  private onChange = (_?: DraftResultPrompt[]): void => undefined;

  handleDurationChange() {
    this.onChange(
      this.durationInputs
        .filter(ngModel => ngModel.value)
        .map(({ name, value }) => {
          const child = this.promptChoice.children.find(({ label }) => label === name);

          return {
            promptRef: name,
            promptId: child.code,
            label: child.label,
            type: child.type,
            welshLabel: child.welshLabel,
            value
          };
        })
    );
  }

  handleKeyDown($event: KeyboardEvent) {
    // Allow: backspace, delete, tab, escape, enter and .
    if ([46, 8, 9, 27, 13, 110, 190].indexOf($event.keyCode) > -1) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if (
      ($event.shiftKey || $event.keyCode < 48 || $event.keyCode > 57) &&
      ($event.keyCode < 96 || $event.keyCode > 105)
    ) {
      $event.preventDefault();
    }
  }

  markForCheck() {
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (_?: DraftResultPrompt[]) => void): void {
    this.onChange = fn.bind(this);
  }

  registerOnTouched() {}

  validate(c: UntypedFormControl): ValidationErrors | null {
    // treat an empty value as valid so that the input can be optional
    if (!c.value) {
      return null;
    }

    if (c.value.length > 1 && !this.promptChoice.multipleAllowed) {
      return {
        durationUnitType: c.value.length
      };
    }

    let errors = {};
    this.durationInputs.forEach(ngModel => {
      const child = this.promptChoice.children.find(({ label }) => label === ngModel.name);
      const maxValue = Number(child.maxValue || Infinity);
      const minValue = Number(child.minValue || 0);

      if (ngModel.value) {
        if (!this.digitsOnlyRegex.test(String(ngModel.value))) {
          errors = { number: true };
          return;
        }

        const value = Number(ngModel.value);

        if (value >= 0) {
          if (!ngModel.valid) {
            errors = { durationFormat: ngModel.errors };
          }

          if (value < minValue) {
            errors = { minimumValue: { minValue } };
          }

          if (value > maxValue) {
            errors = { maximumValue: { maxValue } };
          }
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      return { ...errors };
    }

    return null;
  }

  writeValue(values: DraftResultPromptValue[] | null) {
    if (values) {
      this.writtenValues = values.reduce(
        (inputValues, draftResultPrompts) => ({
          ...inputValues,
          [draftResultPrompts.label]: draftResultPrompts.value
        }),
        {}
      );
    } else {
      this.writtenValues = {};
    }
    this.cdr.detectChanges();
  }
}
