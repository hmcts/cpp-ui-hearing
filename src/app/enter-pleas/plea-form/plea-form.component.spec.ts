import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { GroupedPlea, PleaOption } from '../../core';
import * as mockData from '../../core/selectors/mock/hearing.json';
import { PleaFormComponent } from './plea-form.component';
import { provideRouter } from '@angular/router';
import { SelectOption } from '../../core';

const pleas: GroupedPlea[] = (mockData as any).groupedPleas as GroupedPlea[];
const mockDefendant = pleas[0].withoutCount[0];
const mockOffence = mockDefendant.offences[0];

describe('PleaFormComponent', () => {
  let component: PleaFormComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), provideRouter([])],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  }));

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should fire an event when invoked', fakeAsync(() => {
    const defendant = { ...mockDefendant };
    const offence = { ...mockOffence };

    mockOffence.plea.pleaValue = 'GUILTY';
    component.updatePlea({ defendant, offence });
    expect(mockOffence.plea.pleaValue).toEqual(mockDefendant.offences[0].plea.pleaValue);
    // we do it twice on purpose to double check the value gets overriden and not duplicated
    component.updatePlea({ defendant, offence });
    expect(mockOffence.plea.pleaValue).toEqual(mockDefendant.offences[0].plea.pleaValue);
  }));

  it('should get data for eitherWayOffence', fakeAsync(() => {
    const offence = {
      ...mockDefendant.offences[0],
      modeOfTrial: 'Either Way',
      plea: {
        ...mockDefendant.offences[0].plea,
        pleaDate: '20-2-2019',
        pleaValue: 'NOT_GUILTY'
      },
      allocationDecision: {
        ...mockDefendant.offences[0].allocationDecision,
        allocationDecisionDate: '20-2-2019',
        courtIndicatedSentence: {
          courtIndicatedSentenceTypeId: ':courtIndicatedSentenceId'
        }
      }
    };

    component.hearingType = 'MAGISTRATES';
    component.updatePlea({ defendant: mockDefendant, offence });
    expect(component.pleaData).toEqual([
      {
        allocationDecision: {
          allocationDecisionDate: '20-2-2019',
          courtIndicatedSentence: {
            courtIndicatedSentenceTypeId: ':courtIndicatedSentenceId'
          },
          motReasonCode: '01',
          motReasonDescription: 'Summary-only offence',
          motReasonId: 'b8c37e33-defd-351c-b91e-1e03e51657da',
          offenceId: 'bf57f1f5-9ca8-4e21-a902-cb53c106f13d',
          originatingHearingId: '72b64fc6-a1de-40f3-8751-dee9606ba05a',
          sequenceNumber: 90
        },
        defendantId: 'f6592eac-414d-4304-bf36-59be4e26999a',
        indicatedPlea: {
          indicatedPleaDate: null,
          source: 'IN_COURT'
        },
        offenceId: 'bf57f1f5-9ca8-4e21-a902-cb53c106f13d',
        plea: {
          delegatedPowers: undefined,
          offenceId: 'bf57f1f5-9ca8-4e21-a902-cb53c106f13d',
          originatingHearingId: '72b64fc6-a1de-40f3-8751-dee9606ba05a',
          pleaDate: '20-2-2019',
          pleaValue: 'NOT_GUILTY'
        },
        prosecutionCaseId: '1b12c7f7-eaef-40ce-acb3-04f2b4aec8c6'
      }
    ]);
  }));

  it('should get data for Indictable offences when defendant is youth', fakeAsync(() => {
    const defendant = {
      ...mockDefendant,
      isYouth: true,
      offences: [
        {
          ...mockDefendant.offences[0],
          modeOfTrial: 'Indictable',
          plea: {
            ...mockDefendant.offences[0].plea,
            pleaValue: 'GUILTY',
            pleaDate: '20-2-2019'
          },
          allocationDecision: {
            ...mockDefendant.offences[0].allocationDecision,
            allocationDecisionDate: '20-2-2019',
            courtIndicatedSentence: {
              courtIndicatedSentenceTypeId: ':courtIndicatedSentenceId'
            }
          }
        }
      ]
    };

    component.hearingType = 'MAGISTRATES';
    component.updatePlea({ defendant, offence: defendant.offences[0] });
    expect(component.pleaData).toEqual([
      {
        allocationDecision: {
          allocationDecisionDate: '20-2-2019',
          courtIndicatedSentence: {
            courtIndicatedSentenceTypeId: ':courtIndicatedSentenceId'
          },
          motReasonCode: '01',
          motReasonDescription: 'Summary-only offence',
          motReasonId: 'b8c37e33-defd-351c-b91e-1e03e51657da',
          offenceId: 'bf57f1f5-9ca8-4e21-a902-cb53c106f13d',
          originatingHearingId: '72b64fc6-a1de-40f3-8751-dee9606ba05a',
          sequenceNumber: 90
        },
        defendantId: 'f6592eac-414d-4304-bf36-59be4e26999a',
        indicatedPlea: {
          indicatedPleaDate: null,
          source: 'IN_COURT'
        },
        offenceId: 'bf57f1f5-9ca8-4e21-a902-cb53c106f13d',
        plea: {
          delegatedPowers: undefined,

          offenceId: 'bf57f1f5-9ca8-4e21-a902-cb53c106f13d',
          originatingHearingId: '72b64fc6-a1de-40f3-8751-dee9606ba05a',
          pleaDate: '20-2-2019',
          pleaValue: 'GUILTY'
        },
        prosecutionCaseId: '1b12c7f7-eaef-40ce-acb3-04f2b4aec8c6'
      }
    ]);
  }));
});

@Component({
  template: `
    <plea-form
      [motReasonOptions]="mockMotOptions"
      [pleas]="mockPleas"
      [selectedHearingDate]="selectedHearingDate"
      [hasCivilCase]="true"
      [civilCasePleaOptions]="civilCasePleaOptions"
    ></plea-form>
  `,
  imports: [PleaFormComponent]
})
class TestHostComponent {
  pleaData: [];
  mockPlea: GroupedPlea[];
  mockMotOptions: SelectOption[];
  civilCasePleaOptions: PleaOption[];
  selectedHearingDate: string;
  constructor() {
    this.selectedHearingDate = '20-2-2019';
    this.pleaData = [];
    this.mockPlea = pleas;
    this.mockMotOptions = [
      {
        id: ':motReasonId',
        value: '02',
        label: ':motReasonDescription',
        sequenceNumber: 90
      },
      {
        id: ':motReasonId1',
        value: '01',
        label: ':motReasonDescription1',
        sequenceNumber: 10
      }
    ];
    this.civilCasePleaOptions = [
      {
        value: '02',
        label: 'civilcase-label'
      }
    ];
  }
}
