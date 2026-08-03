import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import {
  CourtApplication,
  DefendantCasesApplications,
  HearingDetail,
  ProsecutionCaseDetails
} from '../../../core';
import { HeadlineSummaryComponent } from './headline-summary.component';

const application = {
  id: '9387db3b-937b-45c1-9210-b758924a6865'
} as CourtApplication;

const aCase = {
  id: '9b70743c-69b3-4ac2-a362-8c720b32e45b',
  prosecutionCaseIdentifier: '8C720B32E45B',
  defendants: [
    {
      defendantId: 'd49354c5-17d8-4e6b-bd7b-c29d7f0adf57',
      personId: 'e08739da-486b-4cd8-adec-bf5752e6b5e0',
      firstName: 'Steve',
      lastName: 'Rascal',
      homeTelephone: '02070101010',
      mobile: '07422263910',
      fax: '021111111',
      email: 'steve.rascal@acme.me',
      address: {
        formatedAddress: '43 Lightfinger Close Meadowbanks Campsdown Exeter CR0 1XG',
        address1: '43 Lightfinger Close ',
        address2: 'Meadowbanks',
        address3: 'Campsdown',
        address4: 'Exeter',
        postCode: 'CR0 1XG'
      },
      dateOfBirth: '1943-02-04',
      offences: [
        {
          id: '4b1318e4-1517-4e4f-a89d-6af0eafa5058',
          wording: 'wording',
          count: 1,
          title: 'Robbery',
          legislation: 'legislation',
          plea: {
            pleaId: '0161a828-cfd1-4608-8616-d92870baba3d',
            pleaDate: '2016-06-08',
            value: 'GUILTY'
          },
          verdict: {
            verdictId: '0161a828-cfd1-4608-8616-d92870bada3d',
            value: {
              id: '0161a828-cfd1-4608-8616-d92870bada3d',
              category: 'GUILTY',
              code: 'A1',
              description: 'description',
              verdictDate: '2018-02-21'
            },
            verdictDate: '2018-02-21',
            numberOfSplitJurors: 2,
            numberOfJurors: 10,
            unanimous: false
          }
        }
      ]
    }
  ],
  offences: [
    {
      id: '4b1318e4-1517-4e4f-a89d-6af0eafa5058',
      wording: 'wording',
      count: 1,
      title: 'Robbery',
      legislation: 'legislation',
      plea: {
        pleaId: '0161a828-cfd1-4608-8616-d92870baba3d',
        pleaDate: '2016-06-08',
        value: 'GUILTY'
      },
      verdict: {
        verdictId: '0161a828-cfd1-4608-8616-d92870bada3d',
        value: {
          id: '0161a828-cfd1-4608-8616-d92870bada3d',
          category: 'GUILTY',
          code: 'A1',
          description: 'description',
          verdictDate: '2018-02-21'
        },
        verdictDate: '2018-02-21',
        numberOfSplitJurors: 2,
        numberOfJurors: 10,
        unanimous: false
      }
    }
  ]
} as unknown as ProsecutionCaseDetails;

const hearing = {
  id: '123',
  type: {
    id: '345',
    description: 'PTP'
  },
  courtCentre: {
    id: 'e8821a38-546d-4b56-9992-ebdd772a561f',
    name: 'Liverpool Crown Court',
    roomId: 'e7721a38-546d-4b56-9992-ebdd772a561b',
    roomName: '3-1'
  },
  judiciary: [
    {
      judicialId: 'a38d0d5f-a26c-436b-9b5e-4dc58f28878d',
      title: 'HHJ',
      firstName: 'Sebastian',
      lastName: 'Faulkes'
    }
  ],
  prosecutionCounsels: [],
  defenceCounsels: [],
  prosecutionCases: [aCase],
  courtApplications: [application]
} as HearingDetail;

const casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[] = [
  {
    ...aCase.defendants[0],
    prosecutionCases: [aCase],
    courtApplications: [application]
  }
] as DefendantCasesApplications[];

describe('HeadlineSummaryComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent, CommonModule],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should pluralise if more than 1 case, defendant, offence or application', () => {
    const multipleCasesDefendantsOffencesHearing = Object.assign({}, hearing, {
      prosecutionCases: [aCase, aCase],
      courtApplications: [application, application]
    });

    const multipleDefendants = casesAndApplicationsGroupedByDefendant.concat(
      casesAndApplicationsGroupedByDefendant
    );
    fixture.componentInstance.hearing = multipleCasesDefendantsOffencesHearing;
    fixture.componentInstance.casesAndApplicationsGroupedByDefendant = multipleDefendants;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should not display if no case, defendant, offence or application', () => {
    const multipleCasesDefendantsOffencesHearing = Object.assign({}, hearing, {
      prosecutionCases: [],
      courtApplications: []
    });
    fixture.componentInstance.casesAndApplicationsGroupedByDefendant = [];
    fixture.componentInstance.hearing = multipleCasesDefendantsOffencesHearing;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should render the template with the values expected for bulk hearing', () => {
    fixture.componentInstance.hearingCasesCount = 1000;
    fixture.componentInstance.hearing = Object.assign({}, hearing, {
      prosecutionCases: [{ ...aCase, isGroupMaster: true }, aCase],
      courtApplications: [application, application]
    });
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <headline-summary
      [hearing]="hearing"
      [hearingCasesCount]="hearingCasesCount"
      [casesAndApplicationsGroupedByDefendant]="casesAndApplicationsGroupedByDefendant"
    >
    </headline-summary>
  `,
  imports: [HeadlineSummaryComponent]
})
class TestHostComponent {
  hearingCasesCount = 0;
  hearing: HearingDetail = hearing;
  casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[] =
    casesAndApplicationsGroupedByDefendant;
}
