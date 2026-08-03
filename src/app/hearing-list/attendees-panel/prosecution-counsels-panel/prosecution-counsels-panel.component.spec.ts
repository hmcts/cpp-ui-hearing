import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ProsecutionCounselsPanelComponent } from './prosecution-counsels-panel.component';
import { Component } from '@angular/core';
import {
  mockProsecutionCounsels,
  mockCounselsCache,
  mockProsecutionCasesSummary,
  mockProsecutionCasesSummaryWithBulkCase
} from '../../../mock-data/test-mock-data';
import { CounselsCache, ProsecutionCounsel } from '../../../core';
import { By } from '@angular/platform-browser';
import { ProsecutionCaseSummary } from '../../../core/model/shared/prosecution-case-summary';

describe('ProsecutionCounselsPanelComponent', () => {
  let component: ProsecutionCounselsPanelComponent;
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
    component = TestBed.createComponent(ProsecutionCounselsPanelComponent).componentInstance;

    component.prosecutionCounsels = mockProsecutionCounsels as ProsecutionCounsel[];
    component.counselsCacheOptions = mockCounselsCache as CounselsCache;
    component.prosecutionCasesSummary = mockProsecutionCasesSummary as ProsecutionCaseSummary[];

    fixture.detectChanges();

    // pdk-typeahead input element uses a randomly generated name attribute.
    // Need to make this a fixed name so Jest tests pass between test runs.
    const judgesTypeaheadEl = fixture.debugElement.queryAll(By.css('pdk-typeahead input'));
    judgesTypeaheadEl.forEach(element => (element.nativeElement.name = 'stubbed-name'));
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('#prosecutionCaseOptions', () => {
    it('should map prosecution cases to label/value pair list', () => {
      expect(component.prosecutionCaseOptions).toEqual([
        { value: 'fe90f56f-492d-4a32-8299-b7d1d5a87f21', label: '25GD5336220' },
        { value: 'dd0b5261-2952-4e5b-9191-ea1a68f805f6', label: '40GD3598020' }
      ]);
    });

    it('should filter bulk defendant', () => {
      component.prosecutionCasesSummary = [
        ...mockProsecutionCasesSummaryWithBulkCase
      ] as ProsecutionCaseSummary[];

      expect(component.prosecutionCaseOptions).toEqual([
        { value: 'fe90f56f-492d-4a32-8299-b7d1d5a87f21', label: 'Bulk Defendant' },
        { value: 'dd0b5261-2952-4e5b-9191-ea1a68f805f6', label: '40GD3598020' }
      ]);
    });
  });

  describe('#disableDelete', () => {
    it('should return true if there is a single counsel with empty values', () => {
      component.prosecutionCounsels = [
        {
          id: '',
          title: '',
          middleName: '',
          status: '',
          firstName: '',
          lastName: '',
          prosecutionCases: [],
          attendanceDays: []
        }
      ];
      const isDisabled = component.disableDelete();
      expect(isDisabled).toBeTruthy();
    });
  });

  describe('#removeProsecutionCounsel', () => {
    it('should emit the right event', () => {
      jest.spyOn(component.onUpdateProsecutionCounsel, 'emit');
      component.removeProsecutionCounsel(1);
      expect(component.onUpdateProsecutionCounsel.emit).toHaveBeenCalledWith({
        removeIndex: 1
      });
    });
  });
});

@Component({
  template: `
    <prosecution-counsels-panel
      [prosecutionCounsels]="mockProsecutionCounsels"
      [counselsCacheOptions]="mockCounselsCacheOptions"
    >
    </prosecution-counsels-panel>
  `,
  imports: [ProsecutionCounselsPanelComponent]
})
class TestHostComponent {
  mockProsecutionCounsels: ProsecutionCounsel[];
  mockCounselsCacheOptions: CounselsCache;
  constructor() {
    this.mockProsecutionCounsels = mockProsecutionCounsels as ProsecutionCounsel[];
    this.mockCounselsCacheOptions = mockCounselsCache as CounselsCache;
  }
}
