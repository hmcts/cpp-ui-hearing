import { Address } from '@cpp/application';
import { AddressPartName, DraftResultPrompt, PromptChoiceChild } from '../../../results.interfaces';
import {
  addressToPromptChildValues,
  isAddressLineOrPostcodePartName,
  promptChildValuesToAddress
} from '../address';

const CHILDREN: PromptChoiceChild<AddressPartName>[] = [
  {
    partName: 'AddressLine1',
    promptRef: 'testAddress1',
    code: '1',
    label: '',
    type: 'TXT',
    sequence: 1
  },
  {
    partName: 'AddressLine2',
    promptRef: 'testAddress2',
    code: '2',
    label: '',
    type: 'TXT',
    sequence: 2
  },
  {
    partName: 'AddressLine3',
    promptRef: 'testAddress3',
    code: '3',
    label: '',
    type: 'TXT',
    sequence: 3
  },
  {
    partName: 'AddressLine4',
    promptRef: 'testAddress4',
    code: '4',
    label: '',
    type: 'TXT',
    sequence: 4
  },
  {
    partName: 'AddressLine5',
    promptRef: 'testAddress5',
    code: '5',
    label: '',
    type: 'TXT',
    sequence: 5
  },
  {
    partName: 'PostCode',
    promptRef: 'testPostCode',
    code: '6',
    label: '',
    type: 'TXT',
    sequence: 6
  },
  {
    partName: 'EmailAddress1',
    promptRef: 'testEmailAddress1',
    code: '7',
    label: '',
    type: 'TXT',
    sequence: 7
  }
];

describe('Address prompt choice helpers', () => {
  describe('isAddressLineOrPostcodePartName', () => {
    it('should be true for address lines and postcode', () => {
      expect(isAddressLineOrPostcodePartName('AddressLine1')).toBe(true);
      expect(isAddressLineOrPostcodePartName('AddressLine5')).toBe(true);
      expect(isAddressLineOrPostcodePartName('PostCode')).toBe(true);
    });

    it('should be false for email and name/organisation part names', () => {
      expect(isAddressLineOrPostcodePartName('EmailAddress1')).toBe(false);
      expect(isAddressLineOrPostcodePartName('OrganisationName')).toBe(false);
      expect(isAddressLineOrPostcodePartName('FirstName')).toBe(false);
    });
  });

  describe('addressToPromptChildValues', () => {
    it('should map a selected address onto the matching promptRefs', () => {
      const address: Address = {
        line1: '29 Acacia Road',
        line2: 'Flat 2',
        town: 'Bristol',
        postcode: 'BS1 1AA'
      };

      expect(addressToPromptChildValues(address, CHILDREN)).toEqual({
        testAddress1: '29 Acacia Road',
        testAddress2: 'Flat 2',
        testAddress3: 'Bristol',
        testPostCode: 'BS1 1AA'
      });
    });

    it('should prefer an explicit line3/line4 over town/county when both are present', () => {
      const address: Address = {
        line1: '29 Acacia Road',
        line3: 'Old Market',
        line4: 'Avon',
        town: 'Bristol',
        county: 'Somerset',
        postcode: 'BS1 1AA'
      };

      expect(addressToPromptChildValues(address, CHILDREN)).toMatchObject({
        testAddress3: 'Old Market',
        testAddress4: 'Avon'
      });
    });

    it('should not set values for children the address has nothing for', () => {
      const address: Address = { line1: '29 Acacia Road', town: 'Bristol', postcode: 'BS1 1AA' };
      const values = addressToPromptChildValues(address, CHILDREN);

      expect(values).not.toHaveProperty('testAddress4');
      expect(values).not.toHaveProperty('testAddress5');
      expect(values).not.toHaveProperty('testEmailAddress1');
    });
  });

  describe('promptChildValuesToAddress', () => {
    const formValues = (
      values: Record<string, string>
    ): Record<string, DraftResultPrompt<string>> => {
      return Object.entries(values).reduce(
        (acc, [promptRef, value]) => ({
          ...acc,
          [promptRef]: { promptRef, value, type: 'TXT', promptId: '1', label: '' }
        }),
        {}
      );
    };

    it('should map existing promptRef values back to an Address', () => {
      const values = formValues({
        testAddress1: '29 Acacia Road',
        testAddress3: 'Bristol',
        testPostCode: 'BS1 1AA',
        testEmailAddress1: 'foo@bar.com'
      });

      expect(promptChildValuesToAddress(values, CHILDREN)).toEqual({
        line1: '29 Acacia Road',
        line2: undefined,
        line3: 'Bristol',
        line4: undefined,
        line5: undefined,
        town: '',
        postcode: 'BS1 1AA'
      });
    });

    it('should return null when there is no address line 1 or postcode value yet', () => {
      const values = formValues({ testEmailAddress1: 'foo@bar.com' });

      expect(promptChildValuesToAddress(values, CHILDREN)).toBeNull();
    });
  });
});
