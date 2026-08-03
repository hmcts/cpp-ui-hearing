import { Directive, forwardRef, Input, OnChanges } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { validateFutureDateValue } from '../../core/helpers';

/**
 * Validates that an entered date is strictly after a hearing day. Applied to
 * date prompt inputs that require a future date (i.e. where the prompt choice
 * has `futureDate` set), with the hearing day supplied as the directive value.
 *
 * When no hearing day is provided the validator is inert, so it can be bound
 * conditionally without needing to be removed from the template.
 *
 * Usage:
 *   <pdk-date-input
 *     [(ngModel)]="value"
 *     [hearingDayDateValidator]="hearingDay"
 *   ></pdk-date-input>
 */
@Directive({
  selector: '[hearingDayDateValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => HearingDayDateValidatorDirective)
    }
  ]
})
export class HearingDayDateValidatorDirective implements Validator, OnChanges {
  @Input() hearingDayDateValidator?: string | null;

  private onValidatorChange?: () => void;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.hearingDayDateValidator) {
      return null;
    }
    return validateFutureDateValue(control.value, this.hearingDayDateValidator);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  ngOnChanges(): void {
    // Re-run validation when the hearing day arrives or changes.
    this.onValidatorChange?.();
  }
}
