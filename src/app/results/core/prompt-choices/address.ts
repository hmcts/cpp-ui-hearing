import { ValidationErrors } from '@angular/forms';
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

export const formatAddressValue = (value: DraftResultPrompt<string>[]): string => {
  return value
    .map(child => child.value)
    .filter(Boolean)
    .join(', ');
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
