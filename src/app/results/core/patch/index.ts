import { ReusableInfoDefinitions } from '@cpp/reference-data';
import { omit } from 'lodash-es';
import {
  NameAddressPartName,
  PromptChoice,
  PromptChoiceChild,
  RemoteParsedResult,
  ReusableInfo
} from '../../results.interfaces';
import {
  getHintTextForAddressPart,
  isAddressPartName,
  isNameAddressPromptChoice,
  isOneOfPromptChoice
} from '../helpers';

// This file is for patching http requests or responses, where the changes being
// patched are technical debt belonging to the backend that will be addressed at
// some future point. The purpose of the patching mechanism is so that we can
// adopt and use these cleaner "future" interfaces and payloads ahead of the
// backend fixes being made. It follows, therefore, that once all these backend
// changes are addressed, then all of the patching behaviour from this file can
// be discarded.

export const patchLegacyParsedResultDefinition = (
  parsedResult: RemoteParsedResult
): RemoteParsedResult => {
  if ('promptChoices' in parsedResult) {
    return {
      ...parsedResult,
      promptChoices: parsedResult.promptChoices.map(
        promptChoice => patchPromptChoice(promptChoice) as PromptChoice
      )
    };
  }
  return parsedResult;
};

type IncorrectAddressPartName =
  | 'name'
  | 'address1'
  | 'address2'
  | 'address3'
  | 'address4'
  | 'address5'
  | 'postcode'
  | 'email1'
  | 'email2';

export const addressPartNameMap: Record<IncorrectAddressPartName, string> = {
  name: 'OrganisationName',
  address1: 'AddressLine1',
  address2: 'AddressLine2',
  address3: 'AddressLine3',
  address4: 'AddressLine4',
  address5: 'AddressLine5',
  postcode: 'PostCode',
  email1: 'EmailAddress1',
  email2: 'EmailAddress2'
};

export const patchPromptChoice = (
  promptChoiceLike:
    | (PromptChoice & { componentType?: string; hidden?: boolean })
    | PromptChoiceChild
): PromptChoice | PromptChoiceChild => {
  let promptChoice = promptChoiceLike;

  if ('maxLength' in promptChoice && isNaN(Number(promptChoice.maxLength))) {
    promptChoice = omit(promptChoice, 'maxLength') as PromptChoice | PromptChoiceChild;
  }

  if (
    isNameAddressPromptChoice(promptChoice) &&
    promptChoice.promptRef === 'minorcreditornameandaddress' &&
    'children' in promptChoice
  ) {
    const requiredPartNames = [
      'OrganisationName',
      'AddressLine1',
      'AddressLine2',
      'AddressLine3',
      'AddressLine4',
      'AddressLine5'
    ] as NameAddressPartName[];

    promptChoice = {
      ...promptChoice,
      children: promptChoice.children.reduce((children, child, index) => {
        if (requiredPartNames.includes(child.partName)) {
          children[index] = {
            ...child,
            minLength: child.required ? 1 : 0,
            maxLength: 50,
            hint: isAddressPartName(child.partName)
              ? getHintTextForAddressPart(child.partName)
              : null
          };
        } else {
          children[index] = child;
        }
        return children;
      }, [] as PromptChoiceChild<NameAddressPartName>[])
    };
  }

  if ('componentType' in promptChoice) {
    promptChoice = {
      ...omit(promptChoice, 'componentType'),
      type: promptChoice.componentType || promptChoice.type
    } as PromptChoice;
  }

  if ('hidden' in promptChoice && promptChoice.hidden) {
    promptChoice = {
      ...omit(promptChoice, 'hidden'),
      type: 'HIDDEN'
    } as PromptChoice;
  }

  if (isOneOfPromptChoice(promptChoice)) {
    const fixPromptRef = promptChoice.children[0].promptRef === promptChoice.children[1].promptRef;

    promptChoice = {
      ...promptChoice,
      children: promptChoice.children.map((child, i) => ({
        ...child,
        promptRef: fixPromptRef ? `${child.promptRef}${i + 1}` : child.promptRef,
        required: promptChoice.required
      }))
    } as PromptChoice;
  }

  if ('nameAddressList' in promptChoice && promptChoice.nameAddressList.length > 0) {
    promptChoice = {
      ...promptChoice,
      nameAddressList: promptChoice.nameAddressList.map(({ addressParts, ...other }) => {
        return {
          ...other,
          addressParts: Object.keys(addressParts).reduce((contextualAddressParts, partName) => {
            if (addressPartNameMap[partName as IncorrectAddressPartName]) {
              return {
                ...contextualAddressParts,
                [addressPartNameMap[partName as IncorrectAddressPartName]]: addressParts[partName]
              };
            }
            return contextualAddressParts;
          }, {} as Record<IncorrectAddressPartName, string>)
        };
      })
    };
  }

  if ('children' in promptChoice) {
    promptChoice = {
      ...promptChoice,
      children: (promptChoice.children as PromptChoice[]).map(patchPromptChoice)
    } as PromptChoice;
  }

  return promptChoice;
};

// Patch reusable info  to handle `ADDRESS` and `NAMEADDRESS` type being sent
// with an incorrect promptRef. For example, where the promptRef of the
// NAMEADDRESS prompt choice is 'employer', then the reusable would be providing
// this as 'employerOrganisationName'.
// (https://tools.hmcts.net/jira/browse/DD-15403)
export const patchReusableInfo = ({ reusablePrompts, ...other }: ReusableInfo): ReusableInfo => {
  return {
    ...other,
    reusablePrompts: reusablePrompts.map(patchLegacyPromptRefForROI)
  };
};

// Patch reusable info definitions to handle `ADDRESS` and `NAMEADDRESS` type
// being sent with an incorrect promptRef. For example, where the promptRef of
// the NAMEADDRESS prompt choice is 'employer', then the reusable would be
// providing this as 'employerOrganisationName'.
export const patchResuableInfoDefinitions = ({
  reusablePromptDefinitions,
  ...other
}: ReusableInfoDefinitions): ReusableInfoDefinitions => ({
  ...other,
  reusablePromptDefinitions: reusablePromptDefinitions.map(patchLegacyPromptRefForROI)
});

const patchLegacyPromptRefForROI = <T extends { promptRef: string }>({
  promptRef,
  ...other
}: T): T => {
  let patchedPromptRef = promptRef;

  [patchedPromptRef] = patchedPromptRef.split('OrganisationName');
  [patchedPromptRef] = patchedPromptRef.split('Address1');

  return {
    ...other,
    promptRef: patchedPromptRef
  } as T;
};
