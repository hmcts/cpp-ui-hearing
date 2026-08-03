import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { Defendant, HearingDetail, Offence, ReferenceDataOffenceService } from '../../../core';
import { VerdictComponent } from './verdict.component';
import { keys } from 'lodash-es';
import { LinkType } from '@cpp/reference-data';

let mockValue: any;

const mockPleas = require('../../mock-data/mock-pleas.json');
const mockVerdictTypes = require('../../mock-data/mock-verdict-types.json');

const plea = mockPleas[0];
const offenceDefinitionId = keys(plea.defendantsByOffence)[0];
const mockDefendant = plea.defendantsByOffence[offenceDefinitionId].defendants[0];
const mockOffence = mockDefendant.offences[0];
const allVerdictTypes = [
  {
    id: '7e2f843e-d639-40b3-8611-8015f3a18951',
    description: 'Found guilty',
    category: 'Guilty',
    categoryType: 'GUILTY',
    sequence: 1,
    jurisdiction: 'MAGISTRATES'
  },
  {
    id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c',
    description: 'Autrefois acquit',
    category: 'No verdict',
    categoryType: 'NO_VERDICT',
    sequence: 2,
    jurisdiction: 'CROWN'
  }
];

const mockHearing = {
  id: 'hearingId',
  jurisdictionType: 'MAGISTRATES',
  prosecutionCases: [
    {
      id: 'caseId',
      prosecutionCaseIdentifier: {
        prosecutionAuthorityReference: 'CASE_URN'
      },
      defendants: [
        {
          id: 'defendantId',
          masterDefendantId: 'masterDefendantId',
          legalEntityDefendant: {
            organisation: {
              name: 'HMCTS'
            }
          },
          offences: [
            {
              id: 'offenceId1',
              offenceTitle: 'Robbery',
              wording: 'Stolen diamonds'
            },
            {
              id: 'offenceId2',
              offenceTitle: 'Attempted Robbery',
              wording: 'Attempted to steal emeralds'
            }
          ]
        }
      ]
    }
  ],
  courtApplications: [
    {
      id: 'applicationId',
      subject: {
        masterDefendant: {
          masterDefendantId: 'masterDefendantId',
          defendantCase: [
            {
              caseId: 'caseId',
              defendantId: 'defendantId'
            }
          ]
        },
        personDetails: {
          firstName: 'James',
          lastName: 'Gray'
        }
      },
      type: {
        type: 'Application for witness summons',
        linkType: LinkType.LINKED
      },
      courtApplicationCases: [
        {
          prosecutionCaseId: 'caseId',
          prosecutionCaseIdentifier: {
            prosecutionAuthorityReference: 'CASE_URN'
          }
        }
      ]
    }
  ]
} as HearingDetail;

let searchOffenceTypes: jest.Mock;

