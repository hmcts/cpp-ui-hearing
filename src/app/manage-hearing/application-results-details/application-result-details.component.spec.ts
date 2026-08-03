import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationResultDetailsComponent } from './application-result-details.component';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  ApplicationAggregate,
  CourtApplication,
  HearingDetail,
  TodaysDefendantAttendance,
  VerdictType
} from '../../core';
import { ApplicationSubjectComponent } from './application-subject.component';
import { DefendantLevelDetailComponent } from '../defendant-level-detail/defendant-level-detail.component';
import { ShareableResultsContainerComponent } from '../../results/share-results/shareable-results.container';
import { ApplicationResultsComponent } from './application-results.component';
import { ValidationError } from '@cpp/pdk';

// Mock child components
@Component({
  selector: 'application-subject',
  template: `
    <div>{{ subject | json }}</div>
    <div>{{ isGroupCaseApplicationText }}</div>
  `,
  imports: [JsonPipe]
})
class MockApplicationSubjectComponent {
  @Input() subject: any;
  @Input() isGroupCaseApplicationText: string;
}

@Component({
  selector: 'defendant-level-detail',
  template: `
    {{ hearing | json }}
    {{ hearingId | json }}
    {{ defendant | json }}
    {{ attendanceErrors }}
    {{ caseStatus }}
    {{ todayDefendantsAttendance }}
  `,
  imports: [JsonPipe]
})
class MockDefendantLevelDetailComponent {
  @Input() hearing: HearingDetail;
  @Input() hearingId: string;
  @Input() defendant: any;
  @Input() attendanceErrors: ValidationError[] | null;
  @Input() caseStatus: string;
  @Input() todayDefendantsAttendance: TodaysDefendantAttendance[];
  @Input() selectedHearingDate: string;
  @Output() onOutstandingFine = new EventEmitter<any>();
  @Output() onPresenceChanged = new EventEmitter<any>();
  @Output() onYouthCourtToggle = new EventEmitter<any>();
  @Output() selectedParticipant = new EventEmitter<any>();
}

@Component({
  selector: 'cpp-shareable-results-container',
  template: ` {{ masterDefendantId }} `
})
class MockShareableDetailsComponent {
  @Input() masterDefendantId: string;
}
@Component({
  selector: 'application-results',
  template: `
    {{ hearing | json }}
    {{ hearingType | json }}
    {{ courtApplication | json }}
    {{ pleasMapping | json }}
    {{ guiltyPleasValues | json }}
    {{ verdictTypes | json }}
    {{ isPleaApplicableFlag | json }}
    {{ isVerdictsPageAvailable | json }}
    {{ amendApplicationPermission | json }}
    {{ applicationCaseStatus | json }}
  `,
  imports: [JsonPipe]
})
class MockApplicationResultsComponent {
  @Input() hearing: HearingDetail;
  @Input() hearingType: string;
  @Input() courtApplication: CourtApplication;
  @Input() pleasMapping: { [key: string]: string };
  @Input() guiltyPleasValues: string[];
  @Input() verdictTypes: VerdictType[];
  @Input() isPleaApplicableFlag: boolean;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() applicationCaseStatus: string;
  @Output() onGoToEnterResult = new EventEmitter<void>();
}

describe('ApplicationResultDetailsComponent', () => {
  let component: ApplicationResultDetailsComponent;
  let fixture: ComponentFixture<ApplicationResultDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationResultDetailsComponent]
    })
      .overrideComponent(ApplicationResultDetailsComponent, {
        remove: {
          imports: [
            ApplicationSubjectComponent,
            DefendantLevelDetailComponent,
            ShareableResultsContainerComponent,
            ApplicationResultsComponent
          ]
        },
        add: {
          imports: [
            MockApplicationSubjectComponent,
            MockDefendantLevelDetailComponent,
            MockShareableDetailsComponent,
            MockApplicationResultsComponent
          ]
        }
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationResultDetailsComponent);
    component = fixture.componentInstance;

    // Mock inputs
    component.hearing = {} as HearingDetail;
    component.attendanceErrors = [];
    component.hearingId = 'hearing123';
    component.applicationResults = [
      { id: 'app1', applicationReference: 'APP_REF1' } as CourtApplication
    ];
    component.courtApplications = [
      {
        applications: [{ id: 'app1' } as CourtApplication],
        masterDefendant: { prosecutionCases: [], masterDefendantId: 'masterDefendantId' }
      } as ApplicationAggregate
    ];
    component.isGroupCaseApplicationText = 'Group Case';
    component.hearingType = 'Type1';
    component.showSubject = true;
    component.pleasMapping = { plea1: 'Guilty' };
    component.guiltyPleasValues = ['Guilty'];
    component.verdictTypes = [{ id: 'verdict1', description: 'Verdict 1' } as VerdictType];
    component.isPleaApplicableFlag = true;
    component.isVerdictsPageAvailable = true;
    component.todayDefendantsAttendance = [];
    component.selectedHearingDate = '2023-01-01';
    component.caseStatus = 'Active';

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct input values', () => {
    expect(component.hearingId).toBe('hearing123');
    expect(component.isGroupCaseApplicationText).toBe('Group Case');
    expect(component.hearingType).toBe('Type1');
    expect(component.showSubject).toBe(true);
    expect(component.isPleaApplicableFlag).toBe(true);
    expect(component.isVerdictsPageAvailable).toBe(true);
    expect(component.caseStatus).toBe('Active');
    expect(component.selectedHearingDate).toBe('2023-01-01');
  });

  it('should have correct application results', () => {
    expect(component.applicationResults).toEqual([
      { id: 'app1', applicationReference: 'APP_REF1' }
    ]);
  });

  it('should have correct court applications', () => {
    expect(component.courtApplications.length).toBe(1);
    expect(component.courtApplications[0].applications.length).toBe(1);
    expect(component.courtApplications[0].masterDefendant.masterDefendantId).toBe(
      'masterDefendantId'
    );
  });

  it('should emit onGoToEnterResult when triggered', () => {
    jest.spyOn(component.onGoToEnterResult, 'emit');
    component.onGoToEnterResult.emit();
    expect(component.onGoToEnterResult.emit).toHaveBeenCalled();
  });

  it('should emit onOutstandingFine when triggered', () => {
    jest.spyOn(component.onOutstandingFine, 'emit');
    const event = { defendantId: 'def1' };
    component.onOutstandingFine.emit(event);
    expect(component.onOutstandingFine.emit).toHaveBeenCalledWith(event);
  });

  it('should emit onYouthCourtToggle when triggered', () => {
    jest.spyOn(component.onYouthCourtToggle, 'emit');
    const event = 'toggleEvent';
    component.onYouthCourtToggle.emit(event);
    expect(component.onYouthCourtToggle.emit).toHaveBeenCalledWith(event);
  });

  it('should emit onPresenceChanged when triggered', () => {
    jest.spyOn(component.onPresenceChanged, 'emit');
    const event = { presence: true };
    component.onPresenceChanged.emit(event);
    expect(component.onPresenceChanged.emit).toHaveBeenCalledWith(event);
  });

  it('should emit onSelectedParticipant when triggered', () => {
    jest.spyOn(component.onSelectedParticipant, 'emit');
    const event = 'participantId';
    component.onSelectedParticipant.emit(event);
    expect(component.onSelectedParticipant.emit).toHaveBeenCalledWith(event);
  });
});
