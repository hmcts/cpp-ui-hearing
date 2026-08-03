import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { PromptChoice } from '../../../results.interfaces';
import { ErrorMessageConfig, PdkFormFieldComponent, PdkInput, PdkTextInput } from '@cpp/pdk';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

@Component({
  selector: 'cpp-int-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field
      [errorMessages]="errorMessages"
      [label]="promptChoice | promptChoiceLabel"
      [labelType]="labelHidden ? 'none' : 'small'"
    >
      <input
        #input="ngModel"
        type="text"
        [pdk-input]="10"
        pdk-text-input="number"
        [ngModel]="value"
        [name]="promptChoice.promptRef"
        [promptChoiceValidator]="promptChoice"
      />
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
    PdkTextInput,
    PdkInput,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective
  ]
})
export class IntPromptChoiceComponent {
  @Input() labelHidden = false;
  @Input() promptChoice: PromptChoice;
  @Input() value?: string;

  errorMessages: ErrorMessageConfig[] = [
    {
      rule: 'maximumValue',
      message: `Enter a value that is not greater than {{expected}}`
    },
    {
      rule: 'minimumValue',
      message: `Enter a value that is greater than or equal to {{expected}}`
    },
    {
      rule: 'exactLength',
      message: `Enter a value with {{expected}} characters`
    },
    {
      rule: 'maximumLength',
      message: `Enter a value that is less than {{expected}} characters`
    },
    {
      rule: 'minimumLength',
      message: `Enter a value that is greater than {{expected}} characters`
    }
  ];
}
