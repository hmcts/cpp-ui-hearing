import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { DefenceCounselsPanelComponent } from './defence-counsels-panel.component';
import {
  mockDefendants,
  mockDefenceCounsels,
  mockCounselsCache,
  mockBulkDefendant
} from '../../../mock-data/test-mock-data';
import { CounselsCache, DefenceCounsel, Defendant } from '../../../core';
import { By } from '@angular/platform-browser';

describe('DefenceCounselsPanelComponent', () => {
  let component: DefenceCounselsPanelComponent;
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
    component = fixture.debugElement.query(
      By.directive(DefenceCounselsPanelComponent)
    ).componentInstance;

    component.defenceCounsels = mockDefenceCounsels as DefenceCounsel[];
    component.defendantsCurrentHearing = mockDefendants as Defendant[];
    component.counselsCacheOptions = mockCounselsCache as CounselsCache;
    fixture.detectChanges();

    // pdk-autosuggest input element uses a randomly generated name attribute.
    // Need to make this a fixed name so Jest tests pass between test runs.
    const judgesTypeaheadEl = fixture.debugElement.queryAll(By.css('pdk-autosuggest input'));
    judgesTypeaheadEl.forEach(element => (element.nativeElement.name = 'stubbed-name'));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('#configureOptions', () => {
    it('should return expected', () => {
      const defendant: Defendant[] = [...mockDefendants];

      expect(component.configureOptions(defendant)).toEqual([
        { value: 'test-defendant', label: 'Victoria Dale' }
      ]);
    });

    it('should filter bulk defendant', () => {
      const defendant: Defendant[] = [...mockDefendants, ...mockBulkDefendant];
      expect(component.configureOptions(defendant as Defendant[])).toEqual([
        { value: 'test-defendant', label: 'Victoria Dale' }
      ]);
    });

    it('should return empty array', () => {
      expect(component.configureOptions([])).toEqual([]);
    });
  });

  describe('#disableDelete', () => {
    it('should return true if there is a single counsel with empty values', () => {
      component.defenceCounsels = [
        {
          id: '',
          title: '',
          middleName: '',
          status: '',
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

  describe('#removeDefenceCounsel', () => {
    it('should emit the right event', () => {
      jest.spyOn(component.onUpdateDefenceCounsel, 'emit');
      component.removeDefenceCounsel(1);
      expect(component.onUpdateDefenceCounsel.emit).toHaveBeenCalledWith({
        removeIndex: 1
      });
    });
  });

  @Component({
    template: `
      <defence-counsels-panel
        [defenceCounsels]="mockDefenceCounsels"
        [counselsCacheOptions]="mockCounselsCacheOptions"
        [defendantsCurrentHearing]="mockDefendantsCurrentHearing"
      >
      </defence-counsels-panel>
    `,
    imports: [DefenceCounselsPanelComponent]
  })
  class TestHostComponent {
    mockDefenceCounsels: DefenceCounsel[];
    mockDefendantsCurrentHearing: any;
    mockCounselsCacheOptions: CounselsCache;

    constructor() {
      this.mockDefenceCounsels = mockDefenceCounsels as DefenceCounsel[];
      this.mockDefendantsCurrentHearing = mockDefendants;
      this.mockCounselsCacheOptions = mockCounselsCache as CounselsCache;
    }
  }
});
