import { ValidationErrors } from '@angular/forms';
import { OrganisationUnit } from '@cpp/reference-data';
import { find } from 'lodash-es';
import { omitUndefined } from '../../../core';
import {
  DraftResultPrompt,
  NameAddressPartName,
  NameAddressPromptChoice,
  PromptChoice,
  PromptChoiceChild
} from '../../results.interfaces';
import { validateAddressChildValue } from './address';
import { isTextPromptChoice, validateTextValue } from './txt';

export const isNameAddressPromptChoice = (
  promptChoice: PromptChoice | PromptChoiceChild
): promptChoice is NameAddressPromptChoice => {
  return promptChoice.type === 'NAMEADDRESS';
};

export const createNameAddressResultPromptForCourtCentre = (
  promptChoice: NameAddressPromptChoice,
  courtCentre: OrganisationUnit
): DraftResultPrompt => {
  const value = promptChoice.children.reduce((resultPrompts, promptChoiceChild) => {
    let childValue: unknown;

    switch (promptChoiceChild.partName) {
      case 'OrganisationName':
        childValue = courtCentre.oucodeL3Name;
        break;
      case 'AddressLine1':
        childValue = courtCentre.address1;
        break;
      case 'AddressLine2':
        childValue = courtCentre.address2;
        break;
      case 'AddressLine3':
        childValue = courtCentre.address3;
        break;
      case 'AddressLine4':
        childValue = courtCentre.address4;
        break;
      case 'AddressLine5':
        childValue = courtCentre.address5;
        break;
      case 'PostCode':
        childValue = courtCentre.postcode;
        break;
      case 'EmailAddress1':
        childValue = courtCentre.email;
        break;
      default:
        break;
    }
    if (childValue) {
      return [
        ...resultPrompts,
        omitUndefined({
          promptRef: promptChoiceChild.promptRef,
          promptId: promptChoiceChild.code,
          label: promptChoiceChild.label,
          type: promptChoiceChild.type,
          value: childValue
        })
      ];
    }
    return resultPrompts;
  }, [] as DraftResultPrompt[]);

  const { promptRef, code: promptId, label, type } = promptChoice;

  return omitUndefined({ promptRef, promptId, label, type, value });
};

export const formatNameAddressValue = (value: DraftResultPrompt<string>[]): string => {
  return value
    .map(child => child.value)
    .filter(Boolean)
    .join(', ');
};

export const validateNameAddressValue = (
  promptChoice: NameAddressPromptChoice,
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

  let addressType = promptChoice.addressType;

  if (addressType === 'Both') {
    // When the addressType is 'Both' we must determine which children to
    // validate: we do not want to validate the children for both 'Organisation'
    // and 'Person' simultaneously as they are mutually exclusive choices
    if (
      promptChoice.children.find(
        child =>
          ['FirstName', 'MiddleName', 'LastName'].includes(child.partName) &&
          valueMap[child.promptRef]
      )
    ) {
      addressType = 'Person';
    }

    if (
      promptChoice.children.find(
        child => ['OrganisationName'].includes(child.partName) && valueMap[child.promptRef]
      )
    ) {
      addressType = 'Organisation';
    }
  }

  for (const childPromptChoice of promptChoice.children) {
    const childError = validateNameAddressChildValue(
      addressType,
      childPromptChoice,
      valueMap[childPromptChoice.promptRef]
    );

    if (childError) {
      errors[childPromptChoice.promptRef] = childError;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateNameAddressChildValue = (
  addressType: NameAddressPromptChoice['addressType'],
  promptChoiceChild: PromptChoiceChild<NameAddressPartName>,
  value: string | undefined
): ValidationErrors | null => {
  switch (promptChoiceChild.partName) {
    case 'OrganisationName':
      return addressType === 'Person' ? null : validateOrganisationName(promptChoiceChild, value);
    case 'FirstName':
    case 'MiddleName':
    case 'LastName':
      return addressType !== 'Organisation' && promptChoiceChild.required && !value
        ? { required: true }
        : null;

    case 'AddressLine1':
    case 'AddressLine2':
    case 'AddressLine3':
    case 'AddressLine4':
    case 'AddressLine5':
    case 'PostCode':
    case 'EmailAddress1':
    case 'EmailAddress2':
      return validateAddressChildValue(promptChoiceChild, value);
  }
};

const validateOrganisationName = (
  promptChoiceChild: PromptChoiceChild<NameAddressPartName>,
  value: string | undefined
) => {
  if (promptChoiceChild.required && !value) {
    return { required: true };
  }

  if (isTextPromptChoice(promptChoiceChild)) {
    return validateTextValue(promptChoiceChild, value);
  }
  return null;
};
