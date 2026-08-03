import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { PdkFormFieldComponent, PdkCheckboxComponent } from '@cpp/pdk';
import { YesboxPromptChoice } from '../../../results.interfaces';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';

@Component({
  selector: 'cpp-yesbox-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field
      [label]="promptChoice | promptChoiceLabel"
      [labelType]="labelHidden ? 'none' : 'small'"
    >
      <pdk-checkbox [name]="promptChoice.promptRef" [ngModel]="value">
        {{ promptChoice.yesBoxText || '' }}
      </pdk-checkbox>
    </pdk-form-field>
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: NgForm
    }
  ],
  imports: [FormsModule, ResultPromptsFormLabelPipe, PdkFormFieldComponent, PdkCheckboxComponent]
})
export class YesboxPromptChoiceComponent {
  @Input() labelHidden = false;
  @Input() promptChoice: YesboxPromptChoice;
  @Input() value = false;
}
