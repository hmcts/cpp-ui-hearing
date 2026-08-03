import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild
} from '@angular/core';
import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';

import {
  PdkFocusTrapComponent,
  PdkPaddingDirective,
  PdkVisuallyHiddenDirective,
  PdkAlertComponent,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkListDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'case-access-modal',
  template: `
    @if (show) {
    <div
      class="block modal fade in"
      pdk-focus-trap
      bsModal
      [config]="modalConfig"
      role="alertdialog"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div pdk-padding="4">
            <h2 pdk-visually-hidden>{{ 'CASE_ALERT.CASES_TODAY' | translate }}</h2>
            <pdk-alert icon="true" type="warning" pdk-typography="body-medium">
              <span pdk-visually-hidden>Warning: </span>
              {{ 'CASE_ALERT.ALERT_TITLE' | translate }}
            </pdk-alert>
            <p pdk-typography="body-medium" pdk-margin-top="4">
              {{ 'CASE_ALERT.DESCRIPTION' | translate }}
            </p>
            <ul pdk-list="bullet" class="urn-list" data-test-id="alertUrnList">
              @for (urn of urns; track urn) {
              <li class="bold">
                {{ urn }}
              </li>
              }
            </ul>
            <form
              #form="ngForm"
              pdk-form
              novalidate
              (validSubmit)="submitDecision(form.value.hasTodayHearing)"
              data-test-id="caseAlertForm"
            >
              <pdk-form-field label="{{ 'CASE_ALERT.SELECTION_TITLE' | translate }}">
                <pdk-radio-group name="hasTodayHearing" data-role="access-decision" ngModel>
                  <pdk-radio-button [value]="true">
                    {{ 'CASE_ALERT.RUNNING_HEARING_TODAY' | translate }}
                  </pdk-radio-button>
                  <pdk-radio-button [value]="false">
                    {{ 'CASE_ALERT.NOT_RUNNING_HEARING_TODAY' | translate }}
                  </pdk-radio-button>
                </pdk-radio-group>
              </pdk-form-field>
              <div class="button-holder">
                <button pdk-button pdk-margin-bottom="0" type="submit" [disabled]="!form.touched">
                  {{ 'COMMON.CONTINUE' | translate }}
                </button>
                <a pdk-link pdk-margin-left="4" href="javascript:void(0);" (click)="cancel()">
                  {{ 'COMMON.CANCEL' | translate }}
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .button-holder {
        display: flex;
        align-items: center;
      }
      ​ .urn-list {
        max-height: 250px;
        overflow-y: auto;
      }
      .block {
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkFocusTrapComponent,
    ModalModule,
    PdkPaddingDirective,
    PdkVisuallyHiddenDirective,
    PdkAlertComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkListDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    TranslatePipe
  ]
})
export class CaseAccessModalComponent implements OnChanges {
  readonly modalConfig = {
    show: true,
    backdrop: true,
    ignoreBackdropClick: true,
    keyboard: false
  };
  @Input() urns: string[];
  @Input() show: boolean;
  @Input() onCancelAction?: () => void;
  @Input() onSubmitAction?: (decision: boolean) => void;
  @Output() onSubmit: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onCancel: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild(ModalDirective) modal: ModalDirective;

  ngOnChanges(): void {
    if (this.show && this.modal) {
      this.modal.show();
    }
  }

  submitDecision(decision: boolean) {
    if (this.onSubmitAction) {
      this.onSubmitAction(decision);
    }
    this.onSubmit.emit(decision);
    this.modal.hide();
  }

  cancel() {
    if (this.onSubmitAction) {
      this.onCancelAction();
    }
    this.onCancel.emit();
    this.modal.hide();
  }
}
