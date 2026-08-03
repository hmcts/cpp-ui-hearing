import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, forwardRef, Injector, Input, Output } from '@angular/core';
import { FormFieldControl } from '@cpp/pdk';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import {
  HearingType,
  OrganisationUnit,
  OrganisationUnitAutosuggestComponent,
  HearingTypeAutosuggestComponent
} from '@cpp/reference-data';
import { CourtDetailsComponent, FormValues } from '../court-details.component';
import { DurationInputComponent } from '../../../../../shared/components/duration-input/duration-input.component';
import { HearingDetail } from '../../../../../core';
import { JudiciaryTypeaheadComponent } from '../../../../../session-times/session-times-judiciary/components/judiciary-typeahead/judiciary-typeahead.component';

const fakeHearingTypes = [
  { id: 'HEARINGTYPEA', hearingCode: 'AT', defaultDurationMin: 20 },
  { id: 'HEARINGTYPEB', hearingCode: 'TRL', defaultDurationMin: 30 }
] as HearingType[];

const hearingDetailsMock = {
  id: 'x',
  judiciary: [],
  hearingDays: [{ sittingDay: '2023-02-20' }]
} as HearingDetail;

describe('CourtDetailsComponent', () => {
  let fixture: ComponentFixture<CourtDetailsComponent>;
  let component: CourtDetailsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CourtDetailsComponent],
      providers: [provideRouter([]), provideMockStore()],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(CourtDetailsComponent, {
      remove: {
        imports: [
          OrganisationUnitAutosuggestComponent,
          JudiciaryTypeaheadComponent,
          HearingTypeAutosuggestComponent,
          DurationInputComponent
        ]
      },
      add: {
        imports: [
          MockAutoSuggestComponent,
          MockJudiciaryAutoSuggestComponent,
          MockHearingTypesAutoSuggestComponent,
          MockEstimateInputComponent,
          MockDurationInputComponent
        ]
      }
    });

    fixture = TestBed.createComponent(CourtDetailsComponent);
    component = fixture.componentInstance;
    component.judiciary = [];
  });

  it('should render the component', () => {
    component.hearingTypes = fakeHearingTypes;
    component.hearingData = hearingDetailsMock;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should dispatch an event when the form is submitted to refer for new hearing', () => {
    component.hearingTypes = fakeHearingTypes;
    component.hearingData = hearingDetailsMock;
    jest.spyOn(component.submitData, 'emit');

    fixture.detectChanges();

    const formData = {
      startTime: '10:10',

      courtCentre: {
        id: '9b583616-049b-30f9-a14f-028a53b7cfe8',
        oucodeL3Name: 'Liverpool Crown Court'
      } as OrganisationUnit
    } as FormValues;

    component.onSubmit(formData);

    expect(component.submitData.emit).toHaveBeenCalledWith(formData);
  });
});
@Component({
  selector: 'cpp-organisation-unit-autosuggest',
  template: `
    <div>Organisation Unit Autosuggest Mock</div>
    <div>jurisdictionCode: {{ jurisdictionCode }}</div>
    <div>name: {{ name }}</div>
    <div>required: {{ required }}</div>
  `,
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
  @Input() jurisdictionCode: string;
  @Input() filterBy: (unit: OrganisationUnit) => boolean;
  @Input() required: boolean;
  @Input() name: string;
  propagateChange(fn: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
  writeValue(fn: any): void {}
}

@Component({
  selector: 'judiciary-typeahead',
  template: `
    <div>Judiciary Typeahead Mock</div>
    <div>name: {{ name }}</div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockJudiciaryAutoSuggestComponent),
      multi: true
    },
    {
      provide: FormFieldControl,
      useExisting: forwardRef(() => MockJudiciaryAutoSuggestComponent)
    }
  ]
})
class MockJudiciaryAutoSuggestComponent {
  @Input() name: string;
  propagateChange(fn: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
  writeValue(fn: any): void {}
}

@Component({
  selector: 'cpp-hearing-type-autosuggest',
  template: `
    <div>Hearing Type Autosuggest Mock</div>
    <div>jurisdictionType: {{ jurisdictionType }}</div>
    <div>name: {{ name }}</div>
    <div>justified: {{ justified }}</div>
    <div>required: {{ required }}</div>
    <div>placeholder: {{ placeholder }}</div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockHearingTypesAutoSuggestComponent),
      multi: true
    },
    {
      provide: FormFieldControl,
      useExisting: forwardRef(() => MockHearingTypesAutoSuggestComponent)
    }
  ]
})
class MockHearingTypesAutoSuggestComponent {
  @Input() jurisdictionType: string;
  @Input() name: string;
  @Input() justified: boolean;
  @Input() required: boolean;
  @Input() placeholder: string;
  propagateChange(fn: any): void {}
  registerOnChange(fn: any): void {}
  registerOnTouched(fn: any): void {}
  writeValue(fn: any): void {}
}

@Component({
  selector: 'estimate-input',
  template: `
    <div>Estimate Input Mock</div>
    <div>name: {{ name }}</div>
    <div>required: {{ required }}</div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: MockEstimateInputComponent
    },
    {
      provide: FormFieldControl,
      useExisting: MockEstimateInputComponent
    }
  ]
})
class MockEstimateInputComponent implements ControlValueAccessor, FormFieldControl {
  @Input() name: string;
  @Input() required: boolean;
  @Output() inputText = new EventEmitter<string>();
  constructor(public injector: Injector) {}
  get ngControl() {
    return this.injector.get(NgControl);
  }
  id!: string;
  ariaDescribedBy!: string;
  controlType = 'typeahead';
  multi = false;
  writeValue(value: string) {}
  registerOnChange(fn: (_: any) => void): void {}
  registerOnTouched() {}
}

@Component({
  selector: 'duration-input',
  template: `
    <div>Duration Input Mock</div>
    <div>name: {{ name }}</div>
    <div>required: {{ required }}</div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: MockDurationInputComponent
    },
    {
      provide: FormFieldControl,
      useExisting: MockDurationInputComponent
    }
  ]
})
class MockDurationInputComponent implements ControlValueAccessor, FormFieldControl {
  @Input() name: string;
  @Input() required: boolean;
  @Output() inputText = new EventEmitter<string>();
  constructor(public injector: Injector) {}
  get ngControl() {
    return this.injector.get(NgControl);
  }
  id!: string;
  ariaDescribedBy!: string;
  controlType = 'typeahead';
  multi = false;
  writeValue(value: string) {}
  registerOnChange(fn: (_: any) => void): void {}
  registerOnTouched() {}
}
