import { ComponentFixture, ComponentFixtureAutoDetect, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component } from '@angular/core';
import { IntermediaryCounselsPanelComponent } from './intermediary-counsels-panel.component';
import {
  mockDefendants,
  mockIntermediaryCounsels,
  mockCounselsCache,
  mockBulkDefendant
} from '../../../mock-data/test-mock-data';
import { CounselsCache, IntermediaryCounsel, Defendant } from '../../../core';
import { By } from '@angular/platform-browser';

describe('IntermediaryCounselsPanelComponent', () => {
  let component: IntermediaryCounselsPanelComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        { provide: ComponentFixtureAutoDetect, useValue: true }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.query(
      By.directive(IntermediaryCounselsPanelComponent)
    ).componentInstance;

    component.intermediariesCounsel = mockIntermediaryCounsels as IntermediaryCounsel[];
    component.defendants = mockDefendants as Defendant[];
    component.counselsCacheOptions = mockCounselsCache as CounselsCache;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('#defendantOptions', () => {
    it('should return expected', () => {
      expect(component.defendantOptions).toEqual([
        { value: 'test-defendant', label: 'Victoria Dale' }
      ]);
    });

    it('should filter bulk defendant', () => {
      component.defendants = [...mockDefendants, ...mockBulkDefendant] as Defendant[];

      expect(component.defendantOptions).toEqual([
        { value: 'test-defendant', label: 'Victoria Dale' }
      ]);
    });
  });

  describe('#disableDelete', () => {
    it('should return true if there is a single counsel with empty values', () => {
      component.intermediariesCounsel = [
        {
          id: '',
          firstName: '',
          lastName: '',
          attendanceDays: [],
          role: null,
          attendant: {
            defendantId: '',
            name: '',
            attendantType: null
          }
        }
      ];
      const isDisabled = component.disableDelete();
      expect(isDisabled).toBeTruthy();
    });
  });

  describe('#removeDefenceCounsel', () => {
    it('should emit the right event', () => {
      jest.spyOn(component.onUpdateIntermediary, 'emit');
      component.removeCounsel(1);
      expect(component.onUpdateIntermediary.emit).toHaveBeenCalledWith({
        removeIndex: 1
      });
    });
  });

  @Component({
    template: `
      <intermediary-counsels-panel
        [intermediariesCounsel]="mockIntermediaryCounsels"
        [counselsCacheOptions]="mockCounselsCacheOptions"
        [defendants]="mockDefendantsCurrentHearing"
        [attendanceDay]="attendanceDay"
      >
      </intermediary-counsels-panel>
    `,
    imports: [IntermediaryCounselsPanelComponent]
  })
  class TestHostComponent {
    mockIntermediaryCounsels: IntermediaryCounsel[];
    mockDefendantsCurrentHearing: any;
    mockCounselsCacheOptions: CounselsCache;
    attendanceDay = '2019-05-01';

    constructor() {
      this.mockIntermediaryCounsels = mockIntermediaryCounsels as IntermediaryCounsel[];
      this.mockDefendantsCurrentHearing = mockDefendants;
      this.mockCounselsCacheOptions = mockCounselsCache as CounselsCache;
    }
  }
});
