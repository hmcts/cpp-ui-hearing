import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { FixedListPromptChoice } from '../../../results.interfaces';
import { PdkFormFieldComponent } from '@cpp/pdk';
import { FixedListInputComponent } from '../control-value-accessors/fixed-list-input.component';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

@Component({
  selector: 'cpp-fixlm-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field
      [label]="promptChoice | promptChoiceLabel"
      [labelType]="labelHidden ? 'none' : 'small'"
    >
      <cpp-fixed-list-input
        #x="ngModel"
        [ngModel]="value"
        [name]="promptChoice.promptRef"
        [fixedList]="promptChoice.fixedList"
        [limit]="8"
        [promptChoiceValidator]="promptChoice"
      >
      </cpp-fixed-list-input>
    </pdk-form-field>
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: NgForm
    }
  ],
  imports: [
    FormsModule,
    PdkFormFieldComponent,
    FixedListInputComponent,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective
  ]
})
export class FixlmPromptChoiceComponent {
  @Input() labelHidden = false;
  @Input() promptChoice: FixedListPromptChoice;
  @Input() value?: string[];
}
