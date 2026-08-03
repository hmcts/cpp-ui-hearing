import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  CourtApplication,
  ApplicationAggregate,
  HearingDetail,
  TodaysDefendantAttendance,
  VerdictType
} from '../../core';
import { ValidationError } from '@cpp/pdk';
import { ApplicationResultDetailsContainer } from './application-result-details.container';
import { ApplicationResultDetailsComponent } from './application-result-details.component';
import { JsonPipe } from '@angular/common';

const fakeCourtApplications = [
  {
    applicationReceivedDate: '2021-01-05',
    applicationReference: 'SHRUQK2SME',
    applicationStatus: 'LISTED',
    id: '7db9bc70-41b5-4586-aa48-ad0894473fd9'
  } as CourtApplication
];

describe('Applications result details container', () => {
  let fixture: ComponentFixture<ApplicationResultDetailsContainer>;

  let component: ApplicationResultDetailsContainer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApplicationResultDetailsContainer],
      providers: [
        provideRouter([]),
        MockStore,
        provideMockStore({
          initialState: {}
        })
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(ApplicationResultDetailsContainer, {
        remove: { imports: [ApplicationResultDetailsComponent] },
        add: { imports: [MockApplicationResultDetailsComponent] }
      })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationResultDetailsContainer);
    component = fixture.componentInstance;
  });

  it('should have the expected template', () => {
    component.applicationResults = fakeCourtApplications;
    component.hearingType = 'MAGISTRATES';
    component.showSubject = false;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  @Component({
    selector: 'application-result-details',
    template: `
      <div>Mock Application Result Details</div>
      <div>hearing: {{ hearing | json }}</div>
      <div>hearingId: {{ hearingId }}</div>
      <div>courtApplications: {{ courtApplications | json }}</div>
      <div>applicationResults: {{ applicationResults | json }}</div>
      <div>isGroupCaseApplicationText: {{ isGroupCaseApplicationText }}</div>
      <div>showSubject: {{ showSubject }}</div>
      <div>pleasMapping: {{ pleasMapping | json }}</div>
      <div>guiltyPleasValues: {{ guiltyPleasValues | json }}</div>
      <div>verdictTypes: {{ verdictTypes | json }}</div>
      <div>attendanceErrors: {{ attendanceErrors | json }}</div>
      <div>caseStatus: {{ caseStatus }}</div>
      <div>isPleaApplicableFlag: {{ isPleaApplicableFlag }}</div>
      <div>isVerdictsPageAvailable: {{ isVerdictsPageAvailable }}</div>
      <div>todayDefendantsAttendance: {{ todayDefendantsAttendance | json }}</div>
      <div>selectedHearingDate: {{ selectedHearingDate }}</div>
      <div>amendApplicationPermission: {{ amendApplicationPermission }}</div>
      <div>applicationCaseStatus: {{ applicationCaseStatus }}</div>
    `,
    imports: [JsonPipe]
  })
  class MockApplicationResultDetailsComponent {
    @Input() hearing: HearingDetail;
    @Input() hearingId: string;
    @Input() courtApplications: ApplicationAggregate[];
    @Input() applicationResults: CourtApplication[];
    @Input() isGroupCaseApplicationText: string;
    @Input() showSubject: boolean;
    @Input() pleasMapping: { [key: string]: string };
    @Input() guiltyPleasValues: string[];
    @Input() verdictTypes: VerdictType[];
    @Input() attendanceErrors?: ValidationError[] | null;
    @Input() caseStatus: string;
    @Input() isPleaApplicableFlag: boolean;
    @Input() isVerdictsPageAvailable: boolean;
    @Input() todayDefendantsAttendance: TodaysDefendantAttendance[];
    @Input() selectedHearingDate: string;
    @Input() amendApplicationPermission: boolean;
    @Input() applicationCaseStatus: string;
    @Output() onGoToEnterResult = new EventEmitter<void>();
    @Output() onOutstandingFine = new EventEmitter<any>();
    @Output() onYouthCourtToggle = new EventEmitter<string>();
    @Output() onPresenceChanged = new EventEmitter<any>();
    @Output() onSelectedParticipant = new EventEmitter<string>();
  }
});
