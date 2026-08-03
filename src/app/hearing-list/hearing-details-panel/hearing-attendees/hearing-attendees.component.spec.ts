import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component, Input } from '@angular/core';
import {
  hearingMock,
  mockCompanyRepresentatives,
  mockDefenceCounsels,
  mockDefendant,
  mockIntermediaryCounsels,
  mockProsecutionCounsels
} from '../../../mock-data/test-mock-data';
import { HearingAttendeesComponent } from './hearing-attendees.component';
import { AppConfigService } from '../../../config/config.service';
import { By } from '@angular/platform-browser';
import { CourtApplication, CourtApplicationParty } from '../../../core';
import { AttendeeComponent } from './attendee/attendee.component';
import { provideMockStore } from '@ngrx/store/testing';

describe('HearingAttendeesComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  let appConfigServiceSpy;

  const judiciaryWithRefDataJudicialMember = [
    {
      ...hearingMock.judiciary,
      judicialMember: {
        forenames: 'Rob',
        id: 'judicial-id-1',
        judiciaryType: 'Circuit Judge',
        personId: '37427',
        personalCode: '4923939',
        requestedName: 'HIS HONOUR JUDGE ADAZ',
        surname: 'Adaz',
        titleJudicialPrefix: 'His Honour Judge',
        titleSuffix: 'Esq'
      }
    }
  ];
  const hearingWithoutApplications = {
    ...hearingMock,
    judiciary: judiciaryWithRefDataJudicialMember,
    courtApplications: [] as CourtApplication[]
  };
  const hearingWithOnlyApplications = {
    ...hearingMock,
    judiciary: judiciaryWithRefDataJudicialMember,
    prosecutionCases: [] as CourtApplication[]
  };
  const courtApplicationWithApplicantAppellantFlagTrue = {
    ...hearingMock.courtApplications[0],
    judiciary: judiciaryWithRefDataJudicialMember,
    type: { ...hearingMock.courtApplications[0].type, applicantAppellantFlag: true }
  };
  const courtApplicationWithApplicantAppellantFlagFalse = {
    ...hearingMock.courtApplications[0],
    judiciary: judiciaryWithRefDataJudicialMember,
    type: { ...hearingMock.courtApplications[0].type, applicantAppellantFlag: false }
  };

  courtApplicationWithApplicantAppellantFlagFalse.type.applicantAppellantFlag = false;

  const hearingWithApplicantAppellantFlagTrue = {
    ...hearingMock,
    judiciary: judiciaryWithRefDataJudicialMember,
    courtApplications: [...[courtApplicationWithApplicantAppellantFlagTrue]]
  };
  const hearingWithApplicantAppellantFlagFalse = {
    ...hearingMock,
    judiciary: judiciaryWithRefDataJudicialMember,
    courtApplications: [...[courtApplicationWithApplicantAppellantFlagFalse]]
  };

  beforeEach(waitForAsync(() => {
    appConfigServiceSpy = jest.fn().mockReturnValue('http://test');

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), provideMockStore()],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(HearingAttendeesComponent, {
        remove: {
          imports: [AttendeeComponent],
          providers: [AppConfigService]
        },
        add: {
          imports: [AttendeeTestComponent],
          providers: [{ provide: AppConfigService, useValue: { getBaseUrl: appConfigServiceSpy } }]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }));

  it('should render correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should render correctly for application only', () => {
    component.isStandAloneApplication = true;
    component.hearing = hearingWithOnlyApplications as any;

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should render correctly for a bulk case without any removed defendants', () => {
    component.isStandAloneApplication = false;
    component.hearing = {
      ...hearingWithoutApplications,
      prosecutionCases: [{ ...hearingWithoutApplications.prosecutionCases[0], isGroupMaster: true }]
    };

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should render correctly for a bulk case with a removed defendant', () => {
    component.isStandAloneApplication = false;
    component.hearing = {
      ...hearingWithoutApplications,
      prosecutionCases: [
        ...hearingWithoutApplications.prosecutionCases,
        { ...hearingWithoutApplications.prosecutionCases[0], isGroupMaster: true }
      ]
    };

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should show `Appellant` label when `applicantAppellantFlag` is true', () => {
    component.isStandAloneApplication = true;
    component.hearing = hearingWithApplicantAppellantFlagTrue;

    fixture.detectChanges();
    const sectionToTest = fixture.debugElement.query(By.css('[data-test-id="applicantCounsels"]'));

    expect(sectionToTest.nativeElement).toMatchSnapshot();
  });

  it('should show `Applicant` label when `applicantAppellantFlag` is false', () => {
    component.isStandAloneApplication = true;
    component.hearing = hearingWithApplicantAppellantFlagFalse;

    fixture.detectChanges();
    const sectionToTest = fixture.debugElement.query(By.css('[data-test-id="applicantCounsels"]'));

    expect(sectionToTest.nativeElement).toMatchSnapshot();
  });

  @Component({
    selector: 'test-host-component',
    template: `
      <hearing-attendees
        [activeDefendant]="activeDefendant"
        [changeJudiciaryLink]="changeJudiciaryLink"
        [defenceCounsels]="defenceCounsels"
        [companyRepresentatives]="companyRepresentatives"
        [hearing]="hearing"
        [isStandAloneApplication]="isStandAloneApplication"
        [prosecutionCounsels]="prosecutionCounsels"
        [intermediariesCounsel]="intermediariesCounsel"
        (onApplicantSelected)="(onApplicantSelected)"
        (onDefendantSelected)="(onDefendantSelected)"
        (onGoToAddCounsels)="(onGoToAddCounsels)"
        (onGoToCaseDetails)="(onGoToCaseDetails)"
      >
      </hearing-attendees>
    `,
    imports: [HearingAttendeesComponent]
  })
  class TestHostComponent {
    activeApplicant: CourtApplicationParty = null;
    activeDefendant = mockDefendant;
    changeJudiciaryLink: string;
    defenceCounsels = mockDefenceCounsels;
    companyRepresentatives = mockCompanyRepresentatives;
    hearing = hearingWithoutApplications;
    isStandAloneApplication = false;
    prosecutionCounsels = mockProsecutionCounsels;
    intermediariesCounsel = mockIntermediaryCounsels;

    onApplicantSelected = jest.fn();
    onDefendantSelected = jest.fn();
    onGoToAddCounsels = jest.fn();
    onGoToCaseDetails = jest.fn();
  }

  @Component({
    selector: 'attendee',
    template: `
      <div>Attendee Mock</div>
      <div>name: {{ name }}</div>
      <div>type: {{ type }}</div>
    `,
    imports: []
  })
  class AttendeeTestComponent {
    @Input() name: string;
    @Input() type?: string;
  }
});
