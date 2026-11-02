import { ChangeDetectorRef, Injector } from '@angular/core';
import { NgControl } from '@angular/forms';
import { DurationInputComponent } from '../duration-input.component';
import { DurationPromptChoice } from '../../../../results.interfaces';

const createPromptChoice = (overrides?: Partial<DurationPromptChoice>): DurationPromptChoice => ({
  type: 'DURATION',
  promptRef: 'durationRef',
  code: 'DURATION_CODE',
  label: 'Duration',
  promptOrder: 1,
  required: false,
  durationSequence: 1,
  multipleAllowed: false,
  children: [
    {
      label: 'Days',
      type: 'INT',
      code: 'DAY_CODE',
      promptRef: 'daysRef',
      welshLabel: 'Diwrnodau',
      minValue: '1',
      maxValue: '10'
    },
    {
      label: 'Hours',
      type: 'INT',
      code: 'HOUR_CODE',
      promptRef: 'hoursRef',
      welshLabel: 'Oriau',
      minValue: '0',
      maxValue: '24'
    }
  ],
  ...overrides
});

describe('Result Prompts DurationInputComponent', () => {
  let component: DurationInputComponent;
  let cdr: jest.Mocked<ChangeDetectorRef>;
  let injector: jest.Mocked<Injector>;

  beforeEach(() => {
    cdr = {
      markForCheck: jest.fn(),
      detectChanges: jest.fn()
    } as unknown as jest.Mocked<ChangeDetectorRef>;

    injector = {
      get: jest.fn()
    } as unknown as jest.Mocked<Injector>;

    component = new DurationInputComponent(cdr, injector);
    component.promptChoice = createPromptChoice();
  });

  describe('validate', () => {
    it('should return null when control is empty', () => {
      expect(component.validate({ value: null } as any)).toBeNull();
      expect(component.validate({ value: undefined } as any)).toBeNull();
      expect(component.validate({ value: '' } as any)).toBeNull();
    });

    it('should return durationUnitType when multiple values are provided and multipleAllowed is false', () => {
      const control = {
        value: [
          { label: 'Days', value: '1' },
          { label: 'Hours', value: '2' }
        ]
      } as any;

      expect(component.validate(control)).toEqual({ durationUnitType: 2 });
    });

    it('should not return durationUnitType when multipleAllowed is true', () => {
      component.promptChoice = createPromptChoice({ multipleAllowed: true });
      component.durationInputs = [{ name: 'Days', value: '1', valid: true }] as any;
      const control = {
        value: [
          { label: 'Days', value: '1' },
          { label: 'Hours', value: '2' }
        ]
      } as any;

      expect(component.validate(control)).toBeNull();
    });

    it.each(['abc', '1.2', '-3', ' 5'])(
      'should return number error for non-digit input: %s',
      invalidInput => {
        component.durationInputs = [{ name: 'Days', value: invalidInput, valid: false }] as any;
        const control = { value: [{ label: 'Days', value: invalidInput }] } as any;

        expect(component.validate(control)).toEqual({ number: true });
      }
    );

    it('should return durationFormat for invalid ngModel when digits are valid', () => {
      component.durationInputs = [
        { name: 'Days', value: '5', valid: false, errors: { pattern: true } }
      ] as any;
      const control = { value: [{ label: 'Days', value: '5' }] } as any;

      expect(component.validate(control)).toEqual({ durationFormat: { pattern: true } });
    });

    it('should return minimumValue when value is below minValue', () => {
      component.durationInputs = [{ name: 'Days', value: '0', valid: true }] as any;
      const control = { value: [{ label: 'Days', value: '0' }] } as any;

      expect(component.validate(control)).toEqual({ minimumValue: { minValue: 1 } });
    });

    it('should return maximumValue when value is above maxValue', () => {
      component.durationInputs = [{ name: 'Days', value: '11', valid: true }] as any;
      const control = { value: [{ label: 'Days', value: '11' }] } as any;

      expect(component.validate(control)).toEqual({ maximumValue: { maxValue: 10 } });
    });

    it('should return null for a valid value within min and max bounds', () => {
      component.durationInputs = [{ name: 'Days', value: '10', valid: true }] as any;
      const control = { value: [{ label: 'Days', value: '10' }] } as any;

      expect(component.validate(control)).toBeNull();
    });

    it('should skip inputs with empty values', () => {
      component.durationInputs = [
        { name: 'Days', value: '', valid: false, errors: { pattern: true } }
      ] as any;
      const control = { value: [{ label: 'Days', value: '' }] } as any;

      expect(component.validate(control)).toBeNull();
    });
  });

  describe('handleDurationChange', () => {
    it('should map and emits only inputs that have a value', () => {
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      component.durationInputs = [
        { name: 'Days', value: '6' },
        { name: 'Hours', value: '' }
      ] as any;

      component.handleDurationChange();

      expect(onChange).toHaveBeenCalledWith([
        {
          promptRef: 'Days',
          promptId: 'DAY_CODE',
          label: 'Days',
          type: 'INT',
          welshLabel: 'Diwrnodau',
          value: '6'
        }
      ]);
    });
  });

  describe('writeValue', () => {
    it('should write provided values to writtenValues and triggers change detection', () => {
      component.writeValue([
        { label: 'Days', value: 3 },
        { label: 'Hours', value: 12 }
      ]);

      expect(component.writtenValues).toEqual({ Days: 3, Hours: 12 });
      expect(cdr.detectChanges).toHaveBeenCalled();
    });

    it('should reset writtenValues when value is null', () => {
      component.writtenValues = { Days: '5' };

      component.writeValue(null);

      expect(component.writtenValues).toEqual({});
      expect(cdr.detectChanges).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should mark component for check', () => {
      component.markForCheck();
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('should return ngControl from injector', () => {
      const mockNgControl = { name: 'duration' } as NgControl;
      injector.get.mockReturnValue(mockNgControl as never);

      expect(component.ngControl).toBe(mockNgControl);
      expect(injector.get).toHaveBeenCalled();
    });

    it('should accept digits and rejects non-digits with regex', () => {
      expect(component.digitsOnlyRegex.test('1234')).toBe(true);
      expect(component.digitsOnlyRegex.test('12.3')).toBe(false);
      expect(component.digitsOnlyRegex.test('-1')).toBe(false);
      expect(component.digitsOnlyRegex.test('abc')).toBe(false);
    });

    it('should not throw registerOnTouched', () => {
      expect(() => component.registerOnTouched()).not.toThrow();
    });
  });

  describe('handleKeyDown', () => {
    it('should allow configured control keys', () => {
      [46, 8, 9, 27, 13, 110, 190].forEach(keyCode => {
        const event = {
          keyCode,
          shiftKey: false,
          preventDefault: jest.fn()
        } as unknown as KeyboardEvent;

        component.handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should prevent non-numeric input', () => {
      const event = {
        keyCode: 65,
        shiftKey: false,
        preventDefault: jest.fn()
      } as unknown as KeyboardEvent;

      component.handleKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent shifted numeric key input', () => {
      const event = {
        keyCode: 49,
        shiftKey: true,
        preventDefault: jest.fn()
      } as unknown as KeyboardEvent;

      component.handleKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
});
