import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { Address, CppAddressAutosuggestComponent } from '@cpp/application';
import { PdkFormComponent, PdkFormFieldComponent, PdkLinkDirective, PdkTextInput } from '@cpp/pdk';
import { keyBy } from 'lodash-es';
import { validateValueForPromptChoice } from '../../../core/helpers';
import {
  applyAddressToControls,
  promptChildValuesToAddress
} from '../../../core/prompt-choices/address';
import { AddressPromptChoice, DraftResultPrompt } from '../../../results.interfaces';

import { PromptChoiceFormatPipe } from '../../../common/pipes/prompt-choice-format.pipe';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
@Component({
  selector: 'cpp-address-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Address lookup -->
    @if (promptChoice.useAddressLookup) {
    <pdk-form-field
      label="Search address or Postcode"
      hintText="Enter at least 3 characters to see address suggestions"
      labelType="small"
    >
      <cpp-address-autosuggest
        [ngModel]="null"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="handleAddressSelected($event)"
        clearOnSelection
      >
      </cpp-address-autosuggest>
    </pdk-form-field>
    @if (!showAddressFields) {
    <a pdk-link role="button" href="javascript:void(0)" (click)="handleEnterManually()"
      >Enter address manually</a
    >
    } @if (showAddressFields) { @for (childPromptChoice of promptChoice.children; track
    childPromptChoice.promptRef) {
    <pdk-form-field [label]="childPromptChoice | promptChoiceLabel" labelType="small">
      <input
        type="text"
        [name]="childPromptChoice.promptRef"
        [ngModel]="formValues[childPromptChoice.promptRef]?.value"
        pdk-input
        [pdk-text-input]="childPromptChoice | promptChoiceFormat"
      />
    </pdk-form-field>
    } } } @else { @for (childPromptChoice of promptChoice.children; track
    childPromptChoice.promptRef) {
    <pdk-form-field [label]="childPromptChoice | promptChoiceLabel" labelType="small">
      <input
        type="text"
        [name]="childPromptChoice.promptRef"
        [ngModel]="formValues[childPromptChoice.promptRef]?.value"
        pdk-input
        [pdk-text-input]="childPromptChoice | promptChoiceFormat"
      />
    </pdk-form-field>
    } }
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
    PdkTextInput,
    PdkLinkDirective,
    CppAddressAutosuggestComponent
  ]
})
export class AddressPromptChoiceComponent {
  @Input() promptChoice: AddressPromptChoice;
  @Input()
  set value(resultPrompt: DraftResultPrompt<DraftResultPrompt[]> | undefined) {
    this.formValues = resultPrompt ? keyBy(resultPrompt.value, 'promptRef') : {};
    this.currentAddress = promptChildValuesToAddress(
      this.formValues,
      this.promptChoice?.children ?? []
    );
    this.showAddressFields = !!this.currentAddress;
  }

  formValues: Record<string, DraftResultPrompt> = {};
  currentAddress: Address | null = null;
  showAddressFields = false;

  constructor(
    private ngForm: NgForm,
    private pdkForm: PdkFormComponent,
    private cdr: ChangeDetectorRef
  ) {
    this.pdkForm.onBeforeSubmit$.subscribe(() => {
      const errors = validateValueForPromptChoice(this.promptChoice, this.ngForm.form.value);

      this.promptChoice.children.forEach(({ promptRef }) => {
        this.ngForm.control
          .get(promptRef)
          .setErrors(errors && errors[promptRef] ? errors[promptRef] : null);
      });
    });
  }

  handleAddressSelected(address: Address | null): void {
    if (!address) {
      return;
    }
    this.showAddressFields = true;
    this.cdr.detectChanges();
    Promise.resolve().then(() => this.applyAddress(address));
  }

  handleEnterManually(): void {
    this.showAddressFields = true;
  }

  private applyAddress(address: Address): void {
    applyAddressToControls(this.ngForm, this.promptChoice.children, address);
  }
}
