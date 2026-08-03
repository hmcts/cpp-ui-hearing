import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  PdkMarginDirective,
  PdkTextColorDirective,
  PdkVisuallyHiddenDirective,
  PdkDetailsSummary,
  PdkTypographyDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'offence-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './offence-details.component.html',
  imports: [
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkVisuallyHiddenDirective,
    PdkDetailsSummary,
    PdkTypographyDirective,
    TranslatePipe
  ]
})
export class OffenceDetailsComponent {
  @Input() firstname: string;
  @Input() lastname: string;
  @Input() offenceTitle: string;
  @Input() offenceWording: string;
  @Input() showBulkDefendant = false;
  @Input() showOffenceParticulars = false;
  @Input() showOffenceBulkDefendant = false;
}
