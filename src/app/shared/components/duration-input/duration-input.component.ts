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
import { DraftResultPromptValue } from '../../../results/results.interfaces';

@Component({
  selector: 'duration-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (inputOption of inputOptions; track inputOption.label) {
    <div style="display: inline-block">
      <label pdk-label [attr.for]="id + inputOption.label">{{ inputOption.label }}</label>
      <input
        [ngModel]="writtenValues[inputOption.label]"
        (ngModelChange)="handleDurationChange()"
        [pdk-input]="3"
        [hasError]="hasError"
        [attr.aria-describedby]="ariaDescribedBy"
        [attr.id]="id + inputOption.label"
        [name]="inputOption.label"
        type="text"
        pattern="^(?:[1-9][0-9]*)"
        maxlength="4"
        autocomplete="off"
        [pdk-margin-right]="2"
        (keydown)="handleKeyDown($event)"
      />
    </div>
    }
  `,
  providers: [
    {
      provide: FormFieldControl,
      useExisting: DurationInputComponent
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
  @Input() ariaDescribedBy: string;
  @Input() hasError = false;

  inputOptions: { label: string }[] = [
    { label: 'Weeks' },
    { label: 'Days' },
    { label: 'Hours' },
    { label: 'Minutes' }
  ];

  id = generateId('duration-input');

  @ViewChildren(NgModel) durationInputs: QueryList<NgModel>;

  controlType = 'duration';
  errorMessages = [
    { rule: 'required', message: 'Enter a number under one unit of time, for example 22 days' },
    { rule: 'durationUnitType', message: 'Use only one duration unit' },
    { rule: 'durationFormat', message: 'Enter a valid number' }
  ];
  multi = true;
  writtenValues: Record<string, string> = {};

  constructor(private cdr: ChangeDetectorRef, private injector: Injector) {}

  get ngControl(): NgControl {
    return this.injector.get(NgControl as Type<NgControl>);
  }

  private onChange = (_?: DraftResultPromptValue[]): void => undefined;

  handleDurationChange() {
    this.onChange(
      this.durationInputs
        .filter(ngModel => ngModel.value)
        .map(({ name, value }) => {
          return { label: name.toUpperCase(), value };
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

  registerOnChange(fn: (_?: DraftResultPromptValue[]) => void): void {
    this.onChange = fn.bind(this);
  }

  registerOnTouched() {}

  validate(c: UntypedFormControl): ValidationErrors | null {
    // treat an empty value as valid so that the input can be optional
    if (!c.value) {
      return null;
    }
    const durationFormat = this.durationInputs.reduce(
      (errors: { [k: string]: ValidationErrors | null }, ngModel) => {
        if (!ngModel.valid) {
          return {
            ...(errors || {}),
            [ngModel.name]: ngModel.errors
          };
        }
        return errors;
      },
      null
    );

    if (durationFormat) {
      return { durationFormat };
    }

    if (c.value.length > 1) {
      return {
        durationUnitType: c.value.length
      };
    }

    return null;
  }

  writeValue(values: DraftResultPromptValue[] | null) {
    if (values && Array.isArray(values)) {
      this.writtenValues = values.reduce((acc, item) => {
        const normalizedLabel =
          item.label.charAt(0).toUpperCase() + item.label.slice(1).toLowerCase();
        acc[normalizedLabel] = String(item.value);
        return acc;
      }, {} as Record<string, string>);
    } else {
      this.writtenValues = {};
    }

    this.cdr.detectChanges();
  }
}
