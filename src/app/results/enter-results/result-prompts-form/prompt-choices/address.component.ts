import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { PdkFormComponent, PdkFormFieldComponent, PdkTextInput } from '@cpp/pdk';
import { keyBy } from 'lodash-es';
import { validateValueForPromptChoice } from '../../../core/helpers';
import { AddressPromptChoice, DraftResultPrompt } from '../../../results.interfaces';

import { PromptChoiceFormatPipe } from '../../../common/pipes/prompt-choice-format.pipe';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
@Component({
  selector: 'cpp-address-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (childPromptChoice of promptChoice.children; track childPromptChoice.promptRef) {
    <pdk-form-field [label]="childPromptChoice | promptChoiceLabel" labelType="small">
      <input
        type="text"
        [name]="childPromptChoice.promptRef"
        [ngModel]="formValues[childPromptChoice.promptRef]?.value"
        pdk-input
        [pdk-text-input]="childPromptChoice | promptChoiceFormat"
      />
    </pdk-form-field>
    }
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: NgForm
    }
  ],
  imports: [
    FormsModule,
    PromptChoiceFormatPipe,
    ResultPromptsFormLabelPipe,
    PdkFormFieldComponent,
    PdkTextInput
  ]
})
export class AddressPromptChoiceComponent {
  @Input() promptChoice: AddressPromptChoice;
  @Input()
  set value(resultPrompt: DraftResultPrompt<DraftResultPrompt[]> | undefined) {
    this.formValues = resultPrompt ? keyBy(resultPrompt.value, 'promptRef') : {};
  }

  formValues: Record<string, DraftResultPrompt> = {};

  constructor(private ngForm: NgForm, private pdkForm: PdkFormComponent) {
    // As a performance optimization, validate only on submit
    this.pdkForm.onBeforeSubmit$.subscribe(() => {
      const errors = validateValueForPromptChoice(this.promptChoice, this.ngForm.form.value);

      this.promptChoice.children.forEach(({ promptRef }) => {
        this.ngForm.control
          .get(promptRef)
          .setErrors(errors && errors[promptRef] ? errors[promptRef] : null);
      });
    });
  }
}
