import { Component, Inject } from '@angular/core';

import {
  PDK_MODAL_DATA_TOKEN,
  PdkAlertComponent,
  PdkFillColorDirective,
  PdkLinkDirective,
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkTypographyDirective
} from '@cpp/pdk';

export interface AmendmentNoticeData extends Record<string, unknown> {
  noticeType: 'NEXH';
  onCancel: () => void;
}

@Component({
  selector: 'cpp-amendment-notice',
  template: `
    <div pdk-fill-colour="white" pdk-padding="4">
      <div pdk-margin-bottom="3">
        @switch (modalData.noticeType) { @case ('NEXH') {
        <pdk-alert icon="true" type="notice" pdk-typography="body-medium">
          Result can't be amended as the case has a hearing today or in the past
        </pdk-alert>
        } }
      </div>

      <a
        role="button"
        pdk-link
        href="javascript:void(0)"
        (click)="modalData.onCancel()"
        pdk-typography="body"
        >Cancel</a
      >
    </div>
  `,
  imports: [
    PdkAlertComponent,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkLinkDirective,
    PdkTypographyDirective,
    PdkMarginDirective
  ]
})
export class AmendmentReasonNoticeComponent {
  constructor(@Inject(PDK_MODAL_DATA_TOKEN) public modalData: AmendmentNoticeData) {}
}
