import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { EnterPleasContainer } from './enter-pleas.container';
import { DelegatedPowersComponent } from '../shared/components/delegated-powers/delegated-powers.component';
import mockData from '../core/selectors/mock/hearing.json';
import {
  AlcoholLevelMethod,
  ApplyDecisionAction,
  ApplyDecisionPayload,
  AppState,
  Defendant,
  GroupedPlea,
  HearingDetail,
  HearingLockState,
  Offence,
  PleaData,
  PleaOption,
  ResetPleasAction,
  SelectOption,
  StoreDefendantsPleaAction,
  UpdatePleaAction
} from '../core';
import { ValidationError } from '@cpp/pdk';
import { PleaFormComponent } from './plea-form/plea-form.component';
import { ApplyDecisionContainer } from './decision-apply-all/apply-decision.container';

const mockHearing = mockData.hearing as any as HearingDetail;

describe('EnterPleasContainer', () => {
  let component: EnterPleasContainer;
  let fixture: ComponentFixture<EnterPleasContainer>;
  let store: MockStore<AppState>;
  let navigate: jest.Mock;
  let scroll: jest.Mock;

  const initialState = {
    hearings: {
      current: {
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      },
      selectedHearingDate: '2020-06-03'
    },
    hearingReferenceData: {
      motReasons: [{ value: 'reason1', text: 'Reason 1' }],
      sentencingIndications: [{ id: 'si1', description: 'Sentencing Indication 1' }],
      alcoholLevelMethods: [{ id: 'method1', description: 'Blood Test', sequence: 1 }]
    },
    referenceData: {
      pleaStatusTypes: [
        {
          id: 'GUILTY',
          description: 'Guilty',
          welshDescription: 'Euog',
          sequence: 1,
          isGuilty: true
        },
        {
          id: 'NOT_GUILTY',
          description: 'Not Guilty',
          welshDescription: 'Ddim yn Euog',
          sequence: 2,
          isGuilty: false
        }
      ]
    },
    usersGroups: {
      userGroups: [],
      userServices: []
    }
  } as unknown as AppState;

  beforeEach(waitForAsync(() => {
    navigate = jest.fn().mockResolvedValue(undefined);
    scroll = jest.fn();

    TestBed.configureTestingModule({
      imports: [EnterPleasContainer],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        provideMockStore({ initialState }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              parent: {
                paramMap: {
                  get: jest.fn().mockReturnValue('test-hearing-id')
                }
              },
              params: {
                hearingId: 'test-hearing-id',
                id: 'test-hearing-id'
              }
            }
          }
        },
        {
          provide: 'Window',
          useValue: { scroll }
        },
        {
          provide: Router,
          useValue: { navigate }
        }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(EnterPleasContainer, {
        remove: {
          imports: [PleaFormComponent, ApplyDecisionContainer]
        },
        add: {
          imports: [TestPleaFormComponent, TestApplyAllComponent]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(EnterPleasContainer);
    store = TestBed.inject(MockStore);
    component = fixture.componentInstance;

    component.originalOffencesMap = {
      'offence-A': {
        id: 'offence-A',
        offenceId: 'offence-A',
        plea: {
          pleaValue: 'GUILTY'
        }
      } as unknown as Offence,
      'offence-B': {
        id: 'offence-B',
        offenceId: 'offence-B',
        plea: {
          pleaValue: 'NOT_GUILTY'
        }
      } as unknown as Offence
    };

    fixture.detectChanges();
    jest.spyOn(store, 'dispatch');
  }));

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should initialize with hearingId from route params', () => {
    expect(component.hearingId).toBe('test-hearing-id');
  });

  it('should initialize enterPleasStep as ENTER_PLEAS', () => {
    expect(component.enterPleasStep).toBe('ENTER_PLEAS');
  });

  describe('handleDelegatedPowers', () => {
    it('should update delegatedPowers when called', () => {
      component.handleDelegatedPowers(true);
      expect(component.delegatedPowers).toBe(true);

      component.handleDelegatedPowers(false);
      expect(component.delegatedPowers).toBe(false);
    });

    it('should update delegatedPowers via component binding', () => {
      const delegatedPowersComponent = fixture.debugElement.query(
        By.directive(DelegatedPowersComponent)
      );

      delegatedPowersComponent.componentInstance.delegatedPowersChange.emit(true);

      expect(component.delegatedPowers).toBe(true);
    });
  });

  describe('submitUpdatePlea', () => {
    it('should dispatch UpdatePleaAction when pleas have changed', () => {
      const pleaData: PleaData[] = [
        {
          offenceId: 'offence-A',
          plea: {
            pleaValue: 'NOT_GUILTY'
          }
        } as PleaData
      ];

      component.submitUpdatePlea(pleaData);

      expect(component.isFormSubmitted).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(
        new UpdatePleaAction({
          hearingId: 'test-hearing-id',
          body: pleaData
        })
      );
    });

    it('should navigate to manage hearing when no pleas have changed', () => {
      const pleaData: PleaData[] = [];

      component.submitUpdatePlea(pleaData);

      expect(component.isFormSubmitted).toBe(true);
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/manage', 'test-hearing-id']);
    });

    it('should scroll to top after navigating when no changes', async () => {
      const pleaData: PleaData[] = [];

      component.submitUpdatePlea(pleaData);

      await Promise.resolve();

      expect(scroll).toHaveBeenCalledWith(0, 0);
    });

    it('should filter out unchanged pleas', () => {
      const pleaData: PleaData[] = [
        {
          offenceId: 'offence-A',
          plea: {
            pleaValue: 'GUILTY'
          }
        } as PleaData,
        {
          offenceId: 'offence-B',
          plea: {
            pleaValue: 'GUILTY'
          }
        } as PleaData
      ];

      component.submitUpdatePlea(pleaData);

      expect(store.dispatch).toHaveBeenCalledWith(
        new UpdatePleaAction({
          hearingId: 'test-hearing-id',
          body: [
            {
              offenceId: 'offence-B',
              plea: {
                pleaValue: 'GUILTY'
              }
            } as PleaData
          ]
        })
      );
    });

    it('should be called when plea form emits onSubmit', () => {
      const pleaFormComponent = fixture.debugElement.query(By.directive(TestPleaFormComponent));
      const pleaData: PleaData[] = [];

      jest.spyOn(component, 'submitUpdatePlea');

      pleaFormComponent.componentInstance.onSubmit.emit(pleaData);

      expect(component.submitUpdatePlea).toHaveBeenCalledWith(pleaData);
    });
  });

  describe('applyDecision', () => {
    it('should set apply decision state and navigate to APPLY_DECISION step', () => {
      const defendant = mockHearing.prosecutionCases[0].defendants[0];
      const offence = defendant.offences[0];
      const payload: ApplyDecisionPayload = { defendant, offence };

      component.hearingDefendants = [defendant];
      component.applyDecision(payload);

      expect(component.enterPleasStep).toBe('APPLY_DECISION');
      expect(component.applyDecisionOffence).toBe(offence);
      expect(component.applyDecisionDefendant).toBe(defendant);
      expect(scroll).toHaveBeenCalledWith(0, 0);
    });

    it('should be called when plea form emits applyDecision', () => {
      const pleaFormComponent = fixture.debugElement.query(By.directive(TestPleaFormComponent));
      const defendant = mockHearing.prosecutionCases[0].defendants[0];
      const offence = defendant.offences[0];
      const payload: ApplyDecisionPayload = { defendant, offence };

      component.hearingDefendants = [defendant];
      jest.spyOn(component, 'applyDecision');

      pleaFormComponent.componentInstance.applyDecision.emit(payload);

      expect(component.applyDecision).toHaveBeenCalledWith(payload);
    });
  });

  describe('submitApplyDecisionPleas', () => {
    it('should dispatch ApplyDecisionAction and return to ENTER_PLEAS step', () => {
      const defendant = mockHearing.prosecutionCases[0].defendants[0];
      const offence = defendant.offences[0];

      component.enterPleasStep = 'APPLY_DECISION';
      component.submitApplyDecisionPleas(defendant, offence);

      expect(store.dispatch).toHaveBeenCalledWith(new ApplyDecisionAction(defendant, offence));
      expect(component.enterPleasStep).toBe('ENTER_PLEAS');
      expect(scroll).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('cancelApplyDecision', () => {
    it('should return to ENTER_PLEAS step and scroll to top', () => {
      component.enterPleasStep = 'APPLY_DECISION';
      component.cancelApplyDecision();

      expect(component.enterPleasStep).toBe('ENTER_PLEAS');
      expect(scroll).toHaveBeenCalledWith(0, 0);
    });

    it('should be called when apply-all emits cancel', () => {
      component.enterPleasStep = 'APPLY_DECISION';
      fixture.detectChanges();

      const applyAllComponent = fixture.debugElement.query(By.directive(TestApplyAllComponent));

      jest.spyOn(component, 'cancelApplyDecision');

      applyAllComponent.componentInstance.cancel.emit();

      expect(component.cancelApplyDecision).toHaveBeenCalled();
    });
  });

  describe('onPleaChange', () => {
    it('should dispatch StoreDefendantsPleaAction with plea data', () => {
      const pleaData: PleaData[] = [
        {
          offenceId: 'offence-A',
          plea: { pleaValue: 'GUILTY' }
        } as PleaData
      ];

      component.guiltyPleasValues = ['GUILTY'];
      component.onPleaChange(pleaData);

      expect(store.dispatch).toHaveBeenCalledWith(
        new StoreDefendantsPleaAction(pleaData, ['GUILTY'])
      );
    });

    it('should be called when plea form emits onPleaChange', () => {
      const pleaFormComponent = fixture.debugElement.query(By.directive(TestPleaFormComponent));
      const pleaData: PleaData[] = [];

      jest.spyOn(component, 'onPleaChange');

      pleaFormComponent.componentInstance.onPleaChange.emit(pleaData);

      expect(component.onPleaChange).toHaveBeenCalledWith(pleaData);
    });
  });

  describe('error handling', () => {
    it('should update errors when plea form emits onError', () => {
      const pleaFormComponent = fixture.debugElement.query(By.directive(TestPleaFormComponent));
      const errors: ValidationError[] = [{ id: 'test-error', message: 'Test error message' }];

      pleaFormComponent.componentInstance.onError.emit(errors);

      expect(component.errors).toEqual(errors);
    });
  });

  describe('ngOnDestroy', () => {
    it('should dispatch ResetPleasAction when form was not submitted', () => {
      component.isFormSubmitted = false;

      component.ngOnDestroy();

      expect(store.dispatch).toHaveBeenCalledWith(new ResetPleasAction());
    });

    it('should not dispatch ResetPleasAction when form was submitted', () => {
      component.isFormSubmitted = true;
      jest.clearAllMocks();

      component.ngOnDestroy();

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('should complete destroy$ subject', () => {
      jest.spyOn(component.destroy$, 'next');
      jest.spyOn(component.destroy$, 'complete');

      component.ngOnDestroy();

      expect(component.destroy$.next).toHaveBeenCalledWith(true);
      expect(component.destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('Observables', () => {
    it('should have pleas$ observable defined', done => {
      component.pleas$.subscribe(pleas => {
        expect(pleas).toBeDefined();
        done();
      });
    });

    it('should have hearingType$ observable defined', done => {
      component.hearingType$.subscribe(type => {
        expect(type).toBeDefined();
        done();
      });
    });

    it('should have motReasonOptions$ observable defined', done => {
      component.motReasonOptions$.subscribe(options => {
        expect(options).toBeDefined();
        done();
      });
    });

    it('should have standardPleaOptions$ observable defined', done => {
      component.standardPleaOptions$.subscribe(options => {
        expect(options).toBeDefined();
        done();
      });
    });

    it('should have eitherWayPleaOptions$ observable defined', done => {
      component.eitherWayPleaOptions$.subscribe(options => {
        expect(options).toBeDefined();
        done();
      });
    });

    it('should have hasCivilCase$ observable defined', done => {
      component.hasCivilCase$.subscribe(hasCivil => {
        expect(hasCivil).toBeDefined();
        done();
      });
    });

    it('should have alcoholMethodsOptions$ observable defined', done => {
      component.alcoholMethodsOptions$.subscribe(options => {
        expect(options).toBeDefined();
        done();
      });
    });
  });
});

@Component({
  selector: 'plea-form',
  template: '<div>Plea Form Mock</div>'
})
class TestPleaFormComponent {
  @Input() isDelegatedPowers: boolean;
  @Input() hearingId: string;
  @Input() pleas: GroupedPlea[];
  @Input() hasCivilCase: boolean;
  @Input() standardPleaOptions: PleaOption[];
  @Input() eitherWayPleaOptions: PleaOption[];
  @Input() indicatedPleaOptions: PleaOption[];
  @Input() magsExtraPleaOptions: PleaOption[];
  @Input() crownExtraPleaOptions: PleaOption[];
  @Input() civilCasePleaOptions: PleaOption[];
  @Input() alcoholMethodsOptions: AlcoholLevelMethod[];
  @Input() motReasonOptions: SelectOption[];
  @Input() sentencingDecisionOptions: SelectOption[];
  @Input() selectedHearingDate: string;
  @Input() hearingType: string;
  @Output() onPleaChange = new EventEmitter<PleaData[]>();
  @Output() onError = new EventEmitter<ValidationError[]>();
  @Output() onSubmit = new EventEmitter<PleaData[]>();
  @Output() applyDecision = new EventEmitter<ApplyDecisionPayload>();
}

@Component({
  selector: 'apply-all',
  template: '<div>Apply All Mock</div>'
})
class TestApplyAllComponent {
  @Input() hearingId: string;
  @Input() currentOffence: Offence;
  @Input() defendant: Defendant;
  @Output() submitUpdatePlea = new EventEmitter<Defendant>();
  @Output() cancel = new EventEmitter<void>();
}
