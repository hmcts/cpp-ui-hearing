import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { PdkErrorSummaryComponent } from '@cpp/pdk';

@Component({
  selector: 'check-in-error-summary',
  template: `
    @if (errors && errors.length > 0) {
    <pdk-error-summary [errors]="errors" focusOnChange> </pdk-error-summary>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkErrorSummaryComponent]
})
export class CheckInErrorSummaryComponent {
  @Input() errors: ValidationErrors[];
}
