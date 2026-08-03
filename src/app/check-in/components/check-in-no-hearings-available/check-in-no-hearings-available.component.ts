import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PdkWarningTextComponent, PdkMarginDirective } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'check-in-no-hearings-available',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-warning-text pdk-margin-top="9">
      {{ 'CHECK_IN.NO_HEARINGS_AVAILABLE' | translate }}
    </pdk-warning-text>
  `,
  imports: [PdkWarningTextComponent, PdkMarginDirective, TranslatePipe]
})
export class CheckInNoHearingsAvailableComponent {}
