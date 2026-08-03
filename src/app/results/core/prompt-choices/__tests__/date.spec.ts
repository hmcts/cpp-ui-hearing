import { getCPPDate } from '../../../../core/utils/cpp-date';
import { isDatePromptChoice, validateDateValue, validateFutureDateValue } from '../date';
import { DatePromptChoice } from '../../../results.interfaces';

describe('DATE prompt choice', () => {
  describe('isDatePromptChoice', () => {
    it('should return true for DATE type', () => {
      const promptChoice = { type: 'DATE' } as DatePromptChoice;
      expect(isDatePromptChoice(promptChoice)).toBe(true);
    });

    it('should return false for other types', () => {
      const promptChoice = { type: 'TEXT' } as unknown as DatePromptChoice;
      expect(isDatePromptChoice(promptChoice)).toBe(false);
    });
  });

  describe('validateDateValue', () => {
    it('should accept a well-formed date', () => {
      expect(validateDateValue('2026-07-13')).toBeNull();
    });

    it('should reject a malformed date', () => {
      expect(validateDateValue('2026-7-13')).toEqual({ dateFormat: true });
      expect(validateDateValue(123)).toEqual({ dateFormat: true });
    });
  });

  describe('validateFutureDateValue', () => {
    const hearingDay = '2026-07-13';

    it('should reject non-string values', () => {
      expect(validateFutureDateValue(123, hearingDay)).toEqual({ pastDate: true });
      expect(validateFutureDateValue(undefined, hearingDay)).toEqual({ pastDate: true });
    });

    it('should reject the hearing day itself', () => {
      expect(validateFutureDateValue(hearingDay, hearingDay)).toEqual({ pastDate: true });
    });

    it('should reject dates before the hearing day', () => {
      expect(validateFutureDateValue('2026-07-12', hearingDay)).toEqual({ pastDate: true });
      expect(validateFutureDateValue('2020-01-01', hearingDay)).toEqual({ pastDate: true });
    });

    it('should accept dates strictly after the hearing day', () => {
      expect(validateFutureDateValue('2026-07-14', hearingDay)).toBeNull();
    });

    it('should fall back to the current date when no hearing day is supplied', () => {
      const cppDate = getCPPDate();
      const today = cppDate.format(cppDate.getCurrentDate());
      const tomorrow = cppDate.format(cppDate.add(cppDate.getCurrentDate(), 1));

      expect(validateFutureDateValue(today)).toEqual({ pastDate: true });
      expect(validateFutureDateValue(tomorrow)).toBeNull();
    });
  });
});
