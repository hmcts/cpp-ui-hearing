import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PdkMarginDirective, PdkTextColorDirective } from '@cpp/pdk';

@Component({
  selector: 'application-details',
  templateUrl: './application-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkMarginDirective, PdkTextColorDirective]
})
export class ApplicationDetailsComponent {
  @Input() legislation: string;
  @Input() type: string;
}
