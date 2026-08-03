import { ChangeDetectionStrategy, Component, DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { applicationTypeMockOne, applicationTypeMockTwo } from '@cpp/reference-data';
import { ModalModule } from 'ngx-bootstrap/modal';
import { provideMockStore } from '@ngrx/store/testing';
import { AppConfigService } from '../../config';
import {
  DefendantCasesApplications,
  HearingDetail,
  IndicatedPlea,
  Offence,
  Plea,
  Verdict
} from '../../core';
import {
  BreachedApplication,
  DefendantBreachApplication
} from '../../core/model/breach-application';
import * as mockData from '../../core/selectors/mock/hearing.json';
import { mockCourtOrderOne, mockCourtOrders } from '../../mock-data/test-mock-data';
import { HearingResultsListComponent } from './hearing-results-list.component';
import { groupedCasesMock } from './mock/grouped-cases-mock';
import { casesAndApplicationsGroupedByDefendant } from './mock/hearing';

const hearingId = '4b9c55c-1805-4f5c-978c-54089e74f84a';

const mockHearing = (mockData as any).hearing as HearingDetail;

import moment from 'moment';

const dob = moment().subtract(20, 'y').format('YYYY-MM-DD');

describe('HearingResultsListComponent', () => {
  let component: HearingResultsListComponent;
  let testHostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let getBaseUrl: any;
  getBaseUrl = jest.fn();

  const offence = {
    id: '67673790-be56-4e6d-bfd9-b44694892dd0',
    wording:
      'on 01/08/2009 at  the County public house, unlawfully and maliciously wounded, John Smith',
    count: 1,
    offenceTitle: 'Wound / inflict grievous bodily harm without intent',
    offenceLegislation: 'Contrary to section 20 of the Offences Against the Person Act 1861.',
    plea: {
      pleaDate: '2018-07-27',
      pleaValue: 'NOT_GUILTY'
    } as Plea,
    indicatedPlea: {
      indicatedPleaDate: '2018-07-27',
      indicatedPleaValue: 'NOT_GUILTY'
    } as IndicatedPlea,
    verdict: {
      verdictType: {
        id: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
        sequence: 1,
        description: 'Found Not Guilty, Guilty of a lesser or alternative offence',
        category: 'Guilty',
        categoryType: 'NOT_GUILTY_BUT_GUILTY_OF_LESSER_OFFENCE_BY_JURY_CONVICTED',
        cjsVerdictCode: 'A'
      },
      jurors: {
        numberOfSplitJurors: 0,
        numberOfJurors: 12,
        unanimous: true
      },
      verdictDate: '2018-07-25'
    } as Verdict,
    convictionDate: '2018-07-25',
    allocationDecision: {
      allocationDecisionDate: '2018-07-25',
      motReasonDescription: 'No mode of Trial - Either way offence',
      courtIndicatedSentence: {
        courtIndicatedSentenceDescription: 'Test Sentence Indication'
      }
    }
  } as Offence;

  const nonUnanimousVerdictOffence = {
    verdict: {
      value: {
        category: 'Guilty but of lesser offence',
        categoryType: 'NOT_GUILTY_BUT_GUILTY_OF_LESSER_OFFENCE_BY_JURY_CONVICTED',
        lesserOffence: 'Wound / inflict grievous bodily harm without intent',
        code: 'A1',
        description: 'Not guilty but guilty of lesser/alternative offence not charged namely',
        id: '4fdfdb5c-1805-4f5c-978c-54089e796b67'
      },
      verdictDate: '2018-07-25',
      jurors: {
        numberOfSplitJurors: 2,
        numberOfJurors: 10,
        unanimous: false
      }
    }
  } as Offence;

  const noPleaOffence = {
    plea: {
      pleaDate: undefined,
      pleaValue: undefined
    }
  } as Offence;

  const noVerdictOffence = {
    verdict: {
      value: {}
    }
  } as Offence;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent, ModalModule.forRoot()],
      providers: [
        provideTranslateService(),
        { provide: AppConfigService, useValue: { getBaseUrl } },
        provideMockStore()
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(HearingResultsListComponent, {
        set: { changeDetection: ChangeDetectionStrategy.Default }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    testHostComponent = fixture.debugElement.componentInstance;
    testHostComponent.setInput(groupedCasesMock);
    fixture.detectChanges();
  });

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('onBreachFormSubmit should call emit', () => {
    const breachedApplications = <BreachedApplication[]>[
      {
        courtOrder: mockCourtOrderOne,
        applicationType: applicationTypeMockOne
      }
    ];
    const masterDefendantId = '67673790-be56-4e6d-bfd9-b44694892dd0';
    jest.spyOn(component.onBreachApplications, 'emit');
    component.onBreachFormSubmit(breachedApplications, masterDefendantId);
    expect(component.onBreachApplications.emit).toHaveBeenCalledWith(<DefendantBreachApplication>{
      hearingId,
      masterDefendantId,
      breachedApplications
    });
  });

  describe('#buildDvlaSearchParams', () => {
    const defendant = {
      prosecutionCases: [
        {
          id: 'prosecutionCases-id-1',
          prosecutionCaseIdentifier: {
            caseURN: 'caseURN'
          }
        }
      ],
      personDefendant: {
        personDetails: {
          address: {
            address1: '11 St Andrews',
            postcode: 'E1W 2TD'
          },
          dateOfBirth: dob,
          documentationLanguageNeeds: 'ENGLISH',
          firstName: 'Adam',
          gender: 'NOT_SPECIFIED',
          lastName: 'Smith'
        },
        driverNumber: 'CHREE232128302894'
      }
    } as DefendantCasesApplications;

    it('should format url to contain ALL defendant details', () => {
      const expectedUrl =
        `source=hearing&driverNumber=CHREE232128302894&firstNames=Adam&lastName=Smith&dateOfBirth=${dob}` +
        `&postcode=E1W%202TD&gender=NOT_SPECIFIED` +
        `&reasonType=ACE&reference=caseURN`;
      expect(component.buildDvlaSearchParams(defendant)).toEqual(expectedUrl);
    });

    it('should remove undefined defendant details', () => {
      defendant.personDefendant.driverNumber = undefined;
      const expectedUrl =
        `source=hearing&firstNames=Adam&lastName=Smith&dateOfBirth=${dob}` +
        `&postcode=E1W%202TD&gender=NOT_SPECIFIED` +
        `&reasonType=ACE&reference=caseURN`;
      expect(component.buildDvlaSearchParams(defendant)).toEqual(expectedUrl);
    });

    it('should return empty string if person defendants is undefined', () => {
      defendant.personDefendant.personDetails = undefined;
      expect(component.buildDvlaSearchParams(defendant)).toEqual('');
    });

    it('should return empty string if person defendant is undefined', () => {
      defendant.personDefendant = undefined;
      expect(component.buildDvlaSearchParams(defendant)).toEqual('');
    });
  });

  describe('#hasPlea', () => {
    it('should return true for an offence with a plea', () => {
      const hasPlea = component.hasPlea(offence);
      expect(hasPlea).toBeTruthy();
    });

    it('should return false for a offence with no plea', () => {
      const hasPlea = component.hasPlea(noPleaOffence);
      expect(hasPlea).toBeFalsy();
    });

    it('should return true for a offence with indicatedPlea is either INDICATED_NOT_GUILTY or NO_INDICATION ', () => {
      const currentOffence = {
        plea: {},
        indicatedPlea: {
          indicatedPleaValue: 'INDICATED_NOT_GUILTY'
        }
      } as Offence;
      const hasPlea = component.hasPlea(currentOffence);
      expect(hasPlea).toBe(false);
    });
  });

  describe('#hasAnyGuiltyPleasOrConvictionDates', () => {
    it('should return true for a defendant with a guity plea without a conviction date', () => {
      const copyOffence = {
        ...offence,
        convictionDate: undefined,
        indicatedPlea: {
          indicatedPleaDate: '2018-07-27',
          indicatedPleaValue: 'NOT_GUILTY'
        },
        plea: {
          pleaDate: '2018-07-27',
          pleaValue: 'GUILTY'
        }
      } as Offence;
      const defendant = {
        prosecutionCases: [
          {
            offences: [copyOffence]
          }
        ]
      } as DefendantCasesApplications;
      const hasAnyGuiltyPleasOrConvictionDates =
        component.hasAnyGuiltyPleasOrConvictionDates(defendant);
      expect(hasAnyGuiltyPleasOrConvictionDates).toEqual(true);
    });

    it('should return true for a defendant with a guilty indicated plea without a conviction date', () => {
      const copyOffence = {
        ...offence,
        convictionDate: undefined,
        indicatedPlea: {
          indicatedPleaDate: '2018-07-27',
          indicatedPleaValue: 'INDICATED_GUILTY'
        },
        plea: {
          pleaDate: '2018-07-27',
          pleaValue: 'NOT_GUILTY'
        }
      } as Offence;
      const defendant = {
        prosecutionCases: [
          {
            offences: [copyOffence]
          }
        ]
      } as DefendantCasesApplications;
      const hasAnyGuiltyPleasOrConvictionDates =
        component.hasAnyGuiltyPleasOrConvictionDates(defendant);
      expect(hasAnyGuiltyPleasOrConvictionDates).toEqual(true);
    });

    it('should return true for a defendant with a conviction date and no guilty indidated plea or guilty plea', () => {
      const copyOffence = {
        ...offence,
        convictionDate: '2018-07-27',
        indicatedPlea: {
          indicatedPleaDate: '2018-07-27',
          indicatedPleaValue: 'NOT_GUILTY'
        },
        plea: {
          pleaDate: '2018-07-27',
          pleaValue: 'NOT_GUILTY'
        }
      } as Offence;
      const defendant = {
        prosecutionCases: [
          {
            offences: [copyOffence]
          }
        ]
      } as DefendantCasesApplications;
      const hasAnyGuiltyPleasOrConvictionDates =
        component.hasAnyGuiltyPleasOrConvictionDates(defendant);
      expect(hasAnyGuiltyPleasOrConvictionDates).toEqual(true);
    });

    it('should return false for a defendant with no guilty plea and no conviction date', () => {
      const copyOffence = {
        ...offence,
        convictionDate: undefined,
        indicatedPlea: {
          indicatedPleaDate: '2018-07-27',
          indicatedPleaValue: 'NOT_GUILTY'
        },
        plea: {
          pleaDate: '2018-07-27',
          pleaValue: 'NOT_GUILTY'
        }
      } as Offence;
      const defendant = {
        prosecutionCases: [
          {
            offences: [copyOffence]
          }
        ]
      } as DefendantCasesApplications;
      const hasAnyGuiltyPleasOrConvictionDates =
        component.hasAnyGuiltyPleasOrConvictionDates(defendant);
      expect(hasAnyGuiltyPleasOrConvictionDates).toEqual(false);
    });
  });

  describe('#hasConvictionDate', () => {
    it('should return true for a defendant with a conviction date', () => {
      const offenceCopy = { ...offence, convictionDate: '2018-07-27' };
      const hasConvictionDate = component.hasConvictionDate(offenceCopy);
      expect(hasConvictionDate).toEqual(true);
    });

    it('should return false for a defendant with no conviction date', () => {
      const offenceCopy = { ...offence, convictionDate: undefined } as Offence;
      const hasConvictionDate = component.hasConvictionDate(offenceCopy);
      expect(hasConvictionDate).toEqual(false);
    });
  });

  describe('#hasVerdict', () => {
    it('should return true for an offence with a verdict', () => {
      const hasVerdict = component.hasVerdict(offence);
      expect(hasVerdict).toBeTruthy();
    });

    it('should return false for an offence with no verdict', () => {
      const hasVerdict = component.hasVerdict(noVerdictOffence);
      expect(hasVerdict).toBeFalsy();
    });
  });

  describe('#hasUnanimousVerdict', () => {
    it('should return true for a offence with an unanimous verdict', () => {
      const hasUnanimousVerdict = component.hasUnanimousVerdict(offence);
      expect(hasUnanimousVerdict).toBeTruthy();
    });

    it('should return false for a offence with a non unanimous verdict', () => {
      const hasUnanimousVerdict = component.hasUnanimousVerdict(nonUnanimousVerdictOffence);
      expect(hasUnanimousVerdict).toBeFalsy();
    });
  });

  describe('#hasMajorityVerdict', () => {
    it('should return true for a offence with a majority verdict', () => {
      const hasMajorityVerdict = component.hasMajorityVerdict(nonUnanimousVerdictOffence);
      expect(hasMajorityVerdict).toBeTruthy();
    });
  });

  describe('#hasVerdictDate', () => {
    it('should return true for an offence with a verdict date', () => {
      const hasVerdictDate = component.hasVerdictDate(offence);
      expect(hasVerdictDate).toBeTruthy();
    });
  });

  describe('#pleaDate', () => {
    it('should return pleaDate', () => {
      expect(component.pleaDate(offence)).toEqual(offence.plea.pleaDate);
    });
  });

  describe('#isVerdictTypeByJury', () => {
    it('should return if isVerdictTypeByJury', () => {
      expect(component.isVerdictTypeByJury(offence)).toBeTruthy();
    });
  });

  describe('#verdictDate', () => {
    it('should return the verdict date', () => {
      expect(component.verdictDate(offence)).toEqual(offence.verdict.verdictDate);
    });
  });

  describe('#numberOfJurors', () => {
    it('should return the number of jurors', () => {
      expect(component.numberOfJurors(offence)).toEqual(12);
    });
  });

  describe('#numberOfSplitJurors', () => {
    it('should return the number of split jurors', () => {
      expect(component.numberOfSplitJurors(offence)).toEqual(
        offence.verdict.jurors.numberOfSplitJurors
      );
    });
  });

  describe('#isVerdictLesserOffence', () => {
    it('should return if it is a verdict of lesser offience', () => {
      component.verdictTypes = [
        {
          id: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
          sequence: 1,
          description: 'Found Not Guilty, Guilty of a lesser or alternative offence',
          category: 'Guilty',
          categoryType: 'NOT_GUILTY_BUT_GUILTY_OF_LESSER_OFFENCE_BY_JURY_CONVICTED',
          cjsVerdictCode: 'A'
        }
      ];
      expect(
        component.isVerdictLesserOrAlternativeOffence(offence.verdict.verdictType.id)
      ).toBeTruthy();
    });
  });

  describe('#convictionDate', () => {
    it('should return the conviction date', () => {
      expect(component.convictionDate(offence)).toEqual(offence.convictionDate);
    });
  });

  describe('#hasConvictionDatePlea', () => {
    it('should return if the offence has conviction date', () => {
      expect(component.hasConvictionDatePlea(offence)).toBeFalsy();
    });
  });

  describe('#hasGuiltyPlea', () => {
    it('should return false if the offence has not guilty plea', () => {
      expect(component.hasGuiltyPlea(offence)).toBeFalsy();
    });

    it('should return false if the offence has other types of not guilty plea', () => {
      const notGuiltyOffence = {
        ...offence,
        plea: { ...offence.plea, pleaValue: 'UNFIT_TO_PLEAD' }
      };
      expect(component.hasGuiltyPlea(notGuiltyOffence)).toBeFalsy();
    });

    it('should return true if the offence has guilty plea', () => {
      const guiltyOffence = { ...offence, plea: { ...offence.plea, pleaValue: 'GUILTY' } };
      expect(component.hasGuiltyPlea(guiltyOffence)).toBeTruthy();
    });

    it('should return true if the offence has other types of guilty plea', () => {
      const guiltyOffence = { ...offence, plea: { ...offence.plea, pleaValue: 'MCA_GUILTY' } };
      expect(component.hasGuiltyPlea(guiltyOffence)).toBeTruthy();
    });

    it('should return true if the offence has guilty indicated plea', () => {
      const guiltyOffence = {
        ...offence,
        indicatedPlea: { indicatedPleaValue: 'INDICATED_GUILTY' }
      } as Offence;
      expect(component.hasGuiltyPlea(guiltyOffence)).toBeTruthy();
    });
  });

  describe('#allocationDecision', () => {
    let hearingResultsListDe: DebugElement;
    beforeAll(() => {
      hearingResultsListDe = fixture.debugElement;
    });

    it('should return the allocation decision description', () => {
      const allocationDecisionDescription: HTMLElement = hearingResultsListDe.query(
        By.css('.allocation-decision')
      ).nativeElement;

      expect(allocationDecisionDescription.textContent.trim()).toBe(
        'No mode of Trial - Either way offence'
      );
    });

    it('should return the allocation decision date', () => {
      const allocationDecisionDate: HTMLElement = hearingResultsListDe.query(
        By.css('.date-message')
      ).nativeElement;
      expect(allocationDecisionDate.textContent.trim()).toMatch(/28 December 2018/);
    });

    it('should return the sentencing decision description', () => {
      const sentencingDecision: HTMLElement = hearingResultsListDe.query(
        By.css('.sentencing-decision')
      ).nativeElement;
      expect(sentencingDecision.textContent.trim()).toBe('Test Sentence Indication');
    });
  });

  describe('#hasBulkCase', () => {
    it('should return true when defendant has a bulk case', () => {
      const defendantCases = {
        ...casesAndApplicationsGroupedByDefendant[0],
        prosecutionCases: [
          { ...casesAndApplicationsGroupedByDefendant[0].prosecutionCases[0], isGroupMaster: true }
        ]
      };
      expect(component.hasBulkCase(defendantCases)).toBeTruthy();
    });

    it('should return false when a defendant does not have a bulk case', () => {
      const defendantCases = {
        ...casesAndApplicationsGroupedByDefendant[0]
      };
      expect(component.hasBulkCase(defendantCases)).toBeFalsy();
    });
  });

  describe('defendant-level warning rendering (DD-42868)', () => {
    const MASTER_DEFENDANT_ID = 'master-1';
    const CASE_DEFENDANT_ID = 'def-1';
    const OTHER_MASTER_DEFENDANT_ID = 'master-2';
    const RULE_ID = 'DR-FOO-001';
    const WARNING_MESSAGE = 'a defendant-level warning';

    const groupedDefendant = (id: string, masterDefendantId: string) => ({
      ...groupedCasesMock[0],
      id,
      masterDefendantId
    });

    it('should key the defendant-level warning by masterDefendantId when the grouped id differs', () => {
      testHostComponent.setInput([groupedDefendant(CASE_DEFENDANT_ID, MASTER_DEFENDANT_ID)]);
      component.defendantLevelWarningMessages = new Map([
        [MASTER_DEFENDANT_ID, [{ ruleId: RULE_ID, message: WARNING_MESSAGE }]]
      ]);
      fixture.detectChanges();

      const warningEl = fixture.debugElement.query(
        By.css(`[data-test-id="defendantLevelWarning-${MASTER_DEFENDANT_ID}-${RULE_ID}"]`)
      );

      expect(warningEl).toBeTruthy();
      expect(warningEl.nativeElement.textContent.trim()).toContain(WARNING_MESSAGE);
    });

    it('should not render a defendant-level warning when no message matches the masterDefendantId', () => {
      testHostComponent.setInput([groupedDefendant(CASE_DEFENDANT_ID, MASTER_DEFENDANT_ID)]);
      component.defendantLevelWarningMessages = new Map([
        ['unmatched-master', [{ ruleId: RULE_ID, message: WARNING_MESSAGE }]]
      ]);
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css(`[data-test-id^="defendantLevelWarning-"]`))
      ).toBeNull();
    });

    it('should key each grouped defendant independently by its own masterDefendantId', () => {
      testHostComponent.setInput([
        groupedDefendant(CASE_DEFENDANT_ID, MASTER_DEFENDANT_ID),
        groupedDefendant(OTHER_MASTER_DEFENDANT_ID, OTHER_MASTER_DEFENDANT_ID)
      ]);
      component.defendantLevelWarningMessages = new Map([
        [MASTER_DEFENDANT_ID, [{ ruleId: RULE_ID, message: WARNING_MESSAGE }]],
        [OTHER_MASTER_DEFENDANT_ID, [{ ruleId: RULE_ID, message: WARNING_MESSAGE }]]
      ]);
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(
          By.css(`[data-test-id="defendantLevelWarning-${MASTER_DEFENDANT_ID}-${RULE_ID}"]`)
        )
      ).toBeTruthy();
      expect(
        fixture.debugElement.query(
          By.css(`[data-test-id="defendantLevelWarning-${OTHER_MASTER_DEFENDANT_ID}-${RULE_ID}"]`)
        )
      ).toBeTruthy();
      expect(
        fixture.debugElement.query(
          By.css(`[data-test-id="defendantLevelWarning-${CASE_DEFENDANT_ID}-${RULE_ID}"]`)
        )
      ).toBeNull();
    });
  });

  describe('#onYouthBoxSelected', () => {
    it('should emit onYouthCourtToggle event when defendant has no bulk case', () => {
      const defendantCases = {
        ...casesAndApplicationsGroupedByDefendant[0]
      };
      const onYouthCourtToggleSpy = jest.spyOn(component.onYouthCourtToggle, 'emit');

      component.onYouthBoxSelected(defendantCases);

      expect(onYouthCourtToggleSpy).toBeCalledWith(casesAndApplicationsGroupedByDefendant[0].id);
    });

    it('should not emit onYouthCourtToggle event when defendant has a bulk case', () => {
      const defendantCases = {
        ...casesAndApplicationsGroupedByDefendant[0],
        prosecutionCases: [
          { ...casesAndApplicationsGroupedByDefendant[0].prosecutionCases[0], isGroupMaster: true }
        ]
      };
      const onYouthCourtToggleSpy = jest.spyOn(component.onYouthCourtToggle, 'emit');

      component.onYouthBoxSelected(defendantCases);

      expect(onYouthCourtToggleSpy).not.toBeCalled();
    });
  });
});

