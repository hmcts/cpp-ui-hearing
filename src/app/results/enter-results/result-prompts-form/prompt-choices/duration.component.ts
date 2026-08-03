import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { DurationPromptChoice } from '../../../results.interfaces';
import { PdkFormFieldComponent } from '@cpp/pdk';
import { DurationInputComponent } from '../control-value-accessors/duration-input.component';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

@Component({
  selector: 'cpp-duration-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field
      [label]="promptChoice | promptChoiceLabel"
      labelType="small"
      [hintText]="promptChoice.multipleAllowed ? '' : 'Only use one duration unit'"
    >
      <cpp-duration-input
        [ngModel]="value"
        [name]="promptChoice.promptRef"
        [promptChoice]="promptChoice"
        [promptChoiceValidator]="promptChoice"
      ></cpp-duration-input>
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
    DurationInputComponent,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective
  ]
})
export class DurationPromptChoiceComponent {
  @Input() promptChoice: DurationPromptChoice;
  @Input() value?: unknown;
}
