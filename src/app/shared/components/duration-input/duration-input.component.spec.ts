import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, FormsModule, NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DurationInputComponent } from './duration-input.component';
import { DraftResultPromptValue } from '../../../results/results.interfaces';

describe('DurationInputComponent', () => {
  let fixture: ComponentFixture<TestDurationComponent>;
  let form: NgForm;
  let duration: AbstractControl;
  let component: DurationInputComponent;

  @Component({
    selector: 'test-duration-component',
    template: `
      <form>
        <duration-input
          name="duration"
          [ngModel]="model"
          [ariaDescribedBy]="ariaDescribedBy"
          [hasError]="hasError"
        ></duration-input>
      </form>
    `,
    imports: [FormsModule, DurationInputComponent]
  })
  class TestDurationComponent {
    model: DraftResultPromptValue[] | null = null;
    ariaDescribedBy?: string;
    hasError = false;
  }

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestDurationComponent],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestDurationComponent);
    fixture.detectChanges();
    tick();
    form = fixture.debugElement.children[0].injector.get(NgForm);
    duration = form.control.get('duration');
    component = fixture.debugElement.query(By.directive(DurationInputComponent)).componentInstance;
  }));

  describe('Component initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct control type', () => {
      expect(component.controlType).toBe('duration');
    });

    it('should have multi property set to true', () => {
      expect(component.multi).toBe(true);
    });

    it('should have default error messages', () => {
      expect(component.errorMessages).toEqual([
        { rule: 'required', message: 'Enter a number under one unit of time, for example 22 days' },
        { rule: 'durationUnitType', message: 'Use only one duration unit' },
        { rule: 'durationFormat', message: 'Enter a valid number' }
      ]);
    });

    it('should generate a unique id', () => {
      expect(component.id).toBeTruthy();
      expect(component.id).toContain('duration-input');
    });

    it('should have empty writtenValues on initialization', () => {
      expect(component.writtenValues).toEqual({});
    });
  });

  describe('Template rendering', () => {
    it('should render all four input fields', () => {
      const inputs = fixture.debugElement.queryAll(By.css('input'));
      expect(inputs.length).toBe(4);
    });

    it('should render labels for all inputs', () => {
      const labels = fixture.debugElement.queryAll(By.css('label'));
      expect(labels.length).toBe(4);
      expect(labels[0].nativeElement.textContent.trim()).toBe('Weeks');
      expect(labels[1].nativeElement.textContent.trim()).toBe('Days');
      expect(labels[2].nativeElement.textContent.trim()).toBe('Hours');
      expect(labels[3].nativeElement.textContent.trim()).toBe('Minutes');
    });

    it('should set correct input attributes', () => {
      const inputs = fixture.debugElement.queryAll(By.css('input'));
      inputs.forEach(input => {
        expect(input.nativeElement.getAttribute('type')).toBe('text');
        expect(input.nativeElement.getAttribute('pattern')).toBe('^(?:[1-9][0-9]*)');
        expect(input.nativeElement.getAttribute('maxlength')).toBe('4');
        expect(input.nativeElement.getAttribute('autocomplete')).toBe('off');
      });
    });

    it('should link labels to inputs via id', () => {
      const labels = fixture.debugElement.queryAll(By.css('label'));
      const inputs = fixture.debugElement.queryAll(By.css('input'));

      expect(labels[0].nativeElement.getAttribute('for')).toBe(inputs[0].nativeElement.id);
      expect(labels[1].nativeElement.getAttribute('for')).toBe(inputs[1].nativeElement.id);
      expect(labels[2].nativeElement.getAttribute('for')).toBe(inputs[2].nativeElement.id);
      expect(labels[3].nativeElement.getAttribute('for')).toBe(inputs[3].nativeElement.id);
    });

    it('should set aria-describedby when provided', () => {
      fixture.componentInstance.ariaDescribedBy = 'error-summary';
      fixture.detectChanges();

      const inputs = fixture.debugElement.queryAll(By.css('input'));
      inputs.forEach(input => {
        expect(input.nativeElement.getAttribute('aria-describedby')).toBe('error-summary');
      });
    });

    it('should apply hasError to inputs', () => {
      fixture.componentInstance.hasError = true;
      fixture.detectChanges();

      const inputs = fixture.debugElement.queryAll(By.css('input'));
      inputs.forEach(input => {
        expect(input.nativeElement.getAttribute('ng-reflect-has-error')).toBe('true');
      });
    });
  });

  describe('Form integration through writeValue', () => {
    it('should populate inputs when model is set externally', fakeAsync(() => {
      fixture.componentInstance.model = [
        { label: 'WEEKS', value: 2 },
        { label: 'HOURS', value: 5 }
      ];
      fixture.detectChanges();
      tick();

      const inputs = fixture.debugElement.queryAll(By.css('input'));
      expect(inputs[0].nativeElement.value).toBe('2');
      expect(inputs[1].nativeElement.value).toBe('');
      expect(inputs[2].nativeElement.value).toBe('5');
      expect(inputs[3].nativeElement.value).toBe('');
    }));

    it('should clear inputs when model is set to null', fakeAsync(() => {
      fixture.componentInstance.model = [{ label: 'DAYS', value: 10 }];
      fixture.detectChanges();
      tick();

      fixture.componentInstance.model = null;
      fixture.detectChanges();
      tick();

      const inputs = fixture.debugElement.queryAll(By.css('input'));
      inputs.forEach(input => {
        expect(input.nativeElement.value).toBe('');
      });
    }));
  });

  describe('Validation', () => {
    it('should be valid when no value is entered', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      expect(duration.valid).toBe(true);
      expect(duration.errors).toBeNull();
    }));

    it('should return durationUnitType error when multiple units are used', () => {
      const control = {
        value: [
          { label: 'WEEKS', value: 1 },
          { label: 'DAYS', value: 2 }
        ]
      } as any;
      const result = component.validate(control);

      expect(result).toEqual({ durationUnitType: 2 });
    });

    it('should return null for empty value', () => {
      const control = { value: null } as any;
      const result = component.validate(control);

      expect(result).toBeNull();
    });

    it('should return null for undefined value', () => {
      const control = { value: undefined } as any;
      const result = component.validate(control);

      expect(result).toBeNull();
    });

    it('should return null for valid single duration', fakeAsync(() => {
      component.durationInputs = {
        reduce: jest.fn((callback, initial) => {
          return callback(initial, {
            valid: true,
            name: 'Days'
          });
        })
      } as any;

      const control = { value: [{ label: 'DAYS', value: 7 }] } as any;
      const result = component.validate(control);

      expect(result).toBeNull();
    }));

    it('should return durationFormat error when input is invalid', fakeAsync(() => {
      const control = { value: [{ label: 'DAYS', value: 5 }] } as any;

      component.durationInputs = {
        reduce: jest.fn((callback, initial) => {
          return callback(initial, {
            valid: false,
            name: 'Days',
            errors: { pattern: true }
          });
        })
      } as any;

      const result = component.validate(control);

      expect(result).toEqual({
        durationFormat: {
          Days: { pattern: true }
        }
      });
    }));
  });

  describe('Keyboard input restrictions', () => {
    it('should allow numeric keys', () => {
      for (let keyCode = 48; keyCode <= 57; keyCode++) {
        const event = new KeyboardEvent('keydown', { keyCode } as any);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        component.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
      }
    });

    it('should allow numeric keypad keys', () => {
      for (let keyCode = 96; keyCode <= 105; keyCode++) {
        const event = new KeyboardEvent('keydown', { keyCode } as any);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        component.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
      }
    });

    it('should allow navigation keys', () => {
      const allowedKeys = [8, 9, 13, 27, 46];

      allowedKeys.forEach(keyCode => {
        const event = new KeyboardEvent('keydown', { keyCode } as any);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        component.handleKeyDown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
      });
    });

    it('should prevent alphabetic keys', () => {
      const event = new KeyboardEvent('keydown', { keyCode: 65 } as any);
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      component.handleKeyDown(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent shift + number keys', () => {
      const event = new KeyboardEvent('keydown', {
        keyCode: 49,
        shiftKey: true
      } as any);
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      component.handleKeyDown(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should prevent special characters', () => {
      const specialKeys = [189, 187, 219, 221, 220, 186, 222, 188, 191];

      specialKeys.forEach(keyCode => {
        const event = new KeyboardEvent('keydown', { keyCode } as any);
        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

        component.handleKeyDown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });
  });

  describe('ControlValueAccessor implementation', () => {
    it('should implement registerOnChange', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component.handleDurationChange();

      expect(onChangeSpy).toHaveBeenCalled();
    });

    it('should implement registerOnTouched', () => {
      expect(() => component.registerOnTouched()).not.toThrow();
    });

    it('should implement writeValue with array of values', fakeAsync(() => {
      const values: DraftResultPromptValue[] = [
        { label: 'WEEKS', value: 2 },
        { label: 'DAYS', value: 5 }
      ];

      component.writeValue(values);
      tick();

      expect(component.writtenValues).toEqual({
        Weeks: '2',
        Days: '5'
      });
    }));

    it('should implement writeValue with null', fakeAsync(() => {
      component.writtenValues = { Days: '10' };

      component.writeValue(null);
      tick();

      expect(component.writtenValues).toEqual({});
    }));

    it('should convert number values to strings in writeValue', fakeAsync(() => {
      const values: DraftResultPromptValue[] = [{ label: 'HOURS', value: 123 }];

      component.writeValue(values);
      tick();

      expect(component.writtenValues).toEqual({ Hours: '123' });
    }));
  });

  describe('handleDurationChange', () => {
    it('should emit values with uppercase labels', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      component.durationInputs = {
        filter: jest.fn().mockReturnValue([{ name: 'Weeks', value: '5' }]),
        map: jest.fn(fn => [fn({ name: 'Weeks', value: '5' })])
      } as any;

      component.handleDurationChange();

      expect(onChangeSpy).toHaveBeenCalledWith([{ label: 'WEEKS', value: '5' }]);
    });

    it('should filter out inputs with no value', () => {
      const onChangeSpy = jest.fn();
      component.registerOnChange(onChangeSpy);

      const mockInputs = [
        { name: 'Weeks', value: '' },
        { name: 'Days', value: '3' },
        { name: 'Hours', value: '' }
      ];

      const filtered = mockInputs.filter(i => i.value);

      component.durationInputs = {
        filter: jest.fn(() => filtered),
        map: jest.fn(mapFn => filtered.map(mapFn))
      } as any;

      component.handleDurationChange();

      const calledWith = onChangeSpy.mock.calls[0][0];
      expect(calledWith).toHaveLength(1);
      expect(calledWith[0]).toEqual({ label: 'DAYS', value: '3' });
    });
  });

  describe('markForCheck', () => {
    it('should call markForCheck on ChangeDetectorRef', () => {
      const markForCheckSpy = jest.spyOn(component['cdr'], 'markForCheck');

      component.markForCheck();

      expect(markForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('ngControl', () => {
    it('should retrieve NgControl from injector', () => {
      const ngControl = component.ngControl;

      expect(ngControl).toBeDefined();
      expect(ngControl.name).toBe('duration');
    });
  });

  describe('Input options', () => {
    it('should have all four duration options', () => {
      expect(component.inputOptions).toEqual([
        { label: 'Weeks' },
        { label: 'Days' },
        { label: 'Hours' },
        { label: 'Minutes' }
      ]);
    });
  });
});
