import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { CompanyRepresentativesPanelComponent } from './company-representatives-panel.component';
import {
  mockLegalEntityDefendant,
  mockCompanyRepresentatives,
  mockCounselsCache,
  mockBulkDefendant
} from '../../../mock-data/test-mock-data';
import { CounselsCache, CompanyRepresentative, Defendant } from '../../../core';
import { By } from '@angular/platform-browser';

describe('CompanyRepresentativesPanelComponent', () => {
  let component: CompanyRepresentativesPanelComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = TestBed.createComponent(CompanyRepresentativesPanelComponent).componentInstance;

    component.companyRepresentatives = mockCompanyRepresentatives as CompanyRepresentative[];
    component.defendantsCurrentHearing = mockLegalEntityDefendant as Defendant[];
    component.counselsCacheOptions = mockCounselsCache as CounselsCache;
    fixture.detectChanges();

    // pdk-typeahead input element uses a randomly generated name attribute.
    // Need to make this a fixed name so Jest tests pass between test runs.
    const judgesAutosuggestEl = fixture.debugElement.queryAll(By.css('pdk-autosuggest input'));
    judgesAutosuggestEl.forEach(element => (element.nativeElement.name = 'stubbed-name'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('#configureOptions', () => {
    it('should return expected', () => {
      const defendant: Defendant[] = [...(mockLegalEntityDefendant as any)];

      expect(component.configureOptions(defendant)).toEqual([
        { value: 'test-legal-entity-defendant', label: 'TestNameLei' }
      ]);
    });

    it('should filter bulk defendant', () => {
      const defendant: Defendant[] = [...mockLegalEntityDefendant, ...mockBulkDefendant];
      expect(component.configureOptions(defendant as Defendant[])).toEqual([
        { value: 'test-legal-entity-defendant', label: 'TestNameLei' }
      ]);
    });

    it('should return empty array', () => {
      expect(component.configureOptions([])).toEqual([]);
    });
  });

  describe('#disableDelete', () => {
    it('should return true if there is a single counsel with empty values', () => {
      component.companyRepresentatives = [
        {
          id: '',
          title: '',
          position: '',
          firstName: '',
          lastName: '',
          defendants: [],
          attendanceDays: []
        }
      ];
      const isDisabled = component.disableDelete();
      expect(isDisabled).toBeTruthy();
    });
  });

  describe('#removeCompanyRepresentative', () => {
    it('should emit the right event', () => {
      jest.spyOn(component.onUpdateCompanyRepresentative, 'emit');
      component.removeCompanyRepresentative(1);
      expect(component.onUpdateCompanyRepresentative.emit).toHaveBeenCalledWith({
        removeIndex: 1
      });
    });
  });

  @Component({
    template: `
      <company-representatives-panel
        [companyRepresentatives]="mockCompanyRepresentatives"
        [counselsCacheOptions]="mockCounselsCacheOptions"
        [defendantsCurrentHearing]="mockDefendantsCurrentHearing"
      >
      </company-representatives-panel>
    `,
    imports: [CompanyRepresentativesPanelComponent]
  })
  class TestHostComponent {
    mockCompanyRepresentatives: CompanyRepresentative[];
    mockDefendantsCurrentHearing: any;
    mockCounselsCacheOptions: CounselsCache;

    constructor() {
      this.mockCompanyRepresentatives = mockCompanyRepresentatives as CompanyRepresentative[];
      this.mockDefendantsCurrentHearing = mockLegalEntityDefendant;
      this.mockCounselsCacheOptions = mockCounselsCache as CounselsCache;
    }
  }
});
