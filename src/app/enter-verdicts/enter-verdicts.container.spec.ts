import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideStore } from '@ngrx/store';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import {
  reducers,
  HearingDetail,
  GroupedPlea,
  VerdictType,
  HearingLockState,
  AppState,
  storeDefendantVerdictData,
  UpdateVerdictData,
  UpdateVerdictAction
} from '../core';
import { ProsecutionCaseDetails } from '../core/model/shared/prosecution-case-details';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ValidationError } from '@cpp/pdk';
import * as mockData from '../core/selectors/mock/hearing.json';
import { EnterVerdictsContainer } from './enter-verdicts.container';
import { PleaType } from '@cpp/reference-data';
import { VerdictFormComponent } from './verdicts-form/verdict-form.component';

const pleaTypes = ({ ...mockData } as any).pleaTypes as PleaType[];
const updateVedictData = [
  {
    defendantId: ':defendantId1',
    offenceId: ':offence1',
    prosecutionCaseId: ':prosecutionCaseId1',
    verdict: {
      jurors: {
        numberOfJurors: 3,
        numberOfSplitJurors: 1,
        unanimous: false
      },
      lesserOrAlternativeOffence: {
        offenceTitle: ':offenceTitle',
        offenceDefinitionId: ':offenceDefinition',
        offenceLegislation: ':offenceLegislation'
      },
      originatingHearingId: ':originatingHearingId',
      offenceId: ':offence1',
      verdictDate: '2024-11-07',
      verdictType: {
        id: ':verdictType',
        category: ':category',
        categoryType: ':categoryType'
      },
      isDeleted: true
    }
  }
] as UpdateVerdictData[];

