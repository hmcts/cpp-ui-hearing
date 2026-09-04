import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { Address, addressToSingleLine, CppAddressAutosuggestComponent } from '@cpp/application';
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
    <!-- Address lookup -->
    @if (promptChoice.useAddressLookup) {
    <pdk-form-field label="Search address or Postcode" labelType="small">
      <cpp-address-autosuggest
        [ngModel]="null"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="handleAddressSelected($event)"
      >
      </cpp-address-autosuggest>
    </pdk-form-field>
    }
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
  // cpp-address-autosuggest's own nested <cpp-address> fields (address line 1-5/town/
  // county/postcode) aren't wanted here - this prompt only wants the address inserted
  // as a single line into the text box above. Scoped through the cpp-address element
  // specifically: pdk-interaction-container is a generic wrapper pdk reuses inside
  // many components, including the search dropdown itself - an unscoped
  // "::ng-deep pdk-interaction-container" hides the search box too.
  styles: [':host ::ng-deep cpp-address pdk-interaction-container { display: none; }'],
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
    PromptChoiceValidatorDirective,
    CppAddressAutosuggestComponent
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

  constructor(private ngForm: NgForm) {}

  handleAddressSelected(address: Address | null): void {
    if (!address) {
      return;
    }
    this.ngForm.control.get(this.promptChoice.promptRef).setValue(addressToSingleLine(address));
  }

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
