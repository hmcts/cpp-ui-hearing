import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { OffenceType } from '../../../core';
import {
  PdkInsetTextComponent,
  PdkMarginDirective,
  PdkTextColorDirective,
  PdkTypographyDirective
} from '@cpp/pdk';
@Component({
  selector: 'offence',
  template: `
    <pdk-inset-text pdk-margin-vertical="2">
      <span pdk-text-colour="dark-grey">{{ offence.cjsOffenceCode }}</span>
      <br />
      <span pdk-typography="body-large" class="bold">{{ offence.title }}</span>
      <br />
      <span pdk-typography="body-medium" pdk-text-colour="dark-grey">{{
        offence.legislation
      }}</span>
    </pdk-inset-text>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkInsetTextComponent,
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkTypographyDirective
  ]
})
export class OffenceComponent {
  @Input() offence: OffenceType;
}
