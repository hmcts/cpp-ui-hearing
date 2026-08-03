import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { ValidationError } from '@cpp/pdk';
import { UserDetails } from '@cpp/users-groups';
import { CheckInPayload, HearingSummariesGroupedByCaseId } from '../../../core';
import { DefenceCheckInFormComponent } from './defence-check-in-form.component';

jest.mock('uuid/v4', () => () => 'id');

jest.mock('../../../core', () => ({
  ...(jest.requireActual('../../../core') as any),
  getCPPDate: jest.fn(() => ({
    getCurrentDate: () => new Date('2024-01-15T10:00:00.000Z'),
    format: (date: Date, format: string) => '2024-01-15',
    US_DATE_FORMAT: 'YYYY-MM-DD'
  }))
}));

const MOCK_DATE_TIME = new Date('2024-01-15T10:00:00.000Z').getTime();
global.Date.now = jest.fn(() => MOCK_DATE_TIME);

@Component({
  selector: 'test-defence-check-in-component',
  template: `
    <defence-check-in-form
      appUrl="http://appUrl"
      [loggedInUser]="user"
      [hearingSummariesGroupedByCaseId]="hearingSummaries"
      (onAddCheckinErrors)="addCheckinErrors($event)"
      (onCheckInHearing)="onCheckInHearing($event)"
    >
    </defence-check-in-form>
  `,
  imports: [DefenceCheckInFormComponent]
})
class TestDefenceCheckInComponent {
  user = {
    userId: 'fba5554d-13db-4658-8d3c-a3fdfc1fb9d9',
    firstName: 'Mark',
    lastName: 'Brown',
    email: 'mark.brown@brownsolicitors.co.uk'
  } as UserDetails;

  hearingSummaries = [
    {
      courtroomName: 'Courtroom 04',
      cases: [
        {
          caseReference: 'TFL9171265',
          caseId: '7f56aa3f-9533-4759-ae9e-8f13c7375d35',
          hearingId: 'b3351a71-386b-4649-aaa4-e6e204a3c6b7',
          defendants: [
            {
              hearingId: 'b3351a71-386b-4649-aaa4-e6e204a3c6b7',
              name: 'Fred SMITH',
              id: '93f4bc3a-9dd2-429f-b1e0-6070cd1974fd'
            }
          ],
          courtroomName: 'Courtroom 04'
        }
      ]
    },
    {
      courtroomName: 'Courtroom 05',
      cases: [
        {
          caseReference: '40GD2744720',
          caseId: '0305e414-bbfb-4785-8962-f8d5fbe06528',
          hearingId: 'e229c90a-8e1f-45f2-93b1-f66e6062ff93',
          defendants: [
            {
              hearingId: 'e229c90a-8e1f-45f2-93b1-f66e6062ff93',
              name: 'Jackie Keaton CONN',
              id: '7ea12a20-f998-447a-98e2-bda7031b6c5c'
            },
            {
              hearingId: 'e229c90a-8e1f-45f2-93b1-f66e6062ff93',
              name: 'Sean Kamryn HINTZ',
              id: '0338e354-f7af-4534-8026-fee38d937ef3'
            }
          ],
          courtroomName: 'Courtroom 05'
        },
        {
          caseReference: 'TFL0370072',
          caseId: '5abcb7dd-a7c8-4562-b5b8-0172797e517d',
          hearingId: '4bd513ae-10b0-4f27-923e-00c898f93318',
          defendants: [
            {
              hearingId: '4bd513ae-10b0-4f27-923e-00c898f93318',
              name: 'Fred SMITH',
              id: 'bcfbb10d-5ee9-44ee-9c10-ab13403c6834'
            }
          ],
          courtroomName: 'Courtroom 05'
        }
      ]
    }
  ] as HearingSummariesGroupedByCaseId[];

  addCheckinErrors: jest.MockedFunction<(values: ValidationError[]) => void> = jest.fn();
  onCheckInHearing: jest.MockedFunction<(values: CheckInPayload) => void> = jest.fn();
}

