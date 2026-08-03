import { FormControl } from '@angular/forms';
import { PromptChoiceValidatorDirective } from './prompt-choice-validator.directive';
import { validateValueForPromptChoice } from '../../core/helpers';
import { PromptChoice } from '../../results.interfaces';

jest.mock('../../core/helpers', () => ({
  validateValueForPromptChoice: jest.fn()
}));

describe('PromptChoiceValidatorDirective', () => {
  let directive: PromptChoiceValidatorDirective;
  let validateValueForPromptChoiceMock: jest.MockedFunction<typeof validateValueForPromptChoice>;

  beforeEach(() => {
    directive = new PromptChoiceValidatorDirective();
    validateValueForPromptChoiceMock = validateValueForPromptChoice as jest.MockedFunction<
      typeof validateValueForPromptChoice
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('validate', () => {
    it('should return null when promptChoiceValidator is not set', () => {
      const control = new FormControl('test value');
      directive.promptChoiceValidator = null;

      const result = directive.validate(control);

      expect(result).toBeNull();
      expect(validateValueForPromptChoiceMock).not.toHaveBeenCalled();
    });

    it('should return null when promptChoiceValidator is undefined', () => {
      const control = new FormControl('test value');
      directive.promptChoiceValidator = undefined;

      const result = directive.validate(control);

      expect(result).toBeNull();
      expect(validateValueForPromptChoiceMock).not.toHaveBeenCalled();
    });

    it('should call validateValueForPromptChoice with correct arguments', () => {
      const control = new FormControl('test value');
      const promptChoice = {
        type: 'TEXT',
        required: true,
        promptRef: 'test-prompt',
        code: 'TEST',
        label: 'Test Prompt',
        promptOrder: 1
      } as unknown as PromptChoice;
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(null);

      directive.validate(control);

      expect(validateValueForPromptChoiceMock).toHaveBeenCalledWith(promptChoice, 'test value');
    });

    it('should return null when validation passes', () => {
      const control = new FormControl('valid value');
      const promptChoice = {
        type: 'TEXT',
        required: true,
        promptRef: 'test-prompt',
        code: 'TEST',
        label: 'Test Prompt',
        promptOrder: 1
      } as unknown as PromptChoice;
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(null);

      const result = directive.validate(control);

      expect(result).toBeNull();
    });

    it('should return validation errors when validation fails', () => {
      const control = new FormControl('');
      const promptChoice = {
        type: 'TEXT',
        required: true,
        promptRef: 'test-prompt',
        code: 'TEST',
        label: 'Test Prompt',
        promptOrder: 1
      } as unknown as PromptChoice;
      const expectedErrors = { required: true };
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(expectedErrors);

      const result = directive.validate(control);

      expect(result).toEqual(expectedErrors);
    });

    it('should handle integer validation errors', () => {
      const control = new FormControl('abc');
      const promptChoice = {
        type: 'INTEGER',
        required: true,
        promptRef: 'test-prompt',
        code: 'TEST_INT',
        label: 'Test Integer',
        promptOrder: 1
      } as unknown as PromptChoice;
      const expectedErrors = { pattern: true };
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(expectedErrors);

      const result = directive.validate(control);

      expect(result).toEqual(expectedErrors);
    });

    it('should handle currency validation errors', () => {
      const control = new FormControl({ amount: -50, currency: 'GBP' });
      const promptChoice = {
        type: 'CURRENCY',
        required: true,
        promptRef: 'test-prompt',
        code: 'TEST_CURRENCY',
        label: 'Test Currency',
        promptOrder: 1
      } as unknown as PromptChoice;
      const expectedErrors = { min: true };
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(expectedErrors);

      const result = directive.validate(control);

      expect(result).toEqual(expectedErrors);
    });

    it('should handle date validation errors', () => {
      const control = new FormControl('invalid-date');
      const promptChoice = {
        type: 'DATE',
        required: true,
        promptRef: 'test-prompt',
        code: 'TEST_DATE',
        label: 'Test Date',
        promptOrder: 1
      } as unknown as PromptChoice;
      const expectedErrors = { parse: true };
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(expectedErrors);

      const result = directive.validate(control);

      expect(result).toEqual(expectedErrors);
    });

    it('should handle empty values for required fields', () => {
      const control = new FormControl('');
      const promptChoice = {
        type: 'TEXT',
        required: true,
        promptRef: 'test-prompt',
        code: 'TEST',
        label: 'Test Prompt',
        promptOrder: 1
      } as unknown as PromptChoice;
      const expectedErrors = { required: true };
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(expectedErrors);

      const result = directive.validate(control);

      expect(result).toEqual(expectedErrors);
    });

    it('should handle empty values for optional fields', () => {
      const control = new FormControl('');
      const promptChoice = {
        type: 'TEXT',
        required: false,
        promptRef: 'test-prompt',
        code: 'TEST',
        label: 'Test Prompt',
        promptOrder: 1
      } as unknown as PromptChoice;
      directive.promptChoiceValidator = promptChoice;
      validateValueForPromptChoiceMock.mockReturnValue(null);

      const result = directive.validate(control);

      expect(result).toBeNull();
    });
  });
});
