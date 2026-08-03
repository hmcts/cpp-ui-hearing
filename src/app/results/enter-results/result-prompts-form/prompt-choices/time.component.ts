import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { PdkFormFieldComponent, PdkTimeInputComponent } from '@cpp/pdk';
import { PromptChoice } from '../../../results.interfaces';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

@Component({
  selector: 'cpp-time-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field [label]="promptChoice | promptChoiceLabel" labelType="small">
      <pdk-time-input
        [name]="promptChoice.promptRef"
        [ngModel]="value"
        [promptChoiceValidator]="promptChoice"
      ></pdk-time-input>
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
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective,
    PdkFormFieldComponent,
    PdkTimeInputComponent
  ]
})
export class TimePromptChoiceComponent {
  @Input() promptChoice: PromptChoice;
  @Input() value?: string;
}