describe('DefenceCheckInFormComponent', () => {
  let fixture: ComponentFixture<TestDefenceCheckInComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestDefenceCheckInComponent],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestDefenceCheckInComponent);
    fixture.detectChanges();
  });

  it('should render the component', async () => {
    fixture.detectChanges();

    await fixture.whenStable();
    expect(fixture).toMatchSnapshot();
  });

  it('it should submit the cases', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('a[alt="Select all hearings"]')).nativeElement.click();

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.onCheckInHearing.mock.calls).toMatchSnapshot();
  });

  it('it should submit the defendants', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('a[alt="Select all defendants"]')).nativeElement.click();

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.onCheckInHearing.mock.calls).toMatchSnapshot();
  });

  it('should show error when no hearings are selected', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('button[type="submit"]')).nativeElement.click();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.addCheckinErrors).toHaveBeenCalled();
    const errorCall = fixture.componentInstance.addCheckinErrors.mock.calls[0][0];
    expect(errorCall).toEqual([
      {
        id: 'defence-check-in-form',
        message: expect.any(String)
      }
    ]);
  });

  it('should return form value through getFormValue', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.debugElement.query(
      By.directive(DefenceCheckInFormComponent)
    ).componentInstance;

    const formValue = component.getFormValue();
    expect(formValue).toBeDefined();
  });

  it('should skip disabled defendants when selecting all defendants', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('a[alt="Select all hearings"]')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.debugElement.query(By.css('a[alt="Select all defendants"]')).nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      fixture.debugElement.query(By.directive(DefenceCheckInFormComponent)).componentInstance.form
    ).toBeDefined();
  });

  describe('Component methods', () => {
    let component: DefenceCheckInFormComponent;

    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      component = fixture.debugElement.query(
        By.directive(DefenceCheckInFormComponent)
      ).componentInstance;
    });

    it('should extract defendants correctly', () => {
      const courtroomName = 'Courtroom 04';
      component.selectDefendants(courtroomName, true);

      const result = component.extractDefendants();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        expect(result[0]).toEqual(
          expect.objectContaining({
            hearingId: expect.any(String),
            defendants: expect.any(Array)
          })
        );
        expect(result[0].defendants.length).toBeGreaterThan(0);
        expect(typeof result[0].defendants[0]).toBe('string');
      }
    });

    it('should extract cases correctly', () => {
      const courtroomName = 'Courtroom 04';
      component.selectCases(courtroomName, true);

      const result = component.extractCases();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        expect(result[0]).toEqual(
          expect.objectContaining({
            prosecutionCases: expect.any(Array),
            hearingId: expect.any(String)
          })
        );
        expect(result[0].prosecutionCases.length).toBeGreaterThan(0);
        expect(typeof result[0].prosecutionCases[0]).toBe('string');
      }
    });

    it('should create defence payload when submitting defendants', () => {
      const emitSpy = jest.spyOn(component.onCheckInHearing, 'emit');

      const courtroomName = 'Courtroom 04';
      component.selectDefendants(courtroomName, true);

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalled();
      const emittedValue = emitSpy.mock.calls[0][0] as CheckInPayload;

      expect(emittedValue.defence).toBeDefined();
      expect(emittedValue.defence.length).toBeGreaterThan(0);
      expect(emittedValue.defence[0]).toEqual(
        expect.objectContaining({
          hearingId: expect.any(String),
          defenceCounsel: expect.objectContaining({
            id: 'id',
            firstName: 'Mark',
            middleName: '',
            lastName: 'Brown',
            title: '',
            status: 'Defence',
            defendants: expect.any(Array),
            attendanceDays: expect.any(Array)
          })
        })
      );
    });

    it('should create prosecution payload when submitting cases', () => {
      const emitSpy = jest.spyOn(component.onCheckInHearing, 'emit');

      const courtroomName = 'Courtroom 04';
      component.selectCases(courtroomName, true);

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalled();
      const emittedValue = emitSpy.mock.calls[0][0] as CheckInPayload;

      expect(emittedValue.prosecution).toBeDefined();
      expect(emittedValue.prosecution.length).toBeGreaterThan(0);
      expect(emittedValue.prosecution[0]).toEqual(
        expect.objectContaining({
          hearingId: expect.any(String),
          prosecutionCounsel: expect.objectContaining({
            id: 'id',
            firstName: 'Mark',
            middleName: '',
            lastName: 'Brown',
            title: '',
            prosecutionCases: expect.any(Array),
            status: 'Prosecution',
            attendanceDays: expect.any(Array)
          })
        })
      );
    });

    it('should create both defence and prosecution payloads when both are selected', () => {
      const emitSpy = jest.spyOn(component.onCheckInHearing, 'emit');

      const courtroom04 = 'Courtroom 04';
      component.selectDefendants(courtroom04, true);

      const courtroom05 = 'Courtroom 05';
      component.selectCases(courtroom05, true);

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalled();
      const emittedValue = emitSpy.mock.calls[0][0] as CheckInPayload;

      expect(emittedValue.defence).toBeDefined();
      expect(emittedValue.prosecution).toBeDefined();

      expect(emittedValue.defence.length).toBeGreaterThan(0);
      expect(emittedValue.defence[0].defenceCounsel).toBeDefined();
      expect(emittedValue.defence[0].defenceCounsel.status).toBe('Defence');

      expect(emittedValue.prosecution.length).toBeGreaterThan(0);
      expect(emittedValue.prosecution[0].prosecutionCounsel).toBeDefined();
      expect(emittedValue.prosecution[0].prosecutionCounsel.status).toBe('Prosecution');
    });

    it('should select cases when shouldSelect is true', () => {
      fixture.componentInstance.hearingSummaries = [
        {
          courtroomName: 'Courtroom 04',
          cases: [
            {
              caseId: 'case-1',
              caseReference: 'ref1',
              defendants: [],
              hearingId: 'hearing-1',
              courtroomName: 'Courtroom 04'
            },
            {
              caseId: 'case-2',
              caseReference: 'ref2',
              defendants: [],
              hearingId: 'hearing-2',
              courtroomName: 'Courtroom 04'
            }
          ]
        },
        {
          courtroomName: 'Courtroom 05',
          cases: []
        }
      ] as HearingSummariesGroupedByCaseId[];
      fixture.detectChanges();

      component.selectCases('Courtroom 04', true);

      expect(component.form.value['selectedCases_Courtroom 04']).toEqual(['case-1', 'case-2']);
    });

    it('should deselect cases when shouldSelect is false', () => {
      fixture.componentInstance.hearingSummaries = [
        {
          courtroomName: 'Courtroom 04',
          cases: [
            {
              caseId: 'case-1',
              caseReference: 'ref1',
              defendants: [],
              hearingId: 'hearing-1',
              courtroomName: 'Courtroom 04'
            },
            {
              caseId: 'case-2',
              caseReference: 'ref2',
              defendants: [],
              hearingId: 'hearing-2',
              courtroomName: 'Courtroom 04'
            }
          ]
        },
        {
          courtroomName: 'Courtroom 05',
          cases: []
        }
      ] as HearingSummariesGroupedByCaseId[];
      fixture.detectChanges();

      // First select the cases
      component.selectCases('Courtroom 04', true);
      // Then deselect them
      component.selectCases('Courtroom 04', false);

      expect(component.form.value['selectedCases_Courtroom 04']).toEqual([]);
    });

    it('should select defendants when shouldSelect is true', () => {
      const caseId = '7f56aa3f-9533-4759-ae9e-8f13c7375d35';
      const courtroomName = 'Courtroom 04';

      component.selectDefendants(courtroomName, true);

      const selectedDefendants = component.form.value[`selectedDefendants_${caseId}`];
      expect(selectedDefendants).toBeDefined();
      expect(Array.isArray(selectedDefendants)).toBe(true);
    });

    it('should deselect defendants when shouldSelect is false', () => {
      const caseId = '7f56aa3f-9533-4759-ae9e-8f13c7375d35';
      const courtroomName = 'Courtroom 04';

      component.selectDefendants(courtroomName, true);
      component.selectDefendants(courtroomName, false);

      const selectedDefendants = component.form.value[`selectedDefendants_${caseId}`];
      expect(selectedDefendants).toEqual([]);
    });

    it('should filter disabled cases when selecting', () => {
      const caseId = '7f56aa3f-9533-4759-ae9e-8f13c7375d35';
      const courtroomName = 'Courtroom 04';

      component.selectDefendants(courtroomName, true);

      component.selectCases(courtroomName, true);
      const finalCasesValue = component.form.value[`selectedCases_${courtroomName}`];

      expect(finalCasesValue).toBeDefined();
      expect(finalCasesValue).not.toContain(caseId);
    });

    it('should check if all cases are selected', () => {
      fixture.componentInstance.hearingSummaries = [
        {
          courtroomName: 'Courtroom 04',
          cases: [
            {
              caseId: 'case-1',
              caseReference: 'ref1',
              defendants: [],
              hearingId: 'hearing-1',
              courtroomName: 'Courtroom 04'
            },
            {
              caseId: 'case-2',
              caseReference: 'ref2',
              defendants: [],
              hearingId: 'hearing-2',
              courtroomName: 'Courtroom 04'
            }
          ]
        },
        {
          courtroomName: 'Courtroom 05',
          cases: []
        }
      ] as HearingSummariesGroupedByCaseId[];
      fixture.detectChanges();

      component.selectCases('Courtroom 04', true);
      expect(component.hasAllCasesSelected('Courtroom 04')).toBe(true);

      const currentValue = component.form.value['selectedCases_Courtroom 04'] as string[];
      component.form.controls['selectedCases_Courtroom 04'].setValue(
        currentValue.filter(id => id !== 'case-2')
      );
      expect(component.hasAllCasesSelected('Courtroom 04')).toBe(false);
    });

    it('should check if all defendants are selected', () => {
      const caseId = '7f56aa3f-9533-4759-ae9e-8f13c7375d35';
      const courtroomName = 'Courtroom 04';

      component.selectDefendants(courtroomName, true);
      expect(component.hasAllDefendantsSelected(courtroomName)).toBe(true);

      const currentDefendants = component.form.value[`selectedDefendants_${caseId}`] as string[];
      if (currentDefendants && currentDefendants.length > 1) {
        component.form.controls[`selectedDefendants_${caseId}`].setValue([currentDefendants[0]]);
        expect(component.hasAllDefendantsSelected(courtroomName)).toBe(false);
      } else {
        component.selectDefendants(courtroomName, false);
        expect(component.hasAllDefendantsSelected(courtroomName)).toBe(false);
      }
    });

    it('should identify disabled cases', () => {
      Object.defineProperty(component.form, 'value', {
        get: jest.fn(() => ({ 'selectedDefendants_case-1': ['def-1'] as string[] })),
        configurable: true
      });
      expect(component.shouldDisableCase('case-1')).toBe(true);

      Object.defineProperty(component.form, 'value', {
        get: jest.fn(() => ({ 'selectedDefendants_case-1': [] as string[] })),
        configurable: true
      });
      expect(component.shouldDisableCase('case-1')).toBe(false);
    });

    it('should identify disabled defendants', () => {
      Object.defineProperty(component.form, 'value', {
        get: jest.fn(() => ({ 'selectedCases_Courtroom 04': ['case-1'] as string[] })),
        configurable: true
      });
      expect(component.shouldDisableDefendant('Courtroom 04', 'case-1')).toBe(true);

      Object.defineProperty(component.form, 'value', {
        get: jest.fn(() => ({ 'selectedCases_Courtroom 04': [] as string[] })),
        configurable: true
      });
      expect(component.shouldDisableDefendant('Courtroom 04', 'case-1')).toBe(false);
    });
  });
});
