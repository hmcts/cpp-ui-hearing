import { Component, Input } from '@angular/core';
import { PdkTypographyDirective, PdkMarginDirective, PdkLinkDirective } from '@cpp/pdk';

@Component({
  selector: 'hearing-list-feedback-panel',
  template: `
    <div>
      <h4 pdk-typography="heading-small" pdk-margin-bottom="2" pdk-margin-top="3">
        {{ title }}
      </h4>
      <a pdk-link target="”_blank”" href="{{ configFeedbackUrl }}">
        {{ feedbackText }}
      </a>
      <a pdk-link target="”_blank”" href="{{ configGuidanceUrl }}">
        {{ guidanceText }}
      </a>
    </div>
  `,
  styles: [
    `
      a {
        display: inline-block;
        margin-bottom: 10px;
      }
    `
  ],
  imports: [PdkTypographyDirective, PdkMarginDirective, PdkLinkDirective]
})
export class HearingListFeedbackPanelComponent {
  @Input() configGuidanceUrl: string;
  @Input() configFeedbackUrl: string;
  @Input() title: string;
  @Input() feedbackText: string;
  @Input() guidanceText: string;
}
