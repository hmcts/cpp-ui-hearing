import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { PromptChoice } from '../../../results.interfaces';
import { PdkFormFieldComponent, PdkRadioGroupComponent, PdkRadioButtonComponent } from '@cpp/pdk';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

const SERVED_BY_PROSECUTOR_PROMPT_REF = 'thisSummonsWillBeServedByAProsecutor';

@Component({
  selector: 'cpp-boolean-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!exParteDefaultApplies) {
    <pdk-form-field [label]="promptChoice | promptChoiceLabel" labelType="small">
      <pdk-radio-group
        inline
        [name]="promptChoice.promptRef"
        [ngModel]="value"
        [promptChoiceValidator]="promptChoice"
      >
        <pdk-radio-button [value]="true">Yes</pdk-radio-button>
        <pdk-radio-button [value]="false">No</pdk-radio-button>
      </pdk-radio-group>
    </pdk-form-field>
    } @else {
    <input type="hidden" [name]="promptChoice.promptRef" [ngModel]="true" />
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
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective
  ]
})
export class BooleanPromptChoiceComponent {
  @Input() promptChoice: PromptChoice;
  @Input() value?: boolean;
  @Input() isExParteCase?: boolean;

  get exParteDefaultApplies(): boolean {
    return (
      this.isExParteCase === true &&
      this.promptChoice?.promptRef === SERVED_BY_PROSECUTOR_PROMPT_REF
    );
  }
}
