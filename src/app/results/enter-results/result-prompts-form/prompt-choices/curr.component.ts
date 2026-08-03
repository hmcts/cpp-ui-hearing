import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { ErrorMessageConfig, PdkFormFieldComponent, PdkCurrencyInputComponent } from '@cpp/pdk';
import { CurrencyPromptChoice } from '../../../results.interfaces';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

@Component({
  selector: 'cpp-curr-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field
      [errorMessages]="errorMessages"
      [label]="promptChoice | promptChoiceLabel"
      labelType="small"
    >
      <pdk-currency-input
        [inputWidth]="10"
        [name]="promptChoice.promptRef"
        [ngModel]="value"
        [min]="promptChoice.minValue"
        [max]="promptChoice.maxValue"
        [promptChoiceValidator]="promptChoice"
      >
      </pdk-currency-input>
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
    PdkCurrencyInputComponent,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective
  ]
})
export class CurrPromptChoiceComponent {
  @Input() promptChoice: CurrencyPromptChoice;
  @Input() value?: string;

  errorMessages: ErrorMessageConfig[] = [
    {
      rule: 'currency',
      message: 'Enter an amount greater than £0'
    },
    {
      rule: 'currencyMin',
      message: `Enter an amount equal to or greater than £{{expected}}`
    },
    {
      rule: 'currencyFormat',
      message: 'Enter a value with 2 decimal places'
    },
    {
      rule: 'currencyMax',
      message: `Enter a value that is not greater than £{{expected}}`
    }
  ];
}
