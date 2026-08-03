import { TextPromptChoice } from '../../../results.interfaces';
import { validateTextValue } from '../txt';

describe('Text prompt choice', () => {
  describe('validateTextValue', () => {
    it('should validate alphanumeric, commas and symbols for Protected person', () => {
      const promptChoice = {
        type: 'TXT',
        label: "Protected person's name",
        promptRef: 'protectedPersonsName'
      } as TextPromptChoice;

      // Numbers
      expect(validateTextValue(promptChoice, 'First Lastname 122')).toEqual({
        pattern: { promptFriendlyName: 'protected person' }
      });

      //Commas
      expect(validateTextValue(promptChoice, 'First,Lastname')).toEqual({
        pattern: { promptFriendlyName: 'protected person' }
      });

      //Symbols
      expect(validateTextValue(promptChoice, 'First :Lastname')).toEqual({
        pattern: { promptFriendlyName: 'protected person' }
      });

      // Valid Name
      expect(validateTextValue(promptChoice, 'First Lastname')).toBeFalsy();
    });

    it('should validate alphanumeric, commas and symbols for third party', () => {
      const promptChoice = {
        type: 'TXT',
        label: "Third party's name",
        promptRef: 'thirdPartysNameVictimOrPolice'
      } as TextPromptChoice;

      // Numbers
      expect(validateTextValue(promptChoice, 'First Lastname 122')).toEqual({
        pattern: { promptFriendlyName: 'third party' }
      });

      //Commas
      expect(validateTextValue(promptChoice, 'First,Lastname')).toEqual({
        pattern: { promptFriendlyName: 'third party' }
      });

      //Symbols
      expect(validateTextValue(promptChoice, 'First :Lastname')).toEqual({
        pattern: { promptFriendlyName: 'third party' }
      });

      // Valid Name
      expect(validateTextValue(promptChoice, 'First Lastname')).toBeFalsy();
    });
  });
});
