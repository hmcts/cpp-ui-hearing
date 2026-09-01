import { ValidationErrors } from '@angular/forms';
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

const ADDRESS_LINE_PART_NAMES: AddressPartName[] = [
  'AddressLine1',
  'AddressLine2',
  'AddressLine3',
  'AddressLine4',
  'AddressLine5',
  'PostCode'
];

// The part names covered by cpp-address-autosuggest's own fields (address lines and
// postcode). EmailAddress1/2 (and, for NAMEADDRESS, OrganisationName/FirstName/
// MiddleName/LastName) are not - they stay as separate manual inputs regardless of
// whether the address lookup is shown.
export const isAddressLineOrPostcodePartName = (
  partName: AddressPartName | NameAddressPartName
): boolean => ADDRESS_LINE_PART_NAMES.includes(partName as AddressPartName);

export const formatAddressValue = (value: DraftResultPrompt<string>[]): string => {
  return value
    .map(child => child.value)
    .filter(Boolean)
    .join(', ');
};

// Maps a selected cpp-address-autosuggest Address onto our AddressLine1-5/PostCode
// promptRefs. Our AddressLine3/AddressLine4 double up as "Town, City"/"County"
// (see getHintTextForAddressPart), which the pdk Address model holds separately -
// line3/line4 win when both are present.
export const addressToPromptChildValues = (
  address: Address,
  children: PromptChoiceChild<AddressPartName | NameAddressPartName>[]
): Record<string, string> => {
  const valueByPartName: Partial<Record<AddressPartName, string>> = {
    AddressLine1: address.line1,
    AddressLine2: address.line2,
    AddressLine3: address.line3 || address.town,
    AddressLine4: address.line4 || address.county,
    AddressLine5: address.line5,
    PostCode: address.postcode
  };

  return children.reduce((acc, { partName, promptRef }) => {
    const value = isAddressPartName(partName) ? valueByPartName[partName] : undefined;

    if (value) {
      acc[promptRef] = value;
    }
    return acc;
  }, {} as Record<string, string>);
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

  const line1 = valueForPartName('AddressLine1');
  const postcode = valueForPartName('PostCode');

  if (!line1 && !postcode) {
    return null;
  }

  return {
    line1: line1 || '',
    line2: valueForPartName('AddressLine2'),
    line3: valueForPartName('AddressLine3'),
    line4: valueForPartName('AddressLine4'),
    line5: valueForPartName('AddressLine5'),
    town: '',
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
