import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { FixedListPromptChoice } from '../../../results.interfaces';
import { PdkFormFieldComponent } from '@cpp/pdk';
import { FixedListInputComponent } from '../control-value-accessors/fixed-list-input.component';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

@Component({
  selector: 'cpp-fixl-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field [label]="promptChoice | promptChoiceLabel" labelType="small">
      <cpp-fixed-list-input
        [ngModel]="value"
        [name]="promptChoice.promptRef"
        [fixedList]="promptChoice.fixedList"
        [limit]="1"
        [ariaLabel]="promptChoice | promptChoiceLabel"
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
export class FixlPromptChoiceComponent {
  @Input() promptChoice: FixedListPromptChoice;
  @Input() value?: string;
}
