import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { OrganisationUnit } from '@cpp/reference-data';
import { CheckInComponent } from './check-in.component';
import { ValidationError } from '@cpp/pdk';
import { CheckInAsProsecutor } from '../../../core';

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

describe('CheckInComponent', () => {
  let component: CheckInComponent;
  let fixture: ComponentFixture<CheckInComponent>;

  const mockInitialState = {
    referenceData: {
      organisationUnits: [] as OrganisationUnit[]
    }
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [CheckInComponent],
      providers: [provideTranslateService(), provideMockStore({ initialState: mockInitialState })],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckInComponent);
    component = fixture.componentInstance;
    component.userGroups = [];
    component.hearingSummariesGroupedByCaseId = [];
    fixture.detectChanges();
  });

  it('should match the snapshot', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('isDefenceUser', () => {
    it('should return true when user is in defence users group', () => {
      component.userGroups = [
        {
          groupId: 'group-1',
          groupName: 'Defence Users',
          description: 'Defence users group'
        }
      ];
      expect(component.isDefenceUser()).toBe(true);
    });

    it('should return true when user is in advocates group', () => {
      component.userGroups = [
        {
          groupId: 'group-2',
          groupName: 'Advocates',
          description: 'Advocates group'
        }
      ];
      expect(component.isDefenceUser()).toBe(true);
    });

    it('should return false when user is not in defence or advocates group', () => {
      component.userGroups = [
        {
          groupId: 'group-3',
          groupName: 'Prosecution',
          description: 'Prosecution group'
        }
      ];
      expect(component.isDefenceUser()).toBe(false);
    });

    it('should return false when userGroups is empty', () => {
      component.userGroups = [];
      expect(component.isDefenceUser()).toBe(false);
    });
  });

  describe('addCheckinErrors', () => {
    it('should emit errors through onAddCheckinErrors', () => {
      const mockErrors: ValidationError[] = [{ id: 'error-1', message: 'Error 1' }];
      const emitSpy = jest.spyOn(component.onAddCheckinErrors, 'emit');

      component.addCheckinErrors(mockErrors);

      expect(emitSpy).toHaveBeenCalledWith(mockErrors);
    });
  });

  describe('checkInProsecution', () => {
    it('should emit prosecution check-in payload through onCheckInProsecution', () => {
      const mockPayload: CheckInAsProsecutor[] = [
        {
          hearingId: 'hearing-1',
          prosecutionCases: []
        } as CheckInAsProsecutor
      ];
      const emitSpy = jest.spyOn(component.onCheckInProsecution, 'emit');

      component.checkInProsecution(mockPayload);

      expect(emitSpy).toHaveBeenCalledWith(mockPayload);
    });
  });
});
