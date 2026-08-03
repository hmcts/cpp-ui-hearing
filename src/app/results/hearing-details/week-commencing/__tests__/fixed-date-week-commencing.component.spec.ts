import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, forwardRef } from '@angular/core';
import { FormFieldControl } from '@cpp/pdk';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { FixedDateWeekCommencingComponent } from '../fixed-date-week-commencing.component';
import { OrganisationUnitAutosuggestComponent } from '@cpp/reference-data';

describe('Refer court form component', () => {
  let fixture: ComponentFixture<FixedDateWeekCommencingComponent>;
  let component: FixedDateWeekCommencingComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FixedDateWeekCommencingComponent],
      providers: [provideRouter([])],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(FixedDateWeekCommencingComponent, {
      remove: {
        imports: [OrganisationUnitAutosuggestComponent]
      },
      add: {
        imports: [MockAutoSuggestComponent]
      }
    });

    fixture = TestBed.createComponent(FixedDateWeekCommencingComponent);
    component = fixture.componentInstance;
  });

  it('should render the component', () => {
    component.initialValues = {};
    component.showDateToBeFixed = false;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  @Component({
    selector: 'cpp-organisation-unit-autosuggest',
    template: ``,
    providers: [
      {
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => MockAutoSuggestComponent),
        multi: true
      },
      {
        provide: FormFieldControl,
        useExisting: forwardRef(() => MockAutoSuggestComponent)
      }
    ]
  })
  class MockAutoSuggestComponent {
    propagateChange(fn: any): void {}
    registerOnChange(fn: any): void {}
    registerOnTouched(fn: any): void {}
    writeValue(fn: any): void {}
  }
});
