import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideMockStore } from '@ngrx/store/testing';
import { HearingDetailsPanelComponent } from './hearing-details-panel.component';
import {
  Defendant,
  HearingDetail,
  ProsecutionCounsel,
  DefenceCounsel,
  IntermediaryCounsel,
  CompanyRepresentative,
  DefendantCasesApplications,
  ApplicationSubject
} from '../../core';
import { AppConfigService } from '../../config/config.service';

describe('HearingDetailsPanelComponent', () => {
  let testHostFixture: ComponentFixture<TestHostComponent>;
  let testHostComponent: HearingDetailsPanelComponent;

  function triggerDefendantSelectedEvent() {
    const attendeesEl: DebugElement = testHostFixture.debugElement.query(
      By.css('hearing-attendees')
    );
    attendeesEl.triggerEventHandler('onDefendantSelected', null);
  }

  function triggerGoToAddCounselsEvent() {
    const attendeesEl: DebugElement = testHostFixture.debugElement.query(
      By.css('hearing-attendees')
    );
    attendeesEl.triggerEventHandler('onGoToAddCounsels', null);
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideMockStore(),
        {
          provide: AppConfigService,
          useValue: { getBaseUrl: jest.fn().mockReturnValue('http://test') }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    testHostFixture = TestBed.createComponent(TestHostComponent);
    testHostFixture.detectChanges();
    testHostComponent = testHostFixture.debugElement.children[0].componentInstance;
  }));

  it('should render the template with the values expected', () => {
    expect(testHostFixture).toMatchSnapshot();
  });

  it('should render with stand alone application', () => {
    testHostFixture.componentInstance.isStandAloneApplication = true;
    testHostFixture.componentInstance.selectedHearing = {
      ...testHostFixture.componentInstance.selectedHearing,
      courtApplications: [
        {
          type: {
            applicantAppellantFlag: true
          }
        }
      ] as any,
      applicantCounsels: [],
      respondentCounsels: []
    };
    testHostFixture.detectChanges();

    expect(testHostFixture).toMatchSnapshot();
  });

  it('should fire an event when selecting a defendant', fakeAsync(() => {
    triggerDefendantSelectedEvent();

    expect(testHostFixture.componentInstance.defendantSelected).toHaveBeenCalledTimes(1);
  }));

  it('should fire an event when going to add counsels', fakeAsync(() => {
    triggerGoToAddCounselsEvent();

    expect(testHostFixture.componentInstance.goToAddCounsels).toHaveBeenCalledTimes(1);
  }));

  describe('when go to hearing button is clicked', () => {
    let hearingDetailsFixture: ComponentFixture<HearingDetailsPanelComponent>;
    let hearingDetailsComponent: HearingDetailsPanelComponent;
    let goToHearingButton: DebugElement;

    beforeEach(() => {
      hearingDetailsFixture = TestBed.createComponent(HearingDetailsPanelComponent);
      hearingDetailsComponent = hearingDetailsFixture.componentInstance;
      goToHearingButton = hearingDetailsFixture.debugElement.query(
        By.css('[data-role="go-to-hearing-btn"]')
      );
    });

    it('should fire a onGoToHearing event if not bulk hearing', () => {
      const goToHearingSpy = jest.spyOn(hearingDetailsComponent.onGoToHearing, 'emit');
      hearingDetailsComponent.hearing = {
        prosecutionCases: [{ isGroupMaster: false }]
      } as HearingDetail;
      goToHearingButton.nativeElement.click();

      expect(goToHearingSpy).toHaveBeenCalledTimes(1);
    });

    it('should fire a onGoToHearingResults event if bulk hearing', () => {
      const goToHearingResultsSpy = jest.spyOn(
        hearingDetailsComponent.onGoToHearingResults,
        'emit'
      );
      hearingDetailsComponent.hearing = {
        prosecutionCases: [{ isGroupMaster: true }]
      } as HearingDetail;
      goToHearingButton.nativeElement.click();

      expect(goToHearingResultsSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should emit an event when navigating to case details', () => {
    const fakeCaseId = 'caseId';
    jest.spyOn(testHostComponent.onGoToCaseDetails, 'emit');

    testHostComponent.goToCaseDetails(fakeCaseId);
    testHostFixture.detectChanges();

    expect(testHostComponent.onGoToCaseDetails.emit).toHaveBeenCalledWith(fakeCaseId);
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <hearing-details-panel
      [activeSubjectId]="selectedApplicant"
      [activeDefendant]="selectedDefendant"
      [changeJudiciaryLink]="'http://test/?something=123'"
      [hearing]="selectedHearing"
      [isStandAloneApplication]="isStandAloneApplication"
      [prosecutionCounsels]="prosecutionCounsels"
      [defenceCounsels]="defenceCounsels"
      [intermediariesCounsel]="intermediariesCounsel"
      [companyRepresentatives]="companyRepresentatives"
      [casesAndApplicationsGroupedByDefendant]="casesAndApplicationsGroupedByDefendant"
      [applicationSubjects]="applicationSubjects"
      (onApplicantSelected)="applicantSelected($event)"
      (onDefendantSelected)="defendantSelected($event)"
      (onGoToHearing)="goToHearing()"
      (onGoToAddCounsels)="goToAddCounsels()"
    >
    </hearing-details-panel>
  `,
  imports: [HearingDetailsPanelComponent]
})
class TestHostComponent {
  isStandAloneApplication = false;
  selectedApplicant: ApplicationSubject | null = null;
  selectedDefendant: Defendant | null = null;
  selectedHearing: HearingDetail = {
    id: '12345',
    prosecutionCases: [],
    courtApplications: [],
    judiciary: []
  } as HearingDetail;
  prosecutionCounsels: ProsecutionCounsel[] = [];
  defenceCounsels: DefenceCounsel[] = [];
  intermediariesCounsel: IntermediaryCounsel[] = [];
  companyRepresentatives: CompanyRepresentative[] = [];
  casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[] = [];
  applicationSubjects: ApplicationSubject[] = [];

  applicantSelected = jest.fn();
  defendantSelected = jest.fn();
  goToHearing = jest.fn();
  goToAddCounsels = jest.fn();
}
