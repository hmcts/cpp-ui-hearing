import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { validateValueForPromptChoice } from '../../core/helpers';
import { PromptChoice } from '../../results.interfaces';

/**
 * Validator directive for prompt choices in result forms.
 * Applies validation rules based on the prompt choice configuration.
 *
 * Usage:
 *   <pdk-time-input
 *     [(ngModel)]="value"
 *     [promptChoiceValidator]="promptChoice"
 *   ></pdk-time-input>
 */
@Directive({
  selector: '[promptChoiceValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: forwardRef(() => PromptChoiceValidatorDirective)
    }
  ]
})
export class PromptChoiceValidatorDirective implements Validator {
  @Input() promptChoiceValidator: PromptChoice;

  validate(control: AbstractControl): ValidationErrors | null {
    if (!this.promptChoiceValidator) {
      return null;
    }
    return validateValueForPromptChoice(this.promptChoiceValidator, control.value);
  }
}
