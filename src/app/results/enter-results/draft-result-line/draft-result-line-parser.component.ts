import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkInputComponent,
  PdkInputDirective,
  PdkTextInputDirective,
  PdkButtonGroupComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';

@Component({
  selector: 'cpp-draft-result-line-parser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      #form="ngForm"
      pdk-form
      novalidate
      (ngSubmit)="originalTextChange.emit(form.value.originalText)"
    >
      <pdk-form-field label="Enter result text for parsing" labelType="none">
        <input type="text" name="originalText" pdk-input pdk-text-input [ngModel]="originalText" />
      </pdk-form-field>
      <pdk-button-group>
        <button pdk-button type="submit" pdk-link href="javascript:void(0)">
          Create draft result
        </button>
        <a role="button" pdk-link href="javascript:void(0)" (click)="cancel.emit()">Cancel</a>
      </pdk-button-group>
    </form>
  `,
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkInputComponent,
    PdkInputDirective,
    PdkTextInputDirective,
    PdkButtonGroupComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective
  ]
})
export class DraftResultLineParserComponent {
  @Input() originalText?: string;
  @Output() originalTextChange = new EventEmitter<string>();
  @Output() cancel = new EventEmitter();
}
