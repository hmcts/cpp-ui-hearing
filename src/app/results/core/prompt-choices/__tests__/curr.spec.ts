import { CurrencyPromptChoice } from '../../../results.interfaces';
import {
  isCurrencyPromptChoice,
  formatCurrencyValue,
  serializeCurrencyValue,
  validateCurrencyValue,
} from '../curr';

describe('CURR prompt choice', () => {
  describe('isCurrencyPromptChoice', () => {
    it('should return true for CURR type', () => {
      const promptChoice = { type: 'CURR' } as CurrencyPromptChoice;
      expect(isCurrencyPromptChoice(promptChoice)).toBe(true);
    });

    it('should return false for non-CURR type', () => {
      const promptChoice = { type: 'TXT' } as any;
      expect(isCurrencyPromptChoice(promptChoice)).toBe(false);
    });
  });

  describe('formatCurrencyValue', () => {
    it('should format value with pound sign and 2 decimal places', () => {
      expect(formatCurrencyValue('100')).toBe('£100.00');
      expect(formatCurrencyValue('99.5')).toBe('£99.50');
      expect(formatCurrencyValue('0')).toBe('£0.00');
    });
  });

  describe('serializeCurrencyValue', () => {
    it('should serialize value to 2 decimal places', () => {
      expect(serializeCurrencyValue('100')).toBe('100.00');
      expect(serializeCurrencyValue(99.5)).toBe('99.50');
      expect(serializeCurrencyValue(0)).toBe('0.00');
    });
  });

  describe('validateCurrencyValue', () => {
    it('should return null for valid currency values >= minValue', () => {
      const promptChoice = {
        type: 'CURR',
        minValue: '1',
      } as CurrencyPromptChoice;

      expect(validateCurrencyValue(promptChoice, '100')).toBeNull();
      expect(validateCurrencyValue(promptChoice, '1')).toBeNull();
      expect(validateCurrencyValue(promptChoice, 50)).toBeNull();
    });

    it('should return currencyMin error for values < minValue', () => {
      const promptChoice = {
        type: 'CURR',
        minValue: '1',
      } as CurrencyPromptChoice;

      expect(validateCurrencyValue(promptChoice, '0')).toEqual({ currencyMin: { expected: 1 } });
      expect(validateCurrencyValue(promptChoice, '0.50')).toEqual({ currencyMin: { expected: 1 } });
      expect(validateCurrencyValue(promptChoice, '-5')).toEqual({ currencyMin: { expected: 1 } });
    });

    it('should return currencyMin error for value < 0 when minValue is 0', () => {
      const promptChoice = {
        type: 'CURR',
        minValue: '0',
      } as CurrencyPromptChoice;

      expect(validateCurrencyValue(promptChoice, '-1')).toEqual({ currencyMin: { expected: 0 } });
      expect(validateCurrencyValue(promptChoice, '-0.01')).toEqual({
        currencyMin: { expected: 0 },
      });
    });

    it('should return null for value 0 when minValue is 0', () => {
      const promptChoice = {
        type: 'CURR',
        minValue: '0',
      } as CurrencyPromptChoice;

      expect(validateCurrencyValue(promptChoice, '0')).toBeNull();
      expect(validateCurrencyValue(promptChoice, '0.00')).toBeNull();
    });

    it('should return currency error for non-numeric values', () => {
      const promptChoice = {
        type: 'CURR',
        minValue: '0',
      } as CurrencyPromptChoice;

      expect(validateCurrencyValue(promptChoice, 'abc')).toEqual({ currency: true });
      expect(validateCurrencyValue(promptChoice, '!%o')).toEqual({ currency: true });
    });

    it('should require > 0 when minValue is undefined', () => {
      const promptChoice = {
        type: 'CURR',
      } as CurrencyPromptChoice;

      expect(validateCurrencyValue(promptChoice, '0')).toEqual({ currency: true });
      expect(validateCurrencyValue(promptChoice, '1')).toBeNull();
    });
  });
});