describe('VerdictComponent', () => {
  let component: VerdictComponent;
  let verdictComponent: VerdictComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  searchOffenceTypes = jest.fn();

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        {
          provide: ReferenceDataOffenceService,
          useValue: {
            searchOffenceTypes
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    verdictComponent = fixture.debugElement.queryAll(By.css('verdict'))[0].componentInstance;
    fixture.detectChanges();

    const judgesAutoSuggestEl = fixture.debugElement.queryAll(By.css('pdk-autosuggest input'));
    judgesAutoSuggestEl.forEach(element => (element.nativeElement.name = 'stubbed-name'));
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should fire an event when invoked', fakeAsync(() => {
    const offence = plea.defendantsByOffence[offenceDefinitionId].defendants[0].offences[0];
    const defendant = plea.defendantsByOffence[offenceDefinitionId].defendants[0];
    const radioInput = fixture.debugElement.queryAll(By.css('pdk-radio-button input'))[0];
    radioInput.nativeElement.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    tick();
    expect(mockValue).toEqual({
      offence,
      defendant: defendant
    });
  }));

  it('should return return the defendant of that offence', () => {
    verdictComponent.onJurorsSelect(
      plea.defendantsByOffence[offenceDefinitionId].defendants[0].offences[0]
    );
    expect(mockValue).toEqual({
      offence: plea.defendantsByOffence[offenceDefinitionId].defendants[0].offences[0],
      defendant: plea.defendantsByOffence[offenceDefinitionId].defendants[0]
    });
  });

  it('should toggle the values of which defendants are open', () => {
    expect(verdictComponent.open['123']).toEqual(undefined);
    verdictComponent.toggleOtherVerdicts('123');
    expect(verdictComponent.open['123']).toEqual(true);
    verdictComponent.toggleOtherVerdicts('123');
    expect(verdictComponent.open['123']).toEqual(false);
  });

  it('should filter the options to show', () => {
    expect(verdictComponent.filterOptions('', false, false)).toEqual([
      verdictComponent.selectableOptions[0]
    ]);
    expect(verdictComponent.filterOptions('', false, true)).toEqual(
      verdictComponent.selectableOptions
    );
    expect(verdictComponent.filterOptions(mockVerdictTypes[0].id, false, false)).toEqual([
      verdictComponent.allOptions[0]
    ]);
  });

  it('should return civil case filter options', () => {
    component.hasCivilCase = true;
    fixture.detectChanges();
    expect(verdictComponent.filterOptions('', false, false)).toEqual([
      verdictComponent.selectableOptions[0]
    ]);
  });

  it('should display Show other verdicts types link if the verdict type belongs same jurisdictionType  as hearing', () => {
    const offence = {
      verdict: {
        jurors: {
          numberOfSplitJurors: 1
        },
        verdictType: {
          categoryType: 'GUILTY',
          category: 'Guilty',
          id: '7e2f843e-d639-40b3-8611-8015f3a18951' // verdict type belongs to MAGS COURT
        }
      }
    } as Offence;
    verdictComponent.currentHearingDetail = mockHearing;
    verdictComponent.allVerdictTypes = allVerdictTypes;
    verdictComponent.offence = offence;
    fixture.detectChanges();

    expect(verdictComponent.canChangeVerdict(offence)).toEqual(true);
    const showOtherVerdictsLink = fixture.debugElement.query(
      By.css('[data-test-id="show-other-verdict-types"]')
    );
    expect(showOtherVerdictsLink).toBeTruthy();
  });

  it('should not display Show other verdicts types link if the verdict type not belongs to same jurisdictionType  as hearing', () => {
    const offence = {
      verdict: {
        jurors: {
          numberOfSplitJurors: 1
        },
        verdictType: {
          categoryType: 'GUILTY',
          category: 'Guilty',
          id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c' // verdict type belongs to CROWN COURT
        }
      }
    } as Offence;
    verdictComponent.currentHearingDetail = mockHearing;
    verdictComponent.allVerdictTypes = allVerdictTypes;
    verdictComponent.offence = offence;
    fixture.detectChanges();

    expect(verdictComponent.canChangeVerdict(offence)).toEqual(false);
    const showOtherVerdictsLink = fixture.debugElement.query(
      By.css('[data-test-id="show-other-verdict-types"]')
    );
    expect(showOtherVerdictsLink).toBeDefined();
  });
});

@Component({
  template: `
    <form
      #form="ngForm"
      pdk-form
      (errors)="errors = $event"
      (validSubmit)="onSubmit(form.value)"
      novalidate
    >
      <verdict
        [offence]="offence"
        [defendant]="defendant"
        (updateVerdict)="updateVerdict($event)"
        [allVerdictTypes]="allVerdictTypes"
        [verdictTypesForHearingJurisdiction]="verdictTypesForHearingJurisdiction"
        [currentHearingDetail]="currentHearingDetail"
      ></verdict>
      <button pdk-button type="submit">Save and continue</button>
    </form>
  `,
  imports: [VerdictComponent, FormsModule]
})
class TestHostComponent {
  offence: Offence;
  defendant: Defendant;
  allVerdictTypes = mockVerdictTypes;
  verdictTypesForHearingJurisdiction = mockVerdictTypes;
  offencesCodes = [{ value: '1', label: 'test 1' }];
  currentHearingDetail = mockHearing;
  constructor() {
    this.offence = mockOffence;
    this.defendant = mockDefendant;
  }
  updateVerdict($event: any) {
    mockValue = $event;
  }
}
