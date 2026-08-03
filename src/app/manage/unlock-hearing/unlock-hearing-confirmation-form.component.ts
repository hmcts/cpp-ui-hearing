import { Component, Inject } from '@angular/core';

import {
  PDK_MODAL_DATA_TOKEN,
  PdkFormComponent,
  PdkFillColorDirective,
  PdkPaddingDirective,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkButtonGroupComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

export interface UnlockHearingConfirmationData extends Record<string, unknown> {
  onSubmit: () => void;
  onCancel: () => void;
}

@Component({
  selector: 'cpp-unlock-hearing-confirmation-form',
  template: `
    <form
      #form="ngForm"
      pdk-form
      pdk-fill-colour="white"
      pdk-padding-top="3"
      pdk-padding-bottom="1"
      pdk-padding-horizontal="6"
      (ngSubmit)="modalData.onSubmit()"
    >
      <p pdk-typography="body" pdk-margin-top="3">
        <strong>{{ 'MANAGE.UNLOCK_HEARING_MODAL.UNLOCK_HEARING' | translate }}</strong>
      </p>
      <p pdk-typography="body">
        {{ 'MANAGE.UNLOCK_HEARING_MODAL.UNLOCK_HEARING_WARNING' | translate }}
      </p>
      <pdk-button-group>
        <button type="submit" pdk-button>{{ 'COMMON.CONTINUE' | translate }}</button>
        <a role="button" pdk-link href="javascript:void(0)" (click)="modalData.onCancel()">{{
          'COMMON.CANCEL' | translate
        }}</a>
      </pdk-button-group>
    </form>
  `,
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkButtonGroupComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    TranslatePipe
  ]
})
export class UnlockHearingConfirmationFormComponent {
  constructor(@Inject(PDK_MODAL_DATA_TOKEN) public modalData: UnlockHearingConfirmationData) {}
}
