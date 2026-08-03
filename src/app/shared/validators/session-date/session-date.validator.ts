import { Directive, forwardRef, EventEmitter, Output } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator, ValidationErrors } from '@angular/forms';
import { getCPPDate } from '../../../core';

@Directive({
  selector: '[sessionDateValidator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SessionDateValidator),
      multi: true
    }
  ]
})
export class SessionDateValidator implements Validator {
  @Output()
  sessionDateValidated = new EventEmitter<string>();

  validate(c: AbstractControl): ValidationErrors | null {
    if (c.value) {
      const cppDate = getCPPDate();
      const selectedDate = cppDate.localDate(c.value);
      const currentDate = cppDate.getCurrentDate();

      // Selected date cant be in the future
      if (cppDate.isAfter(selectedDate, currentDate)) {
        this.sessionDateValidated.emit('SESSION_TIMES.SESSION_DATE_IN_FUTURE_ERROR');
        return { sessionDateInFuture: true };
      }
    }
    this.sessionDateValidated.emit('SESSION_TIMES.SESSION_DATE_REQUIRED_MESSAGE');
    return null;
  }
}
