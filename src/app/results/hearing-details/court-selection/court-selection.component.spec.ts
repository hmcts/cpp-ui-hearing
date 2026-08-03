import { Component, forwardRef, Injector, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl } from '@angular/forms';
import { OrganisationUnit, OrganisationUnitAutosuggestComponent } from '@cpp/reference-data';
import { FormFieldControl } from '@cpp/pdk';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { CourtSelectionComponent } from './court-selection.component';

describe('CourtSelectionComponent', () => {
  let component: CourtSelectionComponent;
  let fixture: ComponentFixture<CourtSelectionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CourtSelectionComponent],
      providers: [provideMockStore({ initialState: {} }), provideRouter([])],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(CourtSelectionComponent, {
      remove: { imports: [OrganisationUnitAutosuggestComponent] },
      add: { imports: [MockOrganisationUnitAutosuggestComponent] }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CourtSelectionComponent);
    component = fixture.componentInstance;
    component.jurisdictionType = 'MAGISTRATES';
  });

  it('should render component', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should emit with selected court', () => {
    jest.spyOn(component.continue, 'emit');
    component.selectedCourtCentre = { id: '*' } as OrganisationUnit;
    component.onContinue();
    expect(component.continue.emit).toHaveBeenCalledWith({ id: '*' });
  });
});

@Component({
  selector: 'cpp-organisation-unit-autosuggest',
  template: `
    <div>Organisation Unit Autosuggest Mock</div>
    <div>jurisdictionCode: {{ jurisdictionCode }}</div>
    <div>required: {{ required }}</div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockOrganisationUnitAutosuggestComponent),
      multi: true
    },
    {
      provide: FormFieldControl,
      useExisting: forwardRef(() => MockOrganisationUnitAutosuggestComponent)
    }
  ]
})
class MockOrganisationUnitAutosuggestComponent implements ControlValueAccessor, FormFieldControl {
  @Input() jurisdictionCode?: string;
  @Input() required?: boolean;
  @Input() ariaDescribedBy: string = '';

  constructor(public injector: Injector) {}

  get ngControl() {
    return this.injector.get(NgControl);
  }

  id: string = '';
  controlType = 'autosuggest';
  multi = false;

  writeValue(value: OrganisationUnit): void {}
  registerOnChange(fn: (_: OrganisationUnit) => void): void {}
  registerOnTouched(): void {}
}
