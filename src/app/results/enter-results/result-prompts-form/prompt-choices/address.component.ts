import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { Address, CppAddressAutosuggestComponent } from '@cpp/application';
import { PdkFormComponent, PdkFormFieldComponent, PdkTextInput } from '@cpp/pdk';
import { keyBy } from 'lodash-es';
import { validateValueForPromptChoice } from '../../../core/helpers';
import {
  addressToPromptChildValues,
  isAddressLineOrPostcodePartName,
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
    @if (promptChoice.isStructuredUnstructuredAddress) {
    <pdk-form-field label="Search address or Postcode" labelType="small">
      <cpp-address-autosuggest
        [ngModel]="currentAddress"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="handleAddressSelected($event)"
      >
      </cpp-address-autosuggest>
    </pdk-form-field>
    } @for (childPromptChoice of promptChoice.children; track childPromptChoice.promptRef) {
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
  // cpp-address-autosuggest's own nested <cpp-address> fields use generic labels
  // (Address line 1, Town or city, ...) that don't match this result's per-field
  // labels above - hide just that block. Scoped through the cpp-address element
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
    PromptChoiceFormatPipe,
    ResultPromptsFormLabelPipe,
    PdkFormFieldComponent,
    PdkTextInput,
    CppAddressAutosuggestComponent
  ]
})
export class AddressPromptChoiceComponent {
  @Input() promptChoice: AddressPromptChoice;
  @Input()
  set value(resultPrompt: DraftResultPrompt<DraftResultPrompt[]> | undefined) {
    this.formValues = resultPrompt ? keyBy(resultPrompt.value, 'promptRef') : {};
    // Computed once here, not as a live getter: cpp-address-autosuggest's nested
    // <cpp-address> re-verifies (a real network call) whenever its bound value
    // changes reference. A getter rebuilding a new object on every template
    // check would look like "changed" on every change detection cycle once
    // formValues holds real address data, flooding OS Places and freezing the page.
    this.currentAddress = promptChildValuesToAddress(
      this.formValues,
      this.promptChoice?.children ?? []
    );
  }

  formValues: Record<string, DraftResultPrompt> = {};
  currentAddress: Address | null = null;

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

  handleAddressSelected(address: Address | null): void {
    if (!address) {
      return;
    }
    const values = addressToPromptChildValues(address, this.promptChoice.children);

    this.promptChoice.children
      .filter(({ partName }) => isAddressLineOrPostcodePartName(partName))
      .forEach(({ promptRef, partName }) => {
        const control = this.ngForm.control.get(promptRef);

        control.setValue(values[promptRef] || null);
        if (partName === 'PostCode') {
          // No fixed abode has no postcode to enter or validate.
          address.noFixedAbode ? control.disable() : control.enable();
        }
      });
  }
}
