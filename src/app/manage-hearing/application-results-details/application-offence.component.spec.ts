import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Offence, VerdictType } from '../../core';
import { ProsecutionCaseIdentifier } from '../../core/model/shared/prosecution-case-identifier';
import { ApplicationOffenceComponent } from './application-offence.component';
import { ShareableResultsContainerComponent } from '../../results/share-results/shareable-results.container';
import { TranslateMockPipe } from '../../shared/pipes/mock-pipes/translate-mock.pipe';
import { provideTranslateService, TranslatePipe } from '@ngx-translate/core';

let hostFixture: ComponentFixture<TestHostComponent>;
let hostComponent: TestHostComponent;

const fakeOffence = {
  arrestDate: '2020-02-09',
  count: 0,
  orderIndex: 1,
  id: '7b5c859b-7b07-4c8b-acaa-50af22b0847f',
  offenceTitle: 'Use / install a television set without a licence',
  plea: {
    offenceId: '10925471-d21d-11e8-8bbe-b7353eff5c9a',
    originatingHearingId: '10920651-d21d-11e8-8bbe-b7353eff5c9a',
    pleaDate: '2018-10-17',
    pleaValue: 'NOT_GUILTY'
  },
  verdict: {
    jurors: {
      numberOfJurors: 10,
      numberOfSplitJurors: 1,
      unanimous: false
    },
    lesserOrAlternativeOffence: {
      offenceCode: 'OFF123',
      offenceDefinitionId: 'ec09757a-bf2a-4f30-9887-94e0eee26206',
      offenceLegislation: 'Contrary to section 1(1)    of the Criminal Attempts Act 1981.',
      offenceTitle: 'Section 18 - attempt wounding with intent'
    },
    offenceId: '10925471-d21d-11e8-8bbe-b7353eff5c9a',
    originatingHearingId: '10920651-d21d-11e8-8bbe-b7353eff5c9a',
    verdictDate: '2018-10-17',
    verdictType: {
      category: '',
      categoryType: '',
      id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c'
    }
  }
} as Offence;

const fakeProsecutionIdentifier = {
  prosecutionAuthorityCode: 'DERPF',
  prosecutionAuthorityId: 'bdc190e7-c939-37ca-be4b-9f615d6ef40e',
  caseURN: '54GD8000038'
} as ProsecutionCaseIdentifier;

const mockPleasMapping = {
  GUILTY: 'Guilty',
  NOT_GUILTY: 'Not Guilty',
  NOTIFIED_GUILTY: 'Guilty',
  NOTIFIED_NOT_GUILTY: 'Not Guilty'
};

const mockGuiltyPleasValues = ['GUILTY', 'MCA_GUILTY', 'AUTREFOIS_CONVICT', 'CONSENTS'];

const mockVerdictTypes: VerdictType[] = [
  {
    id: '7e2f843e-d639-40b3-8611-8015f3a18951',
    description: 'Guilty',
    category: 'Guilty',
    categoryType: 'GUILTY',
    sequence: 1,
    validFrom: '2017-08-01',
    validTo: '2017-08-01'
  },
  {
    id: '7e2f843e-d639-40b3-8611-8015f3a18950',
    description: 'Not Guilty',
    category: 'Not Guilty',
    categoryType: 'NOT_GUILTY',
    sequence: 1,
    validFrom: '2017-08-01',
    validTo: '2017-08-01'
  }
];

describe('ApplicationOffenceComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent, TranslateMockPipe],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(ApplicationOffenceComponent, {
        remove: {
          imports: [ShareableResultsContainerComponent, TranslatePipe]
        },
        add: {
          imports: [MockShareableResultsContainer, TranslateMockPipe]
        }
      })
      .compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
  });

  it('should render the component for MAGISTRATES jurisdiction', () => {
    hostComponent.offence = fakeOffence;
    hostComponent.hearingType = 'MAGISTRATES';
    hostComponent.prosecutionCaseIdentifier = fakeProsecutionIdentifier;
    hostComponent.pleasMapping = mockPleasMapping;
    hostComponent.guiltyPleasValues = mockGuiltyPleasValues;
    hostComponent.verdictTypes = mockVerdictTypes;
    hostFixture.detectChanges();
    expect(hostFixture).toMatchSnapshot();
  });

  it('should render the component for CROWN jurisdiction with a count', () => {
    hostComponent.offence = { ...fakeOffence, count: 2 };
    hostComponent.hearingType = 'CROWN';
    hostComponent.prosecutionCaseIdentifier = fakeProsecutionIdentifier;
    hostComponent.pleasMapping = mockPleasMapping;
    hostComponent.guiltyPleasValues = mockGuiltyPleasValues;
    hostComponent.verdictTypes = mockVerdictTypes;
    hostFixture.detectChanges();
    expect(hostFixture).toMatchSnapshot();
  });

  it('should render the component for CROWN jurisdiction without a count (fallback to orderIndex)', () => {
    hostComponent.offence = { ...fakeOffence, count: null };
    hostComponent.hearingType = 'CROWN';
    hostComponent.prosecutionCaseIdentifier = fakeProsecutionIdentifier;
    hostComponent.pleasMapping = mockPleasMapping;
    hostComponent.guiltyPleasValues = mockGuiltyPleasValues;
    hostComponent.verdictTypes = mockVerdictTypes;
    hostFixture.detectChanges();
    expect(hostFixture).toMatchSnapshot();
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
  @Input() amendApplicationPermission: boolean;
}

@Component({
  selector: 'test-host-component',
  template: `
    <application-offence
      [offence]="offence"
      [prosecutionCaseIdentifier]="prosecutionCaseIdentifier"
      [hearingType]="hearingType"
      [pleasMapping]="pleasMapping"
      [guiltyPleasValues]="guiltyPleasValues"
      [verdictTypes]="verdictTypes"
    >
    </application-offence>
  `,
  imports: [ApplicationOffenceComponent]
})
class TestHostComponent {
  offence: Offence;
  prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  hearingType: string;
  pleasMapping: { [key: string]: string };
  guiltyPleasValues: string[];
  verdictTypes: VerdictType[];
}
