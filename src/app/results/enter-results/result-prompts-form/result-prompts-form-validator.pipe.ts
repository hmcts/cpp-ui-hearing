import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { validateValueForPromptChoice } from '../../core/helpers';
import { PromptChoice } from '../../results.interfaces';

@Pipe({ name: 'promptChoiceValidator' })
export class ResultPromptsFormValidatorPipe implements PipeTransform {
  transform(promptChoice: PromptChoice): ValidatorFn {
    return (control: AbstractControl) => {
      return validateValueForPromptChoice(promptChoice, control.value);
    };
  }
}
