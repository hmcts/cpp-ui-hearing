import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkResizeDirective,
  PdkTextInputDirective
} from '@cpp/pdk';

@Component({
  selector: 'cpp-draft-result-parser',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form pdk-form novalidate>
      <pdk-form-field label="Enter result for {{ label }}" labelType="none">
        <textarea #rawText name="rawText" pdk-resize pdk-text-input ngModel> </textarea>
      </pdk-form-field>
    </form>
  `,
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkTextInputDirective,
    PdkResizeDirective
  ]
})
export class DraftResultParserComponent {
  @Input() label: string;

  @ViewChild(NgForm) form: NgForm;
  @ViewChild('rawText') rawTextRef: ElementRef;

  clear() {
    this.form.resetForm({ rawText: '' });
  }

  focus() {
    this.rawTextRef.nativeElement.focus();
  }

  getRawTextValue(): string {
    return this.form.value.rawText || '';
  }
}