@Component({
  template: `
    <hearing-results-list
      [hearing]="mockHearing"
      [hearingId]="hearingId"
      [selectedHearingDate]="'2020-02-13'"
      [todayDefendantsAttendance]="['2020-02-13']"
      [guiltyPleasValues]="guiltyPleasValues"
      [pleasMapping]="pleasMapping"
      [casesAndApplicationsGroupedByDefendant]="casesAndApplicationsGroupedByDefendant"
      [activeCourtOrders]="activeCourtOrders"
      [breachTypes]="breachTypes"
    >
    </hearing-results-list>
  `,
  imports: [HearingResultsListComponent]
})
class TestHostComponent {
  mockHearing = mockHearing;
  hearingId = hearingId;

  casesAndApplicationsGroupedByDefendant = casesAndApplicationsGroupedByDefendant;
  guiltyPleasValues: string[];
  pleasMapping: { [key: string]: string };
  activeCourtOrders = { '95fb6e57-49f9-4bf8-b93d-12a95d92846d': mockCourtOrders };
  breachTypes = [applicationTypeMockOne, applicationTypeMockTwo];

  setInput(otherInput: any) {
    this.casesAndApplicationsGroupedByDefendant = otherInput;
    this.guiltyPleasValues = ['GUILTY', 'MCA_GUILTY', 'AUTREFOIS_CONVICT', 'CONSENTS'];
    this.pleasMapping = {
      GUILTY: 'Guilty',
      NOT_GUILTY: 'Not Guilty',
      NOTIFIED_GUILTY: 'Guilty',
      NOTIFIED_NOT_GUILTY: 'Not Guilty',
      INDICATED_GUILTY: 'Indicated Guilty',
      MCA_GUILTY: 'MCA Guilty',
      AUTREFOIS_CONVICT: 'Autorefois Convict',
      CHANGE_TO_GUILTY_AFTER_SWORN_IN: 'Change of Plea: Not Guilty to Guilty (After Jury sworn in)',
      CHANGE_TO_GUILTY_NO_SWORN_IN: 'Change of Plea: Not Guilty to Guilty (No Jury sworn in)',
      CHANGE_TO_GUILTY_MAGISTRATES_COURT:
        'Change of Plea: Not Guilty to Guilty  (Magistrates Court)',
      CONSENTS: 'Consents',
      UNFIT_TO_PLEAD: 'Unfit To Plead',
      AUTREFOIS_ACQUIT: 'Autrefois Acquit',
      OPPOSES: 'Opposes',
      NO_PLEA: 'No plea',
      CHANGE_TO_NOT_GUILTY: 'Change of Plea: Guilty to not Guilty',
      PARDON: 'Pardon'
    };
  }
}
