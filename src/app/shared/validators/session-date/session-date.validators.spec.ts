import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { SessionDateValidator } from './session-date.validator';
import { PdkDatePickerInputComponent } from '@cpp/pdk';
import moment from 'moment';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

let todaysDate = new Date();
jest.mock('../../../core/utils/cpp-date', () => {
  const cppDateModule = jest.requireActual('../../../core/utils/cpp-date');
  return {
    ...cppDateModule,
    getCPPDate: () => {
      const actualCPPDate = cppDateModule.getCPPDate();
      actualCPPDate.getCurrentDate = jest.fn().mockReturnValue(todaysDate);
      return actualCPPDate;
    }
  };
});

describe('Session Date Validator', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let form: NgForm;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    form = fixture.debugElement.children[0].injector.get(NgForm);
    fixture.detectChanges();
  });

  it('should validate the supplied value', () => {
    fixture.detectChanges();
    expect(form.valid).toEqual(true);
  });

  it('should fail validation if selected date is in future', () => {
    todaysDate = moment().set('date', 8).toDate();

    const dateInput = form.controls['sessionDateFilter'];
    dateInput.setValue(moment().set('date', 9).format('YYYY-MM-DD'));
    fixture.detectChanges();

    expect(form.valid).toEqual(false);
    expect(dateInput.errors['sessionDateInFuture']).toBe(true);
  });

  it('should pass validation when selected date is todays date', () => {
    todaysDate = moment().set('date', 7).toDate();

    const selectedDate = moment(todaysDate).format('YYYY-MM-DD');

    const dateInput = form.controls['sessionDateFilter'];
    dateInput.setValue(selectedDate);
    fixture.detectChanges();

    expect(form.valid).toEqual(true);
  });

  it('should emit validation message when selected date is in future', () => {
    todaysDate = moment().set('date', 7).toDate();

    const selectedDate = moment(todaysDate).add(1, 'day').format('YYYY-MM-DD');

    const validator = fixture.debugElement
      .query(By.directive(SessionDateValidator))
      .injector.get(SessionDateValidator);

    jest.spyOn(validator.sessionDateValidated, 'emit');

    form.controls['sessionDateFilter'].setValue(selectedDate);
    fixture.detectChanges();

    expect(validator.sessionDateValidated.emit).toHaveBeenCalledWith(
      'SESSION_TIMES.SESSION_DATE_IN_FUTURE_ERROR'
    );
  });

  it('should emit required validation message when date is valid', () => {
    todaysDate = moment().set('date', 7).toDate();

    const selectedDate = moment(todaysDate).format('YYYY-MM-DD');

    const validator = fixture.debugElement
      .query(By.directive(SessionDateValidator))
      .injector.get(SessionDateValidator);

    jest.spyOn(validator.sessionDateValidated, 'emit');

    form.controls['sessionDateFilter'].setValue(selectedDate);
    fixture.detectChanges();

    expect(validator.sessionDateValidated.emit).toHaveBeenCalledWith(
      'SESSION_TIMES.SESSION_DATE_REQUIRED_MESSAGE'
    );
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <form>
      <pdk-date-picker-input
        name="sessionDateFilter"
        [id]="'sessionDateFilter'"
        [ngModel]="sessionDate"
        sessionDateValidator
      >
      </pdk-date-picker-input>
    </form>
  `,
  imports: [FormsModule, PdkDatePickerInputComponent, SessionDateValidator, CommonModule]
})
class TestHostComponent {
  sessionDate = moment(new Date()).format('YYYY-MM-DD');
}
