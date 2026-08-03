import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { TextPromptChoice } from '../../../results.interfaces';
import {
  ErrorMessageConfig,
  PdkFormFieldComponent,
  PdkResizeDirective,
  PdkTextInput
} from '@cpp/pdk';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

const TEXTAREA_MIN_LENGTH = 100;

@Component({
  selector: 'cpp-txt-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field
      [errorMessages]="errorMessages"
      [label]="promptChoice | promptChoiceLabel"
      [labelType]="labelHidden ? 'none' : 'small'"
    >
      @if (inputType === 'textarea') {
      <textarea
        [name]="promptChoice.promptRef"
        [ngModel]="value"
        pdk-resize
        pdk-text-input
        [promptChoiceValidator]="promptChoice"
      ></textarea>
      } @if (inputType === 'input') {
      <input
        [name]="promptChoice.promptRef"
        [ngModel]="value"
        pdk-input
        pdk-text-input
        [promptChoiceValidator]="promptChoice"
      />
      }
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
    PdkResizeDirective,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective
  ]
})
export class TxtPromptChoiceComponent {
  @Input() labelHidden = false;
  @Input() promptChoice: TextPromptChoice;
  @Input() value?: string;

  errorMessages: ErrorMessageConfig[] = [
    {
      rule: 'pattern',
      message: `Invalid input prompt contains number or ( , ) | : Enter the name of the {{promptFriendlyName}} ONLY `
    }
  ];
  get inputType(): 'textarea' | 'input' {
    // CCT-2248: hack to be removed once a new SDP is provided
    // A new SDP is needed to reduce the maxLength
    // of restrao and restrav to 99. When this is done
    // this code can be removed.
    if (
      this.promptChoice.promptRef === 'protectedPersonsName' ||
      this.promptChoice.promptRef === 'thirdPartysNameVictimOrPolice'
    ) {
      return 'input';
    }

    if (!this.promptChoice.maxLength || Number(this.promptChoice.maxLength) < TEXTAREA_MIN_LENGTH) {
      return 'input';
    }
    return 'textarea';
  }
}
