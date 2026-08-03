import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[noWhitespaceValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NoWhitespaceValidator),
      multi: true
    }
  ]
})
export class NoWhitespaceValidator implements Validator {
  validate(c: AbstractControl): ValidationErrors | null {
    if (c.value) {
      const invalid = c.value.replace(/\s/g, '').length === 0;
      if (invalid) {
        const controlName = this.getControlName(c);
        const containsOnlyWhitespaces = { [controlName]: invalid };
        return { containsOnlyWhitespaces };
      }
    }

    return null;
  }

  getControlName(c: AbstractControl): string | null {
    const formGroup = c.parent.controls as Record<string, AbstractControl>;
    return Object.keys(formGroup).find(name => c === formGroup[name]) || null;
  }
}
