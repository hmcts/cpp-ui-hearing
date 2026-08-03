import { Component, Input } from '@angular/core';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourtApplication } from '../../core';
import { ApplicationResultsComponent } from './application-results.component';
import { ShareableResultsContainerComponent } from '../../results/share-results/shareable-results.container';
import { TranslateMockPipe } from '../../shared/pipes/mock-pipes/translate-mock.pipe';

const fakeCourtApplication = {
  applicationReceivedDate: '2021-01-05',
  applicationReference: 'SHRUQK2SME',
  applicationStatus: 'LISTED',
  id: '7db9bc70-41b5-4586-aa48-ad0894473fd9',
  type: {
    type: 'Further offence committed during youth offender panel referral period'
  }
} as CourtApplication;

describe('ApplicationResultsComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent, TranslateMockPipe],
      teardown: { destroyAfterEach: false }
    }).overrideComponent(ApplicationResultsComponent, {
      remove: {
        imports: [ShareableResultsContainerComponent, TranslatePipe]
      },
      add: {
        imports: [MockShareableResultsContainer, TranslateMockPipe]
      }
    });

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it('should render the component', () => {
    hostComponent.courtApplication = fakeCourtApplication;
    hostComponent.hearingType = 'MAGISTRATES';
    hostFixture.detectChanges();
    expect(hostFixture).toMatchSnapshot();
  });

  describe('hasAmendApplication gate', () => {
    const createCourtApplication = ({
      applicationStatus = 'LISTED',
      pleaApplicableFlag = true,
      ...amendment
    }: {
      applicationStatus?: string;
      pleaApplicableFlag?: boolean;
      amendmentAllowed?: boolean;
    } = {}): CourtApplication =>
      ({
        ...fakeCourtApplication,
        ...amendment,
        applicationStatus,
        type: {
          type: 'Further offence committed during youth offender panel referral period',
          pleaApplicableFlag
        }
      } as CourtApplication);

    let component: ApplicationResultsComponent;

    beforeEach(() => {
      component = new ApplicationResultsComponent();
    });

    describe('when the user has the amend application permission', () => {
      beforeEach(() => {
        component.amendApplicationPermission = true;
      });

      it.each(['ACTIVE', 'INACTIVE'])(
        "should block the gate for a FINALISED application with amendmentAllowed false even when the case status is '%s'",
        (caseStatus: string) => {
          component.applicationCaseStatus = caseStatus;
          component.courtApplication = createCourtApplication({
            applicationStatus: 'FINALISED',
            amendmentAllowed: false
          });

          component.ngOnChanges({});

          expect(component.hasAmendApplication).toBe(false);
        }
      );

      it('should block the gate for a FINALISED application without amendmentAllowed when no case status is set', () => {
        component.courtApplication = createCourtApplication({ applicationStatus: 'FINALISED' });

        component.ngOnChanges({});

        expect(component.hasAmendApplication).toBeFalsy();
      });

      it.each(['ACTIVE', 'INACTIVE'])(
        "should allow the gate for a FINALISED application with amendmentAllowed true when the case status is '%s'",
        (caseStatus: string) => {
          component.applicationCaseStatus = caseStatus;
          component.courtApplication = createCourtApplication({
            applicationStatus: 'FINALISED',
            amendmentAllowed: true
          });

          component.ngOnChanges({});

          expect(component.hasAmendApplication).toBe(true);
        }
      );

      it('should allow the gate for a non-finalised application when the application type is plea applicable', () => {
        component.courtApplication = createCourtApplication({ applicationStatus: 'LISTED' });

        component.ngOnChanges({});

        expect(component.hasAmendApplication).toBe(true);
      });

      it('should block the gate for a non-finalised application when the application type is not plea applicable', () => {
        component.courtApplication = createCourtApplication({
          applicationStatus: 'LISTED',
          pleaApplicableFlag: false
        });

        component.ngOnChanges({});

        expect(component.hasAmendApplication).toBe(false);
      });
    });

    describe('when the user does not have the amend application permission', () => {
      beforeEach(() => {
        component.amendApplicationPermission = false;
      });

      it.each(['ACTIVE', 'INACTIVE'])(
        "should keep the legacy behaviour and allow the gate for a FINALISED plea applicable application when the case status is '%s'",
        (caseStatus: string) => {
          component.applicationCaseStatus = caseStatus;
          component.courtApplication = createCourtApplication({
            applicationStatus: 'FINALISED',
            amendmentAllowed: false
          });

          component.ngOnChanges({});

          expect(component.hasAmendApplication).toBe(true);
        }
      );

      it('should keep the legacy behaviour and block the gate when the application type is not plea applicable', () => {
        component.courtApplication = createCourtApplication({ pleaApplicableFlag: false });

        component.ngOnChanges({});

        expect(component.hasAmendApplication).toBe(false);
      });
    });
  });
});

@Component({
  selector: 'cpp-shareable-results-container',
  template: `
    applicationId: {{ applicationId }}<br />
    caseId: {{ caseId }}<br />
    masterDefendantId: {{ masterDefendantId }}<br />
    offenceId: {{ offenceId }}<br />
    showResultsPlaceholder: {{ showResultsPlaceholder }}<br />
  `
})
class MockShareableResultsContainer {
  @Input() applicationId: string;
  @Input() caseId: string;
  @Input() masterDefendantId: string;
  @Input() offenceId: string;
  @Input() showResultsPlaceholder: boolean;
  @Input() isCourtApplicationFinalised: boolean;
  @Input() isAmendmentAllowed: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() applicationCaseStatus: string;
}
@Component({
  selector: 'test-host-component',
  template: `
    <application-results [hearingType]="hearingType" [courtApplication]="courtApplication">
    </application-results>
  `,
  imports: [ApplicationResultsComponent]
})
class TestHostComponent {
  courtApplication: CourtApplication;
  hearingType: string;
}
