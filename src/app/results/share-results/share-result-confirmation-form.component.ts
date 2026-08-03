import { Component, Inject } from '@angular/core';
import {
  PDK_MODAL_DATA_TOKEN,
  PdkFormComponent,
  PdkFillColorDirective,
  PdkPaddingDirective,
  PdkAlertComponent,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkButtonGroupComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';

export interface ShareResultConfirmationData extends Record<string, unknown> {
  onSubmit: () => void;
  onCancel: () => void;
}

@Component({
  selector: 'cpp-share-result-confirmation-form',
  template: `
    <form
      #form="ngForm"
      pdk-form
      pdk-fill-colour="white"
      pdk-padding-top="6"
      pdk-padding-bottom="2"
      pdk-padding-horizontal="6"
      (ngSubmit)="modalData.onSubmit()"
    >
      <pdk-alert icon>Sharing results with relevant parties</pdk-alert>
      <p pdk-typography="body" pdk-margin-top="3">
        <strong>You are about to share this result with other unresulted offences.</strong>
      </p>
      <p pdk-typography="body">Do you still wish to share the result?</p>
      <pdk-button-group>
        <button type="submit" pdk-button>Yes</button>
        <a role="button" pdk-link href="javascript:void(0)" (click)="modalData.onCancel()">No</a>
      </pdk-button-group>
    </form>
  `,
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkAlertComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkButtonGroupComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective
  ]
})
export class ShareResultConfirmationFormComponent {
  constructor(@Inject(PDK_MODAL_DATA_TOKEN) public modalData: ShareResultConfirmationData) {}
}
