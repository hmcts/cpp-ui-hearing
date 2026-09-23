import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { OffencesListComponent } from './offences-list.component';

describe('OffencesListComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should render the template without case reference and bail status if bulkCase', () => {
    fixture.componentInstance.defendantCase = {
      ...fixture.componentInstance.defendantCase,
      isGroupMaster: true
    };

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <offences-list [defendantCase]="defendantCase" [defendant]="defendant"> </offences-list>
  `,
  imports: [OffencesListComponent]
})
class TestHostComponent {
  defendantCase = {
    isGroupMaster: false,
    caseMarkers: [
      {
        id: '29aad216-78f4-49a3-990e-6fda77e7a098',
        markerTypeCode: 'GBP',
        markerTypeDescription: 'GBP',
        markerTypeid: '8ecaa4e8-c57c-43f7-8a48-5fa3c74fce26'
      }
    ],
    caseStatus: 'READY_FOR_REVIEW',
    id: 'fac653c1-65e0-438c-9fd7-9fd246826dab',
    initiationCode: 'S',
    originatingOrganisation: 'Xd6mGn8dzU',
    prosecutionCaseIdentifier: {
      prosecutionAuthorityCode: 'B01BH',
      prosecutionAuthorityId: 'bcdca7df-ab21-45f6-bc19-f883cf3d407e',
      caseURN: '31GD1715420'
    },
    statementOfFacts: '1cFBVmFvQ8',
    statementOfFactsWelsh: '1cFBVmFvQ8_WELSH',
    offences: [
      {
        allocationDecision: {
          allocationDecisionDate: '2020-02-22',
          motReasonCode: '01',
          motReasonDescription: 'gT4K0nfGRe',
          motReasonId: '19e7b6c8-c98e-4dcd-91ab-f1418679862f',
          offenceId: '530a114f-16a0-46d0-af64-5b891a794cc8',
          originatingHearingId: 'a27f255b-5261-418e-88e5-a3294ba334ea',
          sequenceNumber: 10,
          courtIndicatedSentence: {}
        },
        arrestDate: '2020-02-13',
        chargeDate: '2020-02-13',
        convictionDate: '2020-03-03',
        count: 1,
        endDate: '2019-11-13',
        id: '530a114f-16a0-46d0-af64-5b891a794cc8',
        indicatedPlea: {
          indicatedPleaDate: '2020-02-22',
          indicatedPleaValue: 'INDICATED_GUILTY',
          offenceId: '530a114f-16a0-46d0-af64-5b891a794cc8',
          source: 'ONLINE'
        },
        introducedAfterInitialProceedings: false,
        isDiscontinued: false,
        modeOfTrial: 'INPERSON',
        notifiedPlea: {
          notifiedPleaDate: '2020-03-03',
          notifiedPleaValue: 'NOTIFIED_GUILTY',
          offenceId: '530a114f-16a0-46d0-af64-5b891a794cc8'
        },
        offenceCode: 'OF61016A',
        offenceDefinitionId: 'd6bd72ad-37bf-330d-bcc6-215728949d3e',
        offenceFacts: {
          alcoholReadingAmount: 2,
          alcoholReadingMethodCode: 'AA',
          vehicleRegistration: 'VS07BSF'
        },
        offenceLegislation: 'Section 18 - attempt    wounding with intent Legislation',
        offenceLegislationWelsh: 'Section 18 - attempt    wounding with intent Legislation_WELSH',
        offenceTitle: 'Section 18 - attempt    wounding with intent',
        offenceTitleWelsh: 'Section 18 - attempt    wounding with intent_WELSH',
        orderIndex: 1,
        proceedingsConcluded: false,
        startDate: '2019-05-13',
        wording: 'Wound / inflict grievous bodily harm without intent',
        wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH',
        plea: {
          offenceId: '530a114f-16a0-46d0-af64-5b891a794cc8',
          originatingHearingId: '3ea6a6cd-a577-4952-ad69-1bad567a35d1'
        },
        verdict: {
          offenceId: '530a114f-16a0-46d0-af64-5b891a794cc8',

          verdictType: {
            code: '',
            description: '',
            category: '',
            categoryType: ''
          },
          originatingHearingId: '3ea6a6cd-a577-4952-ad69-1bad567a35d1',

          jurors: {
            numberOfJurors: 12,
            numberOfSplitJurors: 0,
            unanimous: true
          }
        }
      },
      {
        allocationDecision: {
          allocationDecisionDate: '2020-02-22',
          motReasonCode: '01',
          motReasonDescription: 'gT4K0nfGRe',
          motReasonId: '19e7b6c8-c98e-4dcd-91ab-f1418679862f',
          offenceId: '7c26b83d-4071-46c2-907d-41851c12872a',
          originatingHearingId: 'a27f255b-5261-418e-88e5-a3294ba334ea',
          sequenceNumber: 10,
          courtIndicatedSentence: {}
        },
        arrestDate: '2020-02-13',
        chargeDate: '2020-02-13',
        convictionDate: '2020-03-03',
        count: 2,
        endDate: '2019-11-13',
        id: '7c26b83d-4071-46c2-907d-41851c12872a',
        indicatedPlea: {
          indicatedPleaDate: '2020-02-22',
          indicatedPleaValue: 'INDICATED_GUILTY',
          offenceId: '7c26b83d-4071-46c2-907d-41851c12872a',
          source: 'ONLINE'
        },
        introducedAfterInitialProceedings: false,
        isDiscontinued: false,
        modeOfTrial: 'INPERSON',
        notifiedPlea: {
          notifiedPleaDate: '2020-03-03',
          notifiedPleaValue: 'NOTIFIED_GUILTY',
          offenceId: '7c26b83d-4071-46c2-907d-41851c12872a'
        },
        offenceCode: 'OF61016A',
        offenceDefinitionId: '062cedf4-b495-3a6c-9148-cec6bef362ed',
        offenceFacts: {
          alcoholReadingAmount: 2,
          alcoholReadingMethodCode: 'AA',
          vehicleRegistration: 'VS07BSF'
        },
        offenceLegislation: 'Section 18 - attempt    wounding with intent Legislation',
        offenceLegislationWelsh: 'Section 18 - attempt    wounding with intent Legislation_WELSH',
        offenceTitle: 'Section 18 - attempt    wounding with intent',
        offenceTitleWelsh: 'Section 18 - attempt    wounding with intent_WELSH',
        orderIndex: 1,
        proceedingsConcluded: false,
        startDate: '2019-05-13',
        wording: 'Wound / inflict grievous bodily harm without intent',
        wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH',
        plea: {
          offenceId: '7c26b83d-4071-46c2-907d-41851c12872a',
          originatingHearingId: '3ea6a6cd-a577-4952-ad69-1bad567a35d1'
        },
        verdict: {
          offenceId: '7c26b83d-4071-46c2-907d-41851c12872a',

          verdictType: {
            code: '',
            description: '',
            category: '',
            categoryType: ''
          },
          originatingHearingId: '3ea6a6cd-a577-4952-ad69-1bad567a35d1',

          jurors: {
            numberOfJurors: 12,
            numberOfSplitJurors: 0,
            unanimous: true
          }
        }
      }
    ]
  };

  defendant = {
    courtProceedingsInitiated: '2020-03-13T16:43:46.444Z',
    defenceOrganisation: {
      address: {
        address1: '15',
        address2: '8177 Osinski Key',
        address3: 'Candiceborough',
        address4: 'BJ',
        address5: 'Burundi',
        postcode: 'WA9 1AB'
      },
      contact: {
        fax: '299-173-2510',
        home: '251-815-3301',
        mobile: '(754) 066-8774',
        primaryEmail: 'maddison.hand@gmail.com',
        secondaryEmail: 'eden.farrell@hotmail.com',
        work: '153-102-0008'
      },
      incorporationNumber: '1975',
      name: 'EY',
      registeredCharityNumber: '007'
    },
    id: '3718c345-686a-49b7-8f6b-724bcb6b8a54',
    isYouth: false,
    masterDefendantId: '3718c345-686a-49b7-8f6b-724bcb6b8a54',
    mitigation: 'C4hbZejZeq',
    mitigationWelsh: 'C4hbZejZeq_WELSH',
    numberOfPreviousConvictionsCited: 0,
    personDefendant: {
      arrestSummonsNumber: '007',
      bailStatus: [
        {
          code: 'C',
          description: 'BAIL_STATUS_DESCRIPTION',
          id: '12e69486-4d01-3403-a50a-7419ca040635'
        }
      ],
      driverNumber: '007',
      employerOrganisation: {
        address: {
          address1: '15',
          address2: '8177 Osinski Key',
          address3: 'Candiceborough',
          address4: 'BJ',
          address5: 'Burundi',
          postcode: 'WA9 1AB'
        },
        contact: {
          fax: '299-173-2510',
          home: '251-815-3301',
          mobile: '(754) 066-8774',
          primaryEmail: 'maddison.hand@gmail.com',
          secondaryEmail: 'eden.farrell@hotmail.com',
          work: '153-102-0008'
        },
        incorporationNumber: '01051975',
        name: 'EY',
        registeredCharityNumber: 'AA'
      },
      employerPayrollReference: 'JYKDxXPh5z',
      perceivedBirthYear: 1975,
      personDetails: {
        additionalNationalityCode: 'GBP',
        additionalNationalityId: '49433158-3542-49c8-a9af-581a0e746152',
        address: {
          address1: '15',
          address2: '8177 Osinski Key',
          address3: 'Candiceborough',
          address4: 'BJ',
          address5: 'Burundi',
          postcode: 'WA9 1AB'
        },
        contact: {
          fax: '299-173-2510',
          home: '251-815-3301',
          mobile: '(754) 066-8774',
          primaryEmail: 'maddison.hand@gmail.com',
          secondaryEmail: 'eden.farrell@hotmail.com',
          work: '153-102-0008'
        },
        dateOfBirth: '1995-03-13',
        disabilityStatus: 'KlWQtLLu5q',
        documentationLanguageNeeds: 'ENGLISH',
        ethnicity: {
          observedEthnicityCode: 'GBP',
          observedEthnicityDescription: 'GBP',
          observedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
          selfDefinedEthnicityCode: 'GBP',
          selfDefinedEthnicityDescription: 'GBP',
          selfDefinedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b'
        },
        firstName: 'Myriam',
        gender: 'MALE',
        interpreterLanguageNeeds: 'NA',
        lastName: 'Kutch',
        middleName: 'Terry',
        nationalInsuranceNumber: 'JM634077D',
        nationalityCode: 'GBP',
        nationalityDescription: 'GBP',
        nationalityId: '49433158-3542-49c8-a9af-581a0e746152',
        occupation: 'Service',
        occupationCode: 'SS',
        specificRequirements: 'NA',
        title: 'MR'
      }
    },
    pncId: 'PNCID',
    proceedingsConcluded: false,
    prosecutionAuthorityReference: 'TFL1247696',
    prosecutionCaseId: 'fac653c1-65e0-438c-9fd7-9fd246826dab',
    witnessStatement: 'tGB53m7XZx',
    witnessStatementWelsh: 'tGB53m7XZx_WELSH'
  };
}
