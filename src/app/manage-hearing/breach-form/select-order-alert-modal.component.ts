import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  ViewChild
} from '@angular/core';

import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
import {
  PdkPaddingDirective,
  PdkWarningTextComponent,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'select-order-alert',
  template: `
    <div class="modal fade in" bsModal role="alertdialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div pdk-padding="4">
            <pdk-warning-text icon="true" type="warning" pdk-typography="body-medium">
              {{ 'ENTER_BREACHES.ALERT.TITLE' | translate }}
            </pdk-warning-text>
            <p pdk-typography="body-medium" pdk-margin-top="4">
              {{ 'ENTER_BREACHES.ALERT.DESCRIPTION' | translate }}
            </p>
            <button pdk-button pdk-margin-bottom="0" type="submit" (click)="dismiss()">
              {{ 'COMMON.CONTINUE' | translate }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalModule,
    PdkPaddingDirective,
    PdkWarningTextComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ]
})
export class SelectOrderModalComponent implements AfterViewInit {
  @ViewChild(ModalDirective, { static: false }) modal: ModalDirective;
  @Output() onDismiss: EventEmitter<void> = new EventEmitter<void>();

  ngAfterViewInit(): void {
    this.modal.show();
  }

  dismiss(): void {
    this.onDismiss.emit();
    this.modal.hide();
  }
}
