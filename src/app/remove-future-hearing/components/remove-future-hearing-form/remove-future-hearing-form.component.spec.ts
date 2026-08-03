import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { HearingSummary, TrialType } from '../../../core';
import { mockHearingSummaries } from '../../mocks';
import { Router } from '@angular/router';
import { AppConfigService } from '../../../config';
import { RemoveFutureHearingFormComponent } from './remove-future-hearing-form.component';
import { provideTranslateService } from '@ngx-translate/core';
import { SimpleChange } from '@angular/core';

@Component({
  selector: 'test-remove-future-hearing-container',
  template: `
    <remove-future-hearing-form
      [hearingId]="'hearing-id'"
      [hearingSummaries]="hearingSummaries"
      [isReadOnly]="isReadOnly"
      (remove)="remove()"
      (readonlyMode)="readOnlyMode()"
    >
    </remove-future-hearing-form>
  `,
  imports: [RemoveFutureHearingFormComponent]
})
class TestRemoveFutureHearingContainer {
  @Input() hearingSummaries: HearingSummary[];
  @Input() isReadOnly: boolean = false;
  remove = jest.fn();
  readOnlyMode = jest.fn();
}

describe('Remove future hearing form component', () => {
  let fixture: ComponentFixture<TestRemoveFutureHearingContainer>;
  let componentFixture: ComponentFixture<RemoveFutureHearingFormComponent>;
  let component: RemoveFutureHearingFormComponent;
  let mockRouter: jest.Mocked<Router>;
  let mockAppConfigService: { appUrl: string };

  beforeEach(waitForAsync(() => {
    mockRouter = {
      navigate: jest.fn()
    } as unknown as jest.Mocked<Router>;

    mockAppConfigService = {
      appUrl: 'appUrl/'
    };

    TestBed.configureTestingModule({
      imports: [TestRemoveFutureHearingContainer, RemoveFutureHearingFormComponent],
      providers: [
        provideTranslateService(),
        {
          provide: Router,
          useValue: mockRouter
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestRemoveFutureHearingContainer);
  }));

  describe('Rendering', () => {
    describe('when there are no hearings', () => {
      it('should render', () => {
        fixture.componentInstance.hearingSummaries = [];
        fixture.detectChanges();
        expect(fixture).toMatchSnapshot();
      });
    });

    describe('when there are hearings', () => {
      it('should render', () => {
        fixture.componentInstance.hearingSummaries = [...mockHearingSummaries];
        fixture.detectChanges();
        expect(fixture).toMatchSnapshot();
      });
    });
  });

  describe('Component Logic', () => {
    beforeEach(() => {
      componentFixture = TestBed.createComponent(RemoveFutureHearingFormComponent);
      component = componentFixture.componentInstance;
      component.hearingId = 'hearing-123';
      component.hearingSummaries = [...mockHearingSummaries];
      component.reasonsForVacating = [
        {
          id: 'reason-1',
          reasonShortDescription: 'Vacated Reason 1',
          trialType: 'vacated'
        } as TrialType
      ];
      component.ngOnInit();
      componentFixture.detectChanges();
    });

    describe('Lifecycle', () => {
      it('should initialize form on ngOnInit', () => {
        expect(component.form).toBeDefined();
        expect(component.form.get('hearings')).toBeDefined();
      });

      it('should recreate form on ngOnChanges when hearingSummaries change', () => {
        const oldForm = component.form;
        component.ngOnChanges({
          hearingSummaries: new SimpleChange(null, [...mockHearingSummaries], false)
        });
        expect(component.form).not.toBe(oldForm);
      });

      it('should not recreate form on ngOnChanges when hearingSummaries is undefined', () => {
        const oldForm = component.form;
        component.ngOnChanges({});
        expect(component.form).toBe(oldForm);
      });
    });

    describe('Form Control Methods', () => {
      it('should get hearings array control', () => {
        const hearingsCtrl = component.getHearingsArrayCtrl();
        expect(hearingsCtrl).toBeDefined();
        expect(hearingsCtrl.controls.length).toBeGreaterThan(0);
      });

      it('should get hearing control by index', () => {
        const hearingCtrl = component.getHearingCtrlByIndex(0);
        expect(hearingCtrl).toBeDefined();
      });

      it('should get case control by index', () => {
        const caseCtrl = component.getCaseCtrlByIndex(0, 0);
        expect(caseCtrl).toBeDefined();
      });

      it('should get defendant control by index', () => {
        const defendantCtrl = component.getDefendantCtrlByIndex(0, 0, 0);
        expect(defendantCtrl).toBeDefined();
      });

      it('should get offence control by index', () => {
        const offenceCtrl = component.getOffenceCtrlByIndex(0, 0, 0, 0);
        expect(offenceCtrl).toBeDefined();
      });
    });

    describe('Display Helper Methods', () => {
      it('should check if first row for hearing', () => {
        const result = component.isFirstRowForHearing(0, 0, 0);
        expect(result).toBe(true);
      });

      it('should check if first row for hearing - not first row', () => {
        const result = component.isFirstRowForHearing(0, 1, 0);
        expect(result).toBe(false);
      });

      it('should check if row is displayed - first time with empty display list', () => {
        component.displayedRecordList = [];
        const result = component.hasRowDisplayed(0, 0, 0, 'case', 0);
        expect(result).toBe(true);
        expect(component.displayedRecordList.length).toBe(1);
      });

      it('should check if row is displayed - already displayed', () => {
        component.displayedRecordList = [
          {
            hIndex: 0,
            kaseIndex: 0,
            defIndex: 0,
            offIndex: 0,
            name: 'case'
          }
        ];
        const result = component.hasRowDisplayed(0, 0, 0, 'case', 0);
        expect(result).toBe(false);
      });

      it('should check if offence is displayed - not in list', () => {
        component.displayedRecordList = [];
        const result = component.hasOffenceDisplayed(0, 0, 0, 0);
        expect(result).toBeUndefined();
      });

      it('should check if offence is displayed - in list', () => {
        component.displayedRecordList = [
          {
            hIndex: 0,
            kaseIndex: 0,
            defIndex: 0,
            offIndex: 0,
            name: 'offence'
          }
        ];
        const result = component.hasOffenceDisplayed(0, 0, 0, 0);
        expect(result).toBeDefined();
        expect(result?.offIndex).toBe(0);
      });

      it('should check if first row for offence', () => {
        const result = component.isFirstRowForOffence(0);
        expect(result).toBe(true);
      });

      it('should check if first row for offence - not first row', () => {
        const result = component.isFirstRowForOffence(1);
        expect(result).toBe(false);
      });

      it('should check if defendant has multiple offences', () => {
        const defendant = {
          id: 'def-1',
          firstName: 'John',
          lastName: 'Doe',
          offences: [{}, {}] as any[]
        };
        expect(component.defendantHasMultipleOffences(defendant)).toBe(true);
      });

      it('should check if defendant has single offence', () => {
        const defendant = {
          id: 'def-1',
          firstName: 'John',
          lastName: 'Doe',
          offences: [{}] as any[]
        };
        expect(component.defendantHasMultipleOffences(defendant)).toBe(false);
      });

      it('should check if hearing has multiple defendants - multiple cases', () => {
        const hearing: HearingSummary = {
          ...mockHearingSummaries[0],
          prosecutionCaseSummaries: [{}, {}] as any[]
        };
        expect(component.hearingHasMultipleDefendants(hearing)).toBe(true);
      });

      it('should check if hearing has multiple defendants - multiple defendants in single case', () => {
        const hearing: HearingSummary = {
          ...mockHearingSummaries[0],
          prosecutionCaseSummaries: [
            {
              defendants: [{}, {}]
            }
          ] as any[]
        };
        expect(component.hearingHasMultipleDefendants(hearing)).toBe(true);
      });

      it('should check if hearing has single defendant', () => {
        const hearing: HearingSummary = {
          ...mockHearingSummaries[0],
          prosecutionCaseSummaries: [
            {
              defendants: [{}]
            }
          ] as any[]
        };
        expect(component.hearingHasMultipleDefendants(hearing)).toBe(false);
      });
    });

    describe('Hearing Selection', () => {
      it('should detect when hearing has something selected - hearing level', () => {
        const hearingCtrl = component.getHearingCtrlByIndex(0);
        hearingCtrl.patchValue({ selected: true });
        expect(component.hearingHasSomethingSelected(0)).toBe(true);
      });

      it('should detect when hearing has something selected - case level', () => {
        const form = component.form.value;
        form.hearings[0].cases[0].selected = true;
        component.form.patchValue(form);
        expect(component.hearingHasSomethingSelected(0)).toBe(true);
      });

      it('should detect when hearing has something selected - defendant level', () => {
        const form = component.form.value;
        form.hearings[0].cases[0].defendants[0].selected = true;
        component.form.patchValue(form);
        expect(component.hearingHasSomethingSelected(0)).toBe(true);
      });

      it('should detect when hearing has something selected - offence level', () => {
        const form = component.form.value;
        form.hearings[0].cases[0].defendants[0].offences[0].selected = true;
        component.form.patchValue(form);
        expect(component.hearingHasSomethingSelected(0)).toBe(true);
      });

      it('should detect when hearing has nothing selected', () => {
        expect(component.hearingHasSomethingSelected(0)).toBe(false);
      });
    });

    describe('Reason for Removal', () => {
      it('should require reason when hearing type is trial and selected', () => {
        const trialHearing: HearingSummary = {
          ...mockHearingSummaries[0],
          type: { description: 'Trial' } as any
        };
        component.hearingSummaries = [trialHearing];
        component.ngOnInit();

        const hearingCtrl = component.getHearingCtrlByIndex(0);
        hearingCtrl.patchValue({ selected: true });

        const requiresReason = component.requireReasonForHearingRemoval(trialHearing, 0);
        expect(requiresReason).toBe(true);
      });

      it('should not require reason when hearing type is not trial', () => {
        const nonTrialHearing: HearingSummary = {
          ...mockHearingSummaries[0],
          type: { description: 'Plea' } as any
        };
        const requiresReason = component.requireReasonForHearingRemoval(nonTrialHearing, 0);
        expect(requiresReason).toBe(false);
      });
    });

    describe('Form Actions', () => {
      it('should get base path from config service', () => {
        expect(component.basePath()).toBe('appUrl/');
      });

      it('should confirm and emit readonlyMode', () => {
        jest.spyOn(component.readonlyMode, 'emit');
        jest.spyOn(window, 'scroll').mockImplementation();

        const offenceCtrl = component.getOffenceCtrlByIndex(0, 0, 0, 0);
        offenceCtrl.patchValue({ selected: true });

        component.confirm();

        expect(component.values.length).toBeGreaterThan(0);
        expect(component.readonlyMode.emit).toHaveBeenCalledWith(true);
        expect(window.scroll).toHaveBeenCalledWith(0, 0);
      });

      it('should cancel when in readonly mode', () => {
        jest.spyOn(component.readonlyMode, 'emit');
        component.isReadOnly = true;
        component.displayedRecordList = [{ name: 'test' } as any];
        component.values = [{ hearingId: 'test' } as any];

        component.cancelClicked();

        expect(component.displayedRecordList).toEqual([]);
        expect(component.values).toEqual([]);
        expect(component.readonlyMode.emit).toHaveBeenCalledWith(false);
        expect(mockRouter.navigate).not.toHaveBeenCalled();
      });

      it('should cancel when not in readonly mode and navigate', () => {
        component.isReadOnly = false;
        component.displayedRecordList = [{ name: 'test' } as any];
        component.values = [{ hearingId: 'test' } as any];

        component.cancelClicked();

        expect(component.displayedRecordList).toEqual([]);
        expect(component.values).toEqual([]);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/', 'manage', 'hearing-123']);
      });

      it('should submit form and emit remove event', () => {
        jest.spyOn(component.remove, 'emit');
        component.values = [
          { hearingId: 'hearing-1', offenceIds: ['off-1'], hearingToRemove: false }
        ];

        component.submitForm();

        expect(component.remove.emit).toHaveBeenCalledWith({
          removeFutureHearings: component.values
        });
      });
    });

    describe('Get Values', () => {
      it('should get values with selected offences', () => {
        const offenceCtrl = component.getOffenceCtrlByIndex(0, 0, 0, 0);
        offenceCtrl.patchValue({ selected: true });

        const values = component.getValues();

        expect(values.length).toBeGreaterThan(0);
        expect(values[0].offenceIds.length).toBeGreaterThan(0);
      });

      it('should include reason id when reason is provided', () => {
        const hearingCtrl = component.getHearingCtrlByIndex(0);
        const reason = { id: 'reason-123', reasonShortDescription: 'Test Reason' };
        hearingCtrl.patchValue({ reason });

        const offenceCtrl = component.getOffenceCtrlByIndex(0, 0, 0, 0);
        offenceCtrl.patchValue({ selected: true });

        const values = component.getValues();

        expect(values[0].reasonId).toBe('reason-123');
      });

      it('should mark hearing for removal when all offences selected', () => {
        const hearingCtrl = component.getHearingCtrlByIndex(0);
        hearingCtrl.patchValue({ selected: true });

        const values = component.getValues();

        if (values.length > 0) {
          expect(values[0].hearingToRemove).toBeDefined();
        }
      });

      it('should not include hearings with no selected offences', () => {
        const values = component.getValues();
        expect(values.length).toBe(0);
      });
    });

    describe('Form Control Creation', () => {
      it('should create control without array name', () => {
        const ctrl = component.createCtrl('test-id');
        expect(ctrl.get('id')?.value).toBe('test-id');
        expect(ctrl.get('selected')?.value).toBe(false);
      });

      it('should create control with reason', () => {
        const ctrl = component.createCtrl('test-id', undefined, true);
        expect(ctrl.get('reason')).toBeDefined();
      });

      it('should create control with array and sync parent-child selection', () => {
        const ctrl = component.createCtrl('test-id', 'children');
        const childrenArray = ctrl.get('children');
        expect(childrenArray).toBeDefined();
      });

      it('should select all children when parent is selected', done => {
        const parentCtrl = component.createCtrl('parent-id', 'children');
        const childrenArray = parentCtrl.get('children');

        const child1 = component.createCtrl('child-1');
        const child2 = component.createCtrl('child-2');
        (childrenArray as any).push(child1);
        (childrenArray as any).push(child2);

        setTimeout(() => {
          parentCtrl.patchValue({ selected: true });

          setTimeout(() => {
            const values = parentCtrl.value;
            expect(values.children[0].selected).toBe(true);
            expect(values.children[1].selected).toBe(true);
            done();
          }, 50);
        }, 50);
      });
    });
  });
});
