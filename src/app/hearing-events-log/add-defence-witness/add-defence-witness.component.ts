import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkLinkDirective,
  PdkFormFieldComponent,
  PdkTextInputDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { NoWhitespaceValidator } from '../../shared/validators/';

@Component({
  selector: 'add-defence-witness',
  template: `
    <form pdk-form novalidate #f="ngForm" (validSubmit)="witnessNameSelected()">
      <div pdk-margin-top="2" pdk-margin-bottom="2" class="event-log-heading-row">
        <h2 pdk-typography="heading-small">
          <span>{{ 'HEARING_EVENTS_LOG.ADD_WITNESS_NAME' | translate }}</span>
        </h2>
        <a
          pdk-link
          href="javascript:void(0)"
          data-role="witness-name-back"
          pdk-typography="body-xsmall"
          (click)="cancel()"
          >{{ 'COMMON.BACK' | translate }}</a
        >
      </div>
      <div class="witness-name-form-field">
        <pdk-form-field label="Witness name" labelType="none" pdk-margin-bottom="0">
          <input
            pdk-typography="body-xsmall"
            type="text"
            name="witness-title"
            data-role="witness-name-input"
            [(ngModel)]="witnessName"
            pdk-text-input
            required
            noWhitespaceValidator
          />
        </pdk-form-field>
      </div>
      <button
        pdk-margin-top="2"
        pdk-button
        class="button"
        data-role="witness-name-save"
        [disabled]="!f.form.valid || !f.form.dirty"
        type="submit"
      >
        {{ 'COMMON.SAVE' | translate }}
      </button>
    </form>
  `,
  styleUrls: ['./add-defence-witness.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslatePipe,
    PdkFormComponent,
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkLinkDirective,
    PdkFormFieldComponent,
    PdkTextInputDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    NoWhitespaceValidator
  ]
})
export class AddDefenceWitnessComponent {
  @Output() onWitnessNameSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() onCancel: EventEmitter<boolean> = new EventEmitter<boolean>();

  public witnessName = '';

  cancel() {
    this.onCancel.emit(true);
  }

  witnessNameSelected() {
    this.onWitnessNameSelected.emit(this.witnessName.trim());
  }
}
