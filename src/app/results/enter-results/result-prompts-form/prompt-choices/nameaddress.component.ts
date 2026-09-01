import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { Address, CppAddressAutosuggestComponent } from '@cpp/application';
import {
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkTextInput,
  PdkAutosuggestLiteComponent,
  PdkMarginDirective
} from '@cpp/pdk';
import { find, keyBy } from 'lodash-es';
import { validateValueForPromptChoice } from '../../../core/helpers';
import {
  addressToPromptChildValues,
  isAddressLineOrPostcodePartName,
  promptChildValuesToAddress
} from '../../../core/prompt-choices/address';
import {
  DraftResultPrompt,
  NameAddressListItem,
  NameAddressPartName,
  NameAddressPromptChoice,
  NgChanges,
  PromptChoiceChild,
  PromptEntry,
  ProsecutorTobeNotified
} from '../../../results.interfaces';

import { PromptChoiceFormatPipe } from '../../../common/pipes/prompt-choice-format.pipe';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
@Component({
  selector: 'cpp-nameaddress-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Conditional radio group to handle 'Both' addressType -->

    @if (promptChoice.addressType === 'Both') {
    <pdk-form-field
      label="Is this an individual or an organisation?"
      labelType="small"
      pdk-margin-bottom="3"
    >
      <pdk-radio-group
        [name]="promptChoice.promptRef + 'AddressType'"
        [(ngModel)]="selectedAddressType"
        (ngModelChange)="selectedOrganisation = null"
        [required]="promptChoice.required"
        inline
      >
        <pdk-radio-button value="Organisation">Organisation</pdk-radio-button>
        <pdk-radio-button value="Person">Person</pdk-radio-button>
      </pdk-radio-group>
    </pdk-form-field>
    }
    <!-- OrganisationName with nameAddressList options -->

    @if (hasOrganisationLookup) {
    <pdk-form-field
      [label]="promptChoice | promptChoiceLabel"
      labelType="small"
      hintText="Please start typing the name"
      [errors]="organisationNameFormField.errors"
    >
      <pdk-autosuggest-lite
        [ngModel]="selectedOrganisation"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="handleOrganisationSuggestionSelected($event)"
        (inputText)="handleOrganisationInputText($event)"
        [suggestions]="suggestions"
        suggestionKey="label"
        suggestionTitle="label"
      >
      </pdk-autosuggest-lite>
    </pdk-form-field>
    <input
      #organisationNameFormField="ngModel"
      style="display:none"
      type="hidden"
      pdk-text-input
      [name]="childPromptChoices.OrganisationName.promptRef"
      [ngModel]="formValues[childPromptChoices.OrganisationName.promptRef]?.value"
    />
    }
    <!-- Address lookup -->

    @if (promptChoice.isStructuredUnstructuredAddress && !hasOrganisationLookup) {
    <pdk-form-field label="Search address or Postcode" labelType="small">
      <cpp-address-autosuggest
        [ngModel]="currentAddress"
        [ngModelOptions]="{ standalone: true }"
        (ngModelChange)="handleAddressSelected($event)"
      >
      </cpp-address-autosuggest>
    </pdk-form-field>
    }
    <!-- Other part names -->

    @for (partName of otherPartNames; track trackByPartName($index, partName)) {
    <pdk-form-field
      [label]="getChildPromptChoice(partName) | promptChoiceLabel"
      [hintText]="getChildPromptChoice(partName).hint"
      labelType="small"
    >
      <input
        type="text"
        [name]="getChildPromptChoice(partName).promptRef"
        [ngModel]="formValues[getChildPromptChoice(partName).promptRef]?.value"
        pdk-input
        [pdk-text-input]="getChildPromptChoice(partName) | promptChoiceFormat"
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
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkTextInput,
    PdkAutosuggestLiteComponent,
    PdkMarginDirective,
    CppAddressAutosuggestComponent
  ]
})
export class NameAddressPromptChoiceComponent implements OnChanges {
  @Input() shortCode?: string;
  @Input() hasHmctsOrganisation?: boolean;
  @Input() prosecutorToBeNotified?: PromptEntry[];
  @Input() promptChoice: NameAddressPromptChoice;
  @Input()
  set value(resultPrompt: DraftResultPrompt<DraftResultPrompt<string>[]> | undefined) {
    const resultPromptValues = resultPrompt ? resultPrompt : this.obtainDefaultingOption();
    this.formValues = resultPromptValues ? keyBy(resultPromptValues.value, 'promptRef') : {};
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

  childPromptChoices: Record<NameAddressPartName, PromptChoiceChild>;
  formValues: Record<string, DraftResultPrompt<string>> = {};
  currentAddress: Address | null = null;
  selectedAddressType: 'Organisation' | 'Person' | 'Both';
  selectedOrganisation: NameAddressListItem;
  suggestions: NameAddressListItem[] = [];

  constructor(private ngForm: NgForm, pdkForm: PdkFormComponent) {
    // As a performance optimization, validate only on submit
    pdkForm.onBeforeSubmit$.subscribe(() => {
      const errors = validateValueForPromptChoice(this.promptChoice, this.ngForm.form.value);

      this.promptChoice.children.forEach(({ promptRef }) => {
        const control = this.ngForm.control.get(promptRef);

        if (control) {
          control.setErrors(errors && errors[promptRef] ? errors[promptRef] : null);
        }
      });
    });
  }

  get hasOrganisationLookup(): boolean {
    const isOrganisationType =
      this.promptChoice.addressType === 'Organisation' ||
      this.selectedAddressType === 'Organisation';

    return (
      isOrganisationType &&
      this.promptChoice.nameAddressList &&
      this.promptChoice.nameAddressList.length > 0
    );
  }

  get otherPartNames(): NameAddressPartName[] {
    const otherPartNames = (
      [
        'AddressLine1',
        'AddressLine2',
        'AddressLine3',
        'AddressLine4',
        'AddressLine5',
        'PostCode',
        'EmailAddress1',
        'EmailAddress2'
      ] as NameAddressPartName[]
    ).filter(partName => find(this.promptChoice.children, { partName }));

    if (this.selectedAddressType === 'Organisation' && !this.hasOrganisationLookup) {
      return ['OrganisationName', ...otherPartNames];
    }
    if (this.selectedAddressType === 'Person') {
      return ['FirstName', 'MiddleName', 'LastName', ...otherPartNames];
    }
    return otherPartNames;
  }

  getChildPromptChoice(partName: NameAddressPartName) {
    return this.childPromptChoices[partName];
  }

  ngOnChanges(changes: NgChanges<NameAddressPromptChoiceComponent>) {
    if (changes.promptChoice) {
      this.childPromptChoices = keyBy(this.promptChoice.children, 'partName') as Record<
        NameAddressPartName,
        PromptChoiceChild
      >;

      if (this.promptChoice.addressType === 'Both') {
        if (this.formValues[this.childPromptChoices.OrganisationName.promptRef]) {
          this.selectedAddressType = 'Organisation';
        }
        if (this.formValues[this.childPromptChoices.LastName.promptRef]) {
          this.selectedAddressType = 'Person';
        }
      } else {
        this.selectedAddressType = this.promptChoice.addressType;
      }
      if (this.hasOrganisationLookup) {
        const organisationNamePromptChoice = this.childPromptChoices.OrganisationName;

        if (this.formValues[organisationNamePromptChoice.promptRef]) {
          this.selectedOrganisation = find(this.promptChoice.nameAddressList, {
            label: this.formValues[organisationNamePromptChoice.promptRef].value
          });
        }
      }
    }
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

  handleOrganisationInputText(inputText: string) {
    this.suggestions = this.promptChoice.nameAddressList
      .filter(value => value.label.toLowerCase().includes(inputText.toLowerCase()))
      .slice(0, 8);
  }

  handleOrganisationSuggestionSelected(nameAddressListItem: NameAddressListItem | null) {
    if (nameAddressListItem) {
      this.promptChoice.children.forEach(({ partName, promptRef }) => {
        this.ngForm.control
          .get(promptRef)
          .setValue(nameAddressListItem.addressParts[partName] || null);
      });
    } else {
      const { promptRef } = find(this.promptChoice.children, { partName: 'OrganisationName' });

      this.ngForm.control.get(promptRef).setValue(null);
    }
  }

  trackByPartName(_: number, partName: NameAddressPartName) {
    return partName;
  }

  obtainDefaultingOption(): DraftResultPrompt<DraftResultPrompt<string>[]> | undefined {
    if (
      this.hasHmctsOrganisation &&
      (this.shortCode === 'stdec' || this.shortCode === 'ropened') &&
      this.prosecutorToBeNotified?.length > 0
    ) {
      return this.parseResultPrompt(this.prosecutorToBeNotified[0].value);
    }
    return undefined;
  }

  parseResultPrompt(
    prosecutorToBeNotified: ProsecutorTobeNotified
  ): DraftResultPrompt<DraftResultPrompt<string>[]> {
    const { label, code: promptId, promptRef, type, children = [] } = this.promptChoice;
    return {
      label,
      promptId,
      promptRef,
      type,
      value: this.parseResultPromptValues(prosecutorToBeNotified, children)
    };
  }

  parseResultPromptValues(
    value: ProsecutorTobeNotified,
    childPromptChoices: PromptChoiceChild<string>[]
  ): DraftResultPrompt<string>[] {
    return childPromptChoices.reduce((acc, child) => {
      const { label, promptRef, type } = child;
      const promptValue = value[child.promptRef as keyof ProsecutorTobeNotified];
      if (typeof promptValue === 'string') {
        acc.push({
          label,
          type,
          promptRef,
          promptId: child.code,
          value: promptValue
        });
      }
      return acc;
    }, []);
  }
}
