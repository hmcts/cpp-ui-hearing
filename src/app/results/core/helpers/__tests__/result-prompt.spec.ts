import {
  deserializeDraftResultPromptValue,
  serializeDraftResultPromptValue,
  validateDraftResultPrompts
} from '../result-prompt';
import { DraftResultPrompt, PromptChoice, ResultPromptType } from '../../../results.interfaces';

const makePromptChoice = (
  type: string,
  promptRef: string,
  required: boolean,
  extras: Record<string, unknown> = {}
): PromptChoice =>
  ({
    type,
    promptRef,
    required,
    code: `code-${type}-${promptRef}`,
    label: promptRef,
    hidden: false,
    promptOrder: 1,
    nameAddressList: [],
    maxLength: '100',
    minLength: '0',
    ...extras
  } as unknown as PromptChoice);

const makeResultPrompt = (
  type: ResultPromptType,
  promptRef: string,
  value: unknown
): DraftResultPrompt => ({
  type,
  promptRef,
  value,
  promptId: `id-${type}-${promptRef}`,
  label: promptRef
});

describe('result prompt', () => {
  describe('deserializeDraftResultPromptValue', () => {
    it('should deserialize a BOOLEAN type', () => {
      expect(deserializeDraftResultPromptValue('BOOLEAN', 'true')).toEqual(true);
      expect(deserializeDraftResultPromptValue('BOOLEAN', 'false')).toEqual(false);
    });

    it('should deserialize a DURATION type', () => {
      expect(deserializeDraftResultPromptValue('DURATION', '2 Hours')).toEqual([
        { label: 'Hours', value: 2 }
      ]);
    });

    it('should deserialize a FIXLM type', () => {
      expect(deserializeDraftResultPromptValue('FIXLM', 'one###two')).toEqual(['one', 'two']);
    });

    it('should deserialize a FIXLOM type', () => {
      expect(deserializeDraftResultPromptValue('FIXLOM', 'one###two')).toEqual(['one', 'two']);
    });
  });

  describe('serializeDraftResultPromptValue', () => {
    it('should serialize a BOOLEAN type', () => {
      const result = serializeDraftResultPromptValue('BOOLEAN', true);

      expect(result).toEqual('true');
    });

    it('should serialize a CURR type', () => {
      expect(serializeDraftResultPromptValue('CURR', '50')).toEqual('50.00');
      expect(serializeDraftResultPromptValue('CURR', '50.6')).toEqual('50.60');
    });

    it('should serialize a DURATION type', () => {
      const result = serializeDraftResultPromptValue('DURATION', [{ label: 'Hours', value: 2 }]);

      expect(result).toEqual('2 Hours');
    });

    it('should serialize a FIXLM type', () => {
      const result = serializeDraftResultPromptValue('FIXLOM', ['one', 'two']);

      expect(result).toEqual('one###two');
    });

    it('should serialize a FIXLOM type', () => {
      const result = serializeDraftResultPromptValue('FIXLOM', ['one', 'two']);

      expect(result).toEqual('one###two');
    });
  });

  describe('validateDraftResultPrompts', () => {
    it('should return true when all required prompts have valid values', () => {
      const promptChoices = [makePromptChoice('TXT', 'reason', true)];
      const resultPrompts = [makeResultPrompt('TXT', 'reason', 'some text')];

      expect(validateDraftResultPrompts(promptChoices, resultPrompts)).toBe(true);
    });

    it('should return false when a required prompt is missing', () => {
      const promptChoices = [makePromptChoice('TXT', 'reason', true)];

      expect(validateDraftResultPrompts(promptChoices, [])).toBe(false);
    });

    it('should return true for an optional prompt with no value', () => {
      const promptChoices = [makePromptChoice('TXT', 'notes', false)];

      expect(validateDraftResultPrompts(promptChoices, [])).toBe(true);
    });

    it('should skip HIDDEN prompt choices regardless of value', () => {
      const promptChoices = [makePromptChoice('HIDDEN', 'hiddenField', true)];

      expect(validateDraftResultPrompts(promptChoices, [])).toBe(true);
    });

    it('should skip an INTM prompt that shares a promptRef with a DURATION prompt', () => {
      // CDDQ/CDDQS scenario: backend sends DURATION + INTM with the same promptRef.
      // The INTM is an internal sub-component of DURATION and must not be validated
      // separately — doing so would match the DURATION result prompt value against
      // the INTM integer validator, causing it to always fail.
      const durationPromptChoice = makePromptChoice('DURATION', 'disqualificationPeriod', true, {
        durationSequence: 1,
        multipleAllowed: false,
        children: []
      });
      const intmPromptChoice = makePromptChoice('INTM', 'disqualificationPeriod', true);
      const promptChoices = [durationPromptChoice, intmPromptChoice];
      const resultPrompts = [
        makeResultPrompt('DURATION', 'disqualificationPeriod', [
          { label: 'Days', value: 30, type: 'INT' }
        ])
      ];

      expect(validateDraftResultPrompts(promptChoices, resultPrompts)).toBe(true);
    });

    it('should not skip an INTM prompt when no DURATION shares its promptRef', () => {
      // Standalone INTM (e.g. a plain integer prompt that happens to use INTM type)
      // must still be validated normally.
      const promptChoices = [makePromptChoice('INTM', 'numberOfWeeks', true)];

      expect(validateDraftResultPrompts(promptChoices, [])).toBe(false);
      expect(
        validateDraftResultPrompts(promptChoices, [makeResultPrompt('INTM', 'numberOfWeeks', '12')])
      ).toBe(true);
    });

    it('should validate multiple prompt types together', () => {
      const durationPromptChoice = makePromptChoice('DURATION', 'disqualificationPeriod', true, {
        durationSequence: 1,
        multipleAllowed: false,
        children: []
      });
      const intmPromptChoice = makePromptChoice('INTM', 'disqualificationPeriod', true);
      const txtPromptChoice = makePromptChoice('TXT', 'licenceNumber', false);
      const promptChoices = [durationPromptChoice, intmPromptChoice, txtPromptChoice];

      // Missing DURATION → invalid
      expect(validateDraftResultPrompts(promptChoices, [])).toBe(false);

      // DURATION filled, INTM skipped, optional TXT absent → valid
      const resultPrompts = [
        makeResultPrompt('DURATION', 'disqualificationPeriod', [
          { label: 'Months', value: 3, type: 'INT' }
        ])
      ];
      expect(validateDraftResultPrompts(promptChoices, resultPrompts)).toBe(true);
    });
  });
});
