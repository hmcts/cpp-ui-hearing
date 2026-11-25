import { NgForm, ValidationErrors } from '@angular/forms';
import { Address } from '@cpp/application';
import { validateAddressLine, validateEmail, validatePostcode } from '@cpp/pdk';
import { find } from 'lodash-es';
import {
  AddressPartName,
  AddressPromptChoice,
  DraftResultPrompt,
  NameAddressPartName,
  NameAddressPromptChoice,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';
import { isTextPromptChoice, validateTextValue } from './txt';

export const isAddressPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is AddressPromptChoice => {
  return promptChoice.type === 'ADDRESS';
};

export const isAddressPartName = (
  partName: AddressPartName | NameAddressPartName
): partName is AddressPartName => {
  const nonAddressPartNames = [
    'OrganisationName',
    'FirstName',
    'MiddleName',
    'LastName'
  ] as NameAddressPartName[];

  return !nonAddressPartNames.includes(partName);
};

export const ADDRESS_LINE1: AddressPartName = 'AddressLine1';
export const ADDRESS_LINE2: AddressPartName = 'AddressLine2';
export const ADDRESS_LINE3: AddressPartName = 'AddressLine3';
export const ADDRESS_LINE4: AddressPartName = 'AddressLine4';
export const ADDRESS_LINE5: AddressPartName = 'AddressLine5';
export const POST_CODE: AddressPartName = 'PostCode';

const ADDRESS_LINE_PART_NAMES: AddressPartName[] = [
  ADDRESS_LINE1,
  ADDRESS_LINE2,
  ADDRESS_LINE3,
  ADDRESS_LINE4,
  ADDRESS_LINE5,
  POST_CODE
];

export const isAddressLineOrPostcodePartName = (
  partName: AddressPartName | NameAddressPartName
): boolean => ADDRESS_LINE_PART_NAMES.includes(partName as AddressPartName);

// Some result definitions (e.g. FCOMP's Minor Creditor) set useAddressLookup on
// each of the ADDRESS/NAMEADDRESS prompt's own children instead of (or as well
// as) on the prompt choice itself - check both places rather than assuming the
// backend always puts it at the top level.
export const hasAddressLookupEnabled = (
  promptChoice: AddressPromptChoice | NameAddressPromptChoice
): boolean =>
  !!promptChoice.useAddressLookup || promptChoice.children.some(child => !!child.useAddressLookup);

export const formatAddressValue = (value: DraftResultPrompt<string>[]): string => {
  return value
    .map(child => child.value)
    .filter(Boolean)
    .join(', ');
};

export const addressToPromptChildValues = (
  address: Address,
  children: PromptChoiceChild<AddressPartName | NameAddressPartName>[]
): Record<string, string> => {
  const valueByPartName: Partial<Record<AddressPartName, string>> = {
    [ADDRESS_LINE1]: address.line1,
    [ADDRESS_LINE2]: address.line2,
    [ADDRESS_LINE3]: address.line3,
    [ADDRESS_LINE4]: address.line4,
    [ADDRESS_LINE5]: address.line5,
    [POST_CODE]: address.postcode
  };

  return children.reduce((acc, { partName, promptRef }) => {
    const value = isAddressPartName(partName) ? valueByPartName[partName] : undefined;

    if (value) {
      acc[promptRef] = value;
    }
    return acc;
  }, {} as Record<string, string>);
};

// Writes a selected Address onto the matching AddressLine1-5/PostCode controls -
// shared by AddressPromptChoiceComponent and NameAddressPromptChoiceComponent, whose
// handleAddressSelected()/applyAddress() are otherwise identical. Postcode has no
// value to enter for a selected address, so it's always (re-)enabled here - unlike
// EmailAddress1/2 (and, for NAMEADDRESS, name/organisation fields), which the address
// lookup has nothing to do with and so are left untouched.
export const applyAddressToControls = (
  ngForm: NgForm,
  children: PromptChoiceChild<AddressPartName | NameAddressPartName>[],
  address: Address
): void => {
  const values = addressToPromptChildValues(address, children);

  children
    .filter(({ partName }) => isAddressLineOrPostcodePartName(partName))
    .forEach(({ promptRef, partName }) => {
      const control = ngForm.control.get(promptRef);

      control.setValue(values[promptRef] || null);
      if (partName === POST_CODE) {
        control.enable();
      }
    });
};

// Reverse of addressToPromptChildValues, used to seed cpp-address-autosuggest when
// amending a result that already has address values (from a previous search, manual
// entry, or a previously shared result).
export const promptChildValuesToAddress = (
  formValues: Record<string, DraftResultPrompt>,
  children: PromptChoiceChild<AddressPartName | NameAddressPartName>[]
): Address | null => {
  const childByPartName = children.reduce((acc, child) => {
    if (isAddressPartName(child.partName)) {
      acc[child.partName] = child;
    }
    return acc;
  }, {} as Partial<Record<AddressPartName, PromptChoiceChild<AddressPartName | NameAddressPartName>>>);

  const valueForPartName = (partName: AddressPartName): string | undefined => {
    const child = childByPartName[partName];

    return child ? (formValues[child.promptRef]?.value as string | undefined) : undefined;
  };

  const line1 = valueForPartName(ADDRESS_LINE1);
  const postcode = valueForPartName(POST_CODE);

  if (!line1 && !postcode) {
    return null;
  }

  return {
    line1: line1 || '',
    line2: valueForPartName(ADDRESS_LINE2),
    line3: valueForPartName(ADDRESS_LINE3),
    line4: valueForPartName(ADDRESS_LINE4),
    line5: valueForPartName(ADDRESS_LINE5),
    postcode: postcode || ''
  };
};

export const getHintTextForAddressPart = (partName: AddressPartName) => {
  switch (partName) {
    case 'AddressLine1':
      return 'House number/name and Street name';
    case 'AddressLine2':
      return 'Company, Building, Apartment, Suite, etc.';
    case 'AddressLine3':
      return 'Town, City etc.';
    case 'AddressLine4':
      return 'County';
    default:
      return null;
  }
};

export const validateAddressValue = (
  promptChoice: AddressPromptChoice | NameAddressPromptChoice,
  valuesOrValueMap: DraftResultPrompt<string>[] | Record<string, string> = {}
): ValidationErrors | null => {
  const errors: ValidationErrors = {};
  const valueMap = Array.isArray(valuesOrValueMap)
    ? valuesOrValueMap.reduce(
        (map, { promptRef, value }) => ({
          ...map,
          [promptRef]: value
        }),
        {} as Record<string, string>
      )
    : valuesOrValueMap;

  const hasAnyChildValue = Object.keys(valueMap).some(
    promptRef => valueMap[promptRef] && find(promptChoice.children, { promptRef })
  );

  if (!promptChoice.required && !hasAnyChildValue) {
    return null;
  }

  for (const childPromptChoice of promptChoice.children) {
    const childError = validateAddressChildValue(
      childPromptChoice,
      valueMap[childPromptChoice.promptRef]
    );

    if (childError) {
      errors[childPromptChoice.promptRef] = childError;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateAddressChildValue = (
  promptChoiceChild: PromptChoiceChild,
  value: string | undefined
): ValidationErrors | null => {
  let childError: ValidationErrors | null = null;

  if (promptChoiceChild.required && !value) {
    childError = { required: true };
  }

  if (value) {
    switch (promptChoiceChild.partName) {
      case 'AddressLine1':
      case 'AddressLine2':
      case 'AddressLine3':
      case 'AddressLine4':
      case 'AddressLine5':
        childError = validateAddressLines(promptChoiceChild, value);
        break;

      case 'PostCode':
        childError = validatePostcode(value) ? null : { postcode: true };
        break;

      case 'EmailAddress1':
      case 'EmailAddress2':
        // Allow multiple emails to be provided to a single prompt:
        // https://tools.hmcts.net/jira/browse/DD-14631
        const emails = value.split(';');
        const valid = emails
          .map(email => email.trim())
          .filter(Boolean)
          .every(validateEmail);

        childError = valid ? null : { email: true };
        break;
    }
  }
  return childError;
};

const validateAddressLines = (
  promptChoiceChild: PromptChoiceChild,
  value: string | undefined
): ValidationErrors => {
  if (promptChoiceChild.partName === 'AddressLine1' && !validateAddressLine(value)) {
    return { addressLine: true };
  }

  if (isTextPromptChoice(promptChoiceChild)) {
    return validateTextValue(promptChoiceChild, value);
  }

  return null;
};
