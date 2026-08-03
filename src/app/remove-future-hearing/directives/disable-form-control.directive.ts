import { NgControl } from '@angular/forms';
import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[disableControl]'
})
export class DisableControlDirective {
  @Input() set disableControl(condition: boolean) {
    const action = condition ? 'disable' : 'enable';
    if (this.ngControl.control) {
      this.ngControl.control[action]({ emitEvent: false });
    }
  }

  constructor(private ngControl: NgControl) {}
}
