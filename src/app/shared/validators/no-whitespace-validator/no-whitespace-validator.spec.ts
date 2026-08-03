import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoWhitespaceValidator } from './no-whitespace-validator';
import { CommonModule } from '@angular/common';

describe('No Whitespace Validator', () => {
  let fixture: ComponentFixture<TestNoWhitespaceValidator>;
  let form: NgForm;
  let ctrlElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestNoWhitespaceValidator],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestNoWhitespaceValidator);
    form = fixture.debugElement.children[0].injector.get(NgForm);
    ctrlElement = fixture.debugElement.query(By.css('[name=someInputName]'));
    fixture.detectChanges();
  });

  const setValue = (elementRef: any, value: any) => {
    elementRef.nativeElement.value = value;
    elementRef.nativeElement.dispatchEvent(new Event('input'));
  };

  const invalidError = {
    containsOnlyWhitespaces: { someInputName: true }
  };

  it('should validate the supplied value', () => {
    fixture.componentInstance.model = 'test name';
    fixture.detectChanges();
    expect(form.valid).toEqual(true);
  });

  it('should not validate an empty or null input', () => {
    setValue(ctrlElement, '');
    expect(form.valid).toEqual(true);

    setValue(ctrlElement, null);
    expect(form.valid).toEqual(true);
  });

  it('should invalidate an incorrect value and set error', () => {
    setValue(ctrlElement, '      ');
    expect(form.valid).toEqual(false);
    expect(form.control.controls['someInputName'].errors).toEqual(invalidError);
  });
});

@Component({
  selector: 'test-no-whitespace-validation',
  template: `
    <form>
      <input name="someInputName" [ngModel]="model" noWhitespaceValidator />
    </form>
  `,
  imports: [FormsModule, CommonModule, NoWhitespaceValidator]
})
class TestNoWhitespaceValidator {
  model: string;
}
