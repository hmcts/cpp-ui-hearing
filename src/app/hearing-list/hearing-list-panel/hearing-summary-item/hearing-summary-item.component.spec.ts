import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HearingSummaryItemComponent } from './hearing-summary-item.component';
import { DefendantName } from '../../../core/model/defendant-name';
import { HearingSummary, Offence } from '../../../core/model';
import { AppConfigService } from '../../../config';

const defendantOne: DefendantName = {
  id: 'id',
  firstName: 'Isaac',
  lastName: 'Sanya',
  offences: [
    {
      id: 'offence1',
      offenceTitle: 'Council tax liability'
    } as Offence
  ]
};

const defendantTwo: DefendantName = {
  id: 'id',
  firstName: 'Tomasz',
  lastName: 'Kolecki'
};

const defendantThree: DefendantName = {
  id: 'id',
  firstName: 'Tomasz',
  lastName: 'Kolecki'
};

const hearing: HearingSummary = {
  id: '123',
  hearingLanguage: 'WELSH',
  reportingRestrictionReason: 'reportingRestrictionReason',
  jurisdictionType: 'CROWN',
  hasSharedResults: false,
  type: {
    id: 'id',
    description: 'description'
  },
  hearingDays: [
    {
      listedDurationMinutes: 30,
      listingSequence: 1,
      sittingDay: '2018-10-18'
    }
  ],
  courtApplicationSummaries: [],
  prosecutionCaseSummaries: [
    {
      id: '123',
      prosecutionCaseIdentifier: {
        prosecutionAuthorityId: 'prosecutionAuthorityId',
        prosecutionAuthorityCode: 'prosecutionAuthorityCode',
        prosecutionAuthorityReference: 'prosecutionAuthorityReference',
        caseURN: '1234567'
      },
      defendants: [defendantOne]
    }
  ]
};

describe('HearingSummaryItemComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        {
          provide: AppConfigService,
          useValue: {
            getConfig: jest.fn().mockReturnValue({ reportingRestrictions: { enabled: true } })
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should render the template with 1 bulk case', () => {
    fixture.componentInstance.hearing = Object.assign({}, hearing, {
      numberOfGroupCases: 1000,
      prosecutionCaseSummaries: [
        {
          ...hearing.prosecutionCaseSummaries[0],
          isGroupMaster: true,
          offenceType: 'Council tax liability'
        }
      ]
    });

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should render the template with with 1 bulk case and 1 removed defendant', () => {
    fixture.componentInstance.hearing = Object.assign({}, hearing, {
      numberOfGroupCases: 1000,
      prosecutionCaseSummaries: [
        {
          ...hearing.prosecutionCaseSummaries[0],
          isGroupMaster: true
        },
        {
          ...hearing.prosecutionCaseSummaries[0]
        }
      ]
    });

    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  it('should render first defendant name plus 2 others', () => {
    const threeDefendantHearing = Object.assign({}, hearing, {
      defendants: [defendantOne, defendantTwo, defendantThree]
    });
    fixture.componentInstance.hearing = threeDefendantHearing;
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should return the right sequence number for a date', () => {
    const threeDefendantHearing = Object.assign({}, hearing, {
      defendants: [defendantOne, defendantTwo, defendantThree]
    });

    const component = new HearingSummaryItemComponent();
    component.hearing = threeDefendantHearing;
    component.selectedHearingDate = '2018-10-18';

    expect(component.hearingSequenceNumber).toBe(1);
  });

  it('should return true if there are shared results for that specific day', () => {
    fixture.componentInstance.hearing = hearing;
    hearing.hearingDays[0] = {
      ...hearing.hearingDays[0],
      hasSharedResults: true
    };

    const component = new HearingSummaryItemComponent();
    component.hearing = hearing;
    component.selectedHearingDate = '2018-10-18';

    expect(component.hasSharedResults()).toBe(true);
  });

  describe('#bulkCaseOffenceTitle', () => {
    it('should return expected bulk case offence title', () => {
      const component = new HearingSummaryItemComponent();
      component.hearing = {
        ...hearing,
        prosecutionCaseSummaries: [{ ...hearing.prosecutionCaseSummaries[0], isGroupMaster: true }]
      };

      expect(component.bulkCaseOffenceTitle).toBe('Council tax liability');
    });

    it('should return empty string if hearing does not have a bulk case', () => {
      const component = new HearingSummaryItemComponent();
      component.hearing = {
        ...hearing,
        prosecutionCaseSummaries: [{ ...hearing.prosecutionCaseSummaries[0], isGroupMaster: false }]
      };

      expect(component.bulkCaseOffenceTitle).toBe('');
    });
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <hearing-summary-item [isActive]="isActive" [hearing]="hearing"> </hearing-summary-item>
  `,
  imports: [HearingSummaryItemComponent]
})
class TestHostComponent {
  isActive = true;
  hearing: HearingSummary = hearing;
}
