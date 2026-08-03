import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { By } from '@angular/platform-browser';
import { HearingListFilterComponent } from './hearing-list-filter.component';
import { OrganisationUnit } from '@cpp/reference-data';
import { mockSelectedOptions } from '../../mock-data/test-mock-data';
import { reducers } from 'src/app/core';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { TranslateMockPipe } from '../../shared/pipes/mock-pipes/translate-mock.pipe';

describe('HearingListFilterComponent', () => {
  let component: HearingListFilterComponent;
  let fixture: ComponentFixture<HearingListFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HearingListFilterComponent],
      providers: [provideTranslateService(), provideStore(reducers, { runtimeChecks: {} })],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(HearingListFilterComponent, {
        remove: { imports: [TranslatePipe] },
        add: { imports: [TranslateMockPipe] }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingListFilterComponent);
    component = fixture.componentInstance;
    component.selectedOptions = {
      courtCentreFilter: null,
      courtRoomFilter: null,
      dateFilter: null,
      startTimeFilter: null,
      endTimeFilter: null
    };

    fixture.detectChanges();

    // pdk-typeahead input element uses a randomly generated name attribute.
    // Need to make this a fixed name so Jest tests pass between test runs.
    const courtCentreAutoSuggestEl = fixture.debugElement.queryAll(By.css('pdk-autosuggest input'));
    courtCentreAutoSuggestEl.forEach(element => (element.nativeElement.name = 'stubbed-name'));
  });

  it('should create the right templates with default values', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should create the right templates with previously populated filters', () => {
    component.selectedOptions = mockSelectedOptions;
    expect(fixture).toMatchSnapshot();
  });

  it('should load default values with populated filters', () => {
    jest.spyOn(component, 'courtCentreSelected');

    component.selectedOptions = mockSelectedOptions;
    component.courtCentres = [
      {
        id: mockSelectedOptions.courtCentreFilter.id as string,
        name: mockSelectedOptions.courtCentreFilter.name,
        courtrooms: []
      }
    ];

    component.ngOnInit();

    expect(component.courtCentreSelected).toHaveBeenCalledWith({
      id: component.selectedOptions.courtCentreFilter.id
    } as OrganisationUnit);
  });

  it('should populate values oninit', () => {
    component.selectedOptions = mockSelectedOptions;
    component.selectedOrganisationUnit = {
      id: component.selectedOptions.courtCentreFilter.id
    } as OrganisationUnit;
    component.courtCentres = [
      {
        id: mockSelectedOptions.courtCentreFilter.id as string,
        name: mockSelectedOptions.courtCentreFilter.name,
        courtrooms: [
          {
            id: mockSelectedOptions.courtRoomFilter.id as string,
            name: mockSelectedOptions.courtRoomFilter.name
          }
        ]
      }
    ];

    fixture.detectChanges();

    component.courtCentreSelected(component.selectedOrganisationUnit);

    expect(component.selectedCourtCentre).toEqual(component.courtCentres[0]);
    expect(component.selectedOrganisationUnit).toEqual({
      id: component.selectedOptions.courtCentreFilter.id,
      oucodeL3Name: component.selectedOptions.courtCentreFilter.name
    });
  });

  it('should emit search', () => {
    jest.spyOn(component.onApplySearch, 'emit');

    component.applySearch();
    expect(component.onApplySearch.emit).toHaveBeenCalled();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