describe('EnterVerdictsContainer', () => {
  let component: EnterVerdictsContainer;
  let fixture: ComponentFixture<EnterVerdictsContainer>;

  let navigate: jest.Mock;
  let scroll: jest.Mock;
  let store: MockStore<AppState>;

  const nonBulkCase = {
    prosecutionCaseIdentifier: {
      caseURN: 'URN'
    },
    isCivil: true,
    defendants: [
      {
        masterDefendantId: 'defendant1',
        personDefendant: {
          personDetails: {
            firstName: 'James',
            lastName: 'Gray'
          }
        },
        offences: [
          {
            id: ':id',
            offenceDefinitionId: 'offenceDefinitionId',
            offenceCode: 'OFF123',
            offenceTitle: 'offenceTitle',
            offenceLegislation: 'offenceLegislation',
            wording: 'No Travel Card',
            plea: {
              pleaValue: 'NOT_GUILTY'
            },
            verdict: {
              offenceId: ':id',
              originatingHearingId: ':originatingHearingId',
              verdictType: {
                id: ':verdictType',
                category: ':category',
                categoryType: ':categoryType',
                description: 'Found Not Guilty, Guilty of a lesser or alternative offernce'
              },
              lesserOrAlternativeOffence: {
                offenceDefinitionId: ':offenceDefinition',
                offenceCode: ':offenceCode',
                offenceTitle: ':offenceTitle',
                offenceLegislation: ':offenceLegislation'
              },
              isDeleted: false,
              jurors: {
                numberOfJurors: 3,
                numberOfSplitJurors: 1,
                unanimous: false
              }
            }
          }
        ]
      }
    ]
  } as ProsecutionCaseDetails;

  const bulkCase = {
    prosecutionCaseIdentifier: {
      caseURN: 'URN2'
    },
    isGroupMaster: true,
    isCivil: true,
    defendants: [
      {
        masterDefendantId: 'defendant2',
        personDefendant: {
          personDetails: {
            firstName: 'David',
            lastName: 'Black'
          }
        },
        offences: [
          {
            offenceDefinitionId: 'offence1',
            offenceCode: 'OFF123',
            wording: 'No Travel Card',
            plea: {
              pleaValue: 'NOT_GUILTY'
            }
          }
        ]
      }
    ]
  } as ProsecutionCaseDetails;

  const initialState = {
    usersGroups: {
      userGroups: [],
      userServices: []
    },
    referenceData: {
      pleaStatusTypes: pleaTypes
    },
    hearings: {
      selectedHearingDate: '2020-06-03',
      current: {
        hearing: {
          jurisdictionType: 'CROWN',
          prosecutionCases: [nonBulkCase, bulkCase],
          hearingDays: [
            {
              listedDurationMinutes: 30,
              listingSequence: 100,
              sittingDay: '2018-10-17T12:00:00.000Z'
            }
          ]
        } as HearingDetail,
        hearingState: HearingLockState.INITIALISED
      }
    },
    hearingReferenceData: {
      verdictTypes: [
        {
          jurisdiction: 'CROWN',
          description: 'Crown court verdict'
        } as VerdictType,
        {
          jurisdiction: 'MAGISTRATES',
          description: 'Magistrates court verdict'
        } as VerdictType
      ]
    }
  } as AppState;

  beforeEach(waitForAsync(() => {
    navigate = jest.fn().mockImplementation(() => new Promise<void>(resolve => resolve()));
    scroll = jest.fn();

    TestBed.configureTestingModule({
      imports: [EnterVerdictsContainer],
      providers: [
        provideTranslateService(),
        provideStore(reducers, { runtimeChecks: {} }),
        provideMockStore({ initialState }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                hearingId: ':hearingId'
              }
            }
          }
        },
        { provide: 'Window', useValue: { scroll } },
        { provide: Router, useValue: { navigate } }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(EnterVerdictsContainer, {
        remove: {
          imports: [VerdictFormComponent]
        },
        add: {
          imports: [TestVerdictFormComponent]
        }
      })
      .compileComponents();
    fixture = TestBed.createComponent(EnterVerdictsContainer);
    store = TestBed.inject(MockStore);
    component = fixture.componentInstance;
    fixture.detectChanges();
    jest.spyOn(store, 'dispatch');
  }));

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('verdictSubmit', () => {
    it('should not dispatch the action if changedOffenceIds is empty and it should navigate to manage hearing', () => {
      fixture.debugElement
        .query(By.directive(TestVerdictFormComponent))
        .componentInstance.onSubmit.emit([]);
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/manage', ':hearingId']);
    });
  });

  it('should dispatch the action with the correct payload for update verdict', () => {
    fixture.debugElement
      .query(By.directive(TestVerdictFormComponent))
      .componentInstance.onSubmit.emit([':id']);
    expect(store.dispatch).toHaveBeenCalledWith(
      new UpdateVerdictAction({
        hearingId: ':hearingId',
        verdict: {
          verdicts: [
            {
              applicationId: undefined,
              offenceId: ':id',
              jurors: {
                numberOfJurors: 3,
                numberOfSplitJurors: 1,
                unanimous: false
              },
              lesserOrAlternativeOffence: {
                offenceTitle: ':offenceTitle',
                offenceDefinitionId: ':offenceDefinition',
                offenceLegislation: ':offenceLegislation',
                offenceCode: ':offenceCode'
              },
              originatingHearingId: ':originatingHearingId',
              verdictDate: '2020-06-03',
              verdictType: {
                category: ':category',
                categoryType: ':categoryType',
                id: ':verdictType'
              },
              isDeleted: false
            }
          ]
        }
      })
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should invoke updateError', () => {
    fixture.debugElement
      .query(By.directive(TestVerdictFormComponent))
      .componentInstance.onError.emit([
        {
          id: ':id',
          message: 'Something wrong'
        }
      ]);
    expect(component.errors).toEqual([
      {
        id: ':id',
        message: 'Something wrong'
      }
    ]);
    expect(scroll).toHaveBeenCalledWith(0, 0);
  });

  describe('Update Verdict', () => {
    it('should dispatch the action with the correct payload for clear verdict', () => {
      fixture.debugElement
        .query(By.directive(TestVerdictFormComponent))
        .componentInstance.updateVerdictData.emit(updateVedictData);
      expect(store.dispatch).toHaveBeenCalledWith(
        storeDefendantVerdictData({ verdictData: updateVedictData })
      );
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});

@Component({
  selector: 'verdict-form',
  template: `
    <div>
      <div>Hearing type: {{ hearingType }}</div>
      <div>Is verdicts page available: {{ isVerdictsPageAvailable }}</div>
      <div>Pleas: {{ pleas | json }}</div>
      <div>All verdict types: {{ allVerdictTypes | json }}</div>
      <div>
        Verdict types for hearing jurisdiction: {{ verdictTypesForHearingJurisdiction | json }}
      </div>
      <div>Civil cases: {{ hasCivilCase | json }}</div>
    </div>
  `,
  imports: [CommonModule]
})
class TestVerdictFormComponent {
  @Input() hearingType: string;
  @Input() pleas: GroupedPlea;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() allVerdictTypes: VerdictType[];
  @Input() verdictTypesForHearingJurisdiction: VerdictType[];
  @Input() hasCivilCase: boolean;
  @Input() currentHearingDetail: HearingDetail;
  @Output() onError = new EventEmitter<ValidationError[]>();
  @Output() onSubmit = new EventEmitter<any>();
  @Output() updateVerdictData: EventEmitter<UpdateVerdictData[]> = new EventEmitter();
  @Output() updateDefendantOffenceData = new EventEmitter<any>();
  @Output() cancelVerdict = new EventEmitter<void>();
}
