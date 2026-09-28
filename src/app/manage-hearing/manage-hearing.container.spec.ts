import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { applicationTypeMockOne } from '@cpp/reference-data';
import { Store, provideStore } from '@ngrx/store';
import { of, Subscription } from 'rxjs';
import { AppConfigService } from '../config';
import { reducers, UpdateDefendantAttendance, UpdatePresenceAction } from '../core';
import { CreateCourtOrdersAction } from '../core/actions/court-orders';
import { AttendanceTypeEnum, HearingLockState } from '../core/model';
import { BreachedApplication, DefendantBreachApplication } from '../core/model/breach-application';
import { mockCourtOrderOne, mockCourtOrders } from '../mock-data/test-mock-data';
import { ManageHearingContainer } from './manage-hearing.container';
import * as hearingNoCourtApplicationsMock from './mock/data-no-court-applications.json';
import * as hearingCourtApplicationsMock from './mock/data-court-applications.json';
import * as hearingCourtApplicationsGroupCaseMock from './mock/data-court-applications-group-case.json';
import { REDIRECT_TOKEN } from '../../bootstrap-app.config';
import { TranslateMockPipe } from '../shared/pipes/mock-pipes/translate-mock.pipe';
import { ExtendMagistratesAccessComponent } from './extend-magistrates-access/extend-magistrates-access.component';
import { CaseAccessAlertComponent } from '../case-access-alert/case-access-alert.component';
import { HearingResultsListComponent } from './hearing-results-list/hearing-results-list.component';
import { ApplicationResultDetailsContainer } from './application-results-details/application-result-details.container';
import { ShareResultContainerComponent } from '../results/share-results/share-result.container';
import { provideTranslateService, TranslatePipe, TranslateService } from '@ngx-translate/core';

describe('ManageHearingContainer', () => {
  let component: ManageHearingContainer;
  let fixture: ComponentFixture<TestHostComponent>;
  let appConfigServiceSpy: any;
  appConfigServiceSpy = jest.fn().mockReturnValue('http://test');

  let pipeableSelectSpy: any;
  let dispatchSpy: any;
  let navigateSpy: any;
  let scrollSpy: any;
  let subscription: Subscription;

  const resultsByTarget = [
    {
      targetId: '9fc2be9d-1cb7-422d-93d3-a100d95ef297',
      caseId: '13eb8e37-1ea0-4f1b-a971-aba6c1e187d1',
      defendantId: '55a35de1-9750-409c-b7b0-73d4b5d4cb81',
      offenceId: '548e19a2-cafd-4137-a0d6-08b9bae23bcb',
      addMoreResults: false,
      results: [
        {
          resultLineId: 'ae506efe-d995-4752-9668-053f22d8e6ba',
          originalText: 'imp 5 yrs',
          resultCode: 'c1bf4013-7ee7-4918-9450-5ba6be760d25',
          resultLevel: 'O',
          isCompleted: true,
          dirty: true,
          parts: [],
          choices: [],
          isEditing: false,
          noResultFound: false
        }
      ],
      defendantFirstName: 'Eric',
      defendantLastName: 'Ormsby'
    }
  ] as any[];

  const mockHearingTypes = [
    { id: 'trial-id-1', description: 'Trial', trialTypeFlag: true },
    { id: 'non-trial-id-1', description: 'Plea', trialTypeFlag: false },
    { id: 'non-trial-id-2', description: 'Sentence', trialTypeFlag: false }
  ];

  const createState = (
    mockResultsByTarget: any,
    mockHearing: any,
    hearingTypes = mockHearingTypes
  ) => {
    return {
      hearings: {
        current: { hearing: mockHearing, hearingState: HearingLockState.INITIALISED },
        summaries: []
      },
      results: {
        byTarget: mockResultsByTarget
      },
      hearingReferenceData: {
        courtCentres: [],
        amendmentReasons: [
          {
            id: 'a02018a1-915c-3343-95ad-abc5f99b339a',
            description: 'test-amendment-reason-1'
          },
          {
            id: 'ca8b8285-5fc7-3b36-aa78-ecdf5ac6dad0',
            description: 'test-amendment-reason-2'
          }
        ],
        hearingTypes: hearingTypes
      },
      api: {
        requests: []
      },
      usersGroups: {
        userDetails: {
          userId: ':userId'
        }
      }
    } as any;
  };

  const initializeWithState = (mockState: any) => {
    const state = mockState;

    dispatchSpy = jest.fn();

    pipeableSelectSpy = jest.fn().mockImplementation(selector => {
      if (selector.name === 'selectCurrentHearing' || selector.name === 'getCurrentHearing') {
        return of(state.hearings.current.hearing);
      }
      if (selector.name === 'selectHearingTypes' || selector.name === 'getHearingTypes') {
        return of(state.hearingReferenceData.hearingTypes);
      }
      if (selector.name === 'selectTrialEffectivenessError') {
        return of(state.hearings?.trialEffectivenessError || null);
      }
      return of(state);
    });

    navigateSpy = jest.fn().mockReturnValue(
      new Promise<void>(resolve => {
        resolve();
      })
    );
    scrollSpy = jest.fn();

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ hearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8' })
          }
        },
        { provide: Store, useValue: { pipe: pipeableSelectSpy, dispatch: dispatchSpy } },
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: 'Window', useValue: { scroll: scrollSpy } },
        { provide: AppConfigService, useValue: { getBaseUrl: appConfigServiceSpy } },
        { provide: REDIRECT_TOKEN, useValue: jest.fn() }
      ],
      teardown: { destroyAfterEach: false }
    })
      .overrideComponent(ManageHearingContainer, {
        remove: {
          imports: [
            ExtendMagistratesAccessComponent,
            CaseAccessAlertComponent,
            HearingResultsListComponent,
            ApplicationResultDetailsContainer,
            ShareResultContainerComponent,
            TranslatePipe
          ],
          providers: [TranslateService]
        },
        add: {
          imports: [
            TranslateMockPipe,
            MockExtendMagistratesAccessComponent,
            MockCaseAccessAlertComponent,
            MockHearingResultsListComponent,
            MockApplicationResultDetailsContainer,
            MockShareResultContainerComponent
          ],
          providers: [provideTranslateService()]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    component.translated = {
      PRESENCE_NOT_YET_ENTERED: 'Presence not yet entered',
      TRIAL_EFFECTIVENESS_REQUIRED: 'Trial effectiveness is required'
    };

    fixture.detectChanges();
  };

  afterEach(() => {
    if (subscription) {
      subscription.unsubscribe();
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('when results have been entered', () => {
    describe('with no court applications', () => {
      beforeEach(() => {
        const mockState = createState(resultsByTarget, hearingNoCourtApplicationsMock);
        initializeWithState(mockState);
      });

      it('should render the template with the values expected', () => {
        expect(fixture).toMatchSnapshot();
      });

      it('should select all required data from Store upon initialization', () => {
        expect(pipeableSelectSpy).toHaveBeenCalled();
      });

      it('#navigateToAction()', fakeAsync(() => {
        component.navigateToAction('test2');
        tick();
        expect(navigateSpy).toHaveBeenCalledWith([
          '/manage/bed2d8e5-9fe2-4003-a40b-cee8d1f235d8/test2'
        ]);
        expect(scrollSpy).toHaveBeenCalledWith(0, 0);
      }));
    });

    describe('with court applications', () => {
      beforeEach(() => {
        const mockState = createState(resultsByTarget, hearingCourtApplicationsMock);
        initializeWithState(mockState);
      });

      it('should render the template with the values expected', () => {
        expect(fixture).toMatchSnapshot();
      });
    });

    describe('with court applications with group cases', () => {
      beforeEach(() => {
        const mockState = createState(resultsByTarget, hearingCourtApplicationsGroupCaseMock);
        initializeWithState(mockState);
      });

      it('should render the template with the values expected', () => {
        expect(fixture).toMatchSnapshot();
      });
    });

    it('#navigateToAction()', fakeAsync(() => {
      component.navigateToAction('test2');
      tick();
      expect(navigateSpy).toHaveBeenCalledWith([
        '/manage/bed2d8e5-9fe2-4003-a40b-cee8d1f235d8/test2'
      ]);
      expect(scrollSpy).toHaveBeenCalledWith(0, 0);
    }));
  });

  describe('when executing onPresenceChanged', () => {
    it('should dispatch the action with single defendant', () => {
      component.selectedHearingId = '123';
      component.selectedHearingDate = '2018-01-01';

      component.onPresenceChanged({ defendantId: 'defendant-id', selectedOption: 'IN_PERSON' });
      const body: UpdateDefendantAttendance = {
        hearingId: component.selectedHearingId,
        defendantId: 'defendant-id',
        attendanceDay: {
          day: component.selectedHearingDate,
          attendanceType: AttendanceTypeEnum.IN_PERSON
        }
      };

      expect(dispatchSpy).toHaveBeenCalledWith(new UpdatePresenceAction(body));
    });

    it('should dispatch the action with multiple defendants', () => {
      component.selectedHearingId = '456';
      component.selectedHearingDate = '2018-02-15';

      component.onPresenceChanged({ defendantId: 'defendant-id-1', selectedOption: 'IN_PERSON' });
      const body1: UpdateDefendantAttendance = {
        hearingId: component.selectedHearingId,
        defendantId: 'defendant-id-1',
        attendanceDay: {
          day: component.selectedHearingDate,
          attendanceType: AttendanceTypeEnum.IN_PERSON
        }
      };
      expect(dispatchSpy).toHaveBeenCalledWith(new UpdatePresenceAction(body1));

      component.onPresenceChanged({ defendantId: 'defendant-id-2', selectedOption: 'NOT_PRESENT' });
      const body2: UpdateDefendantAttendance = {
        hearingId: component.selectedHearingId,
        defendantId: 'defendant-id-2',
        attendanceDay: {
          day: component.selectedHearingDate,
          attendanceType: AttendanceTypeEnum.NOT_PRESENT
        }
      };
      expect(dispatchSpy).toHaveBeenCalledWith(new UpdatePresenceAction(body2));
    });
  });

  describe('when a breach application has been created', () => {
    it('should dispatch a CreateCourtOrdersAction when a breach application is submitted', () => {
      const breaches = <BreachedApplication[]>[
        {
          courtOrder: mockCourtOrderOne,
          applicationType: applicationTypeMockOne
        }
      ];
      const defendantBreach = <DefendantBreachApplication>{
        hearingId: component.selectedHearingId,
        masterDefendantId: 'defendant-id',
        breachedApplications: breaches,
        courtOrders: mockCourtOrders
      };
      component.onBreachApplications(defendantBreach);

      expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CreateCourtOrdersAction));
    });
  });

  describe('when sharing results', () => {
    const resultsByTargetToShare = [
      {
        targetId: '9fc2be9d-1cb7-422d-93d3-a100d95ef297',
        caseId: '13eb8e37-1ea0-4f1b-a971-aba6c1e187d1',
        defendantId: '55a35de1-9750-409c-b7b0-73d4b5d4cb81',
        offenceId: '548e19a2-cafd-4137-a0d6-08b9bae23bcb',
        addMoreResults: false,
        results: [
          {
            resultLineId: 'ae506efe-d995-4752-9668-053f22d8e6ba',
            originalText: 'imp 5 yrs',
            resultCode: 'c1bf4013-7ee7-4918-9450-5ba6be760d25',
            resultLevel: 'O',
            isCompleted: true,
            dirty: true,
            isEditing: false,
            noResultFound: false
          }
        ],
        defendantFirstName: 'Eric',
        defendantLastName: 'Ormsby'
      }
    ];

    beforeEach(() => {
      const mockState = createState(resultsByTargetToShare, hearingNoCourtApplicationsMock);
      initializeWithState(mockState);
    });

    it('should render the template with the values expected', () => {
      expect(fixture).toMatchSnapshot();
    });
  });
  describe('Trial Effectiveness Error Handling', () => {
    beforeEach(() => {
      const mockState = createState(resultsByTarget, {
        ...hearingNoCourtApplicationsMock,
        type: { id: 'trial-id-1', description: 'Trial' }
      });
      initializeWithState(mockState);
    });

    it('should dispatch setTrialEffectivenessError with error when onTrialEffectivenessMissing is called', () => {
      dispatchSpy.mockClear();
      component.onTrialEffectivenessMissing();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_TRIAL_EFFECTIVENESS_ERROR' })
      );
      expect(scrollSpy).toHaveBeenCalledWith(0, 0);
    });

    it('should dispatch setTrialEffectivenessError({ error: null }) when clearTrialEffectivenessError is called', () => {
      dispatchSpy.mockClear();
      component.clearTrialEffectivenessError();
      const call = dispatchSpy.mock.calls[0]?.[0];
      expect(call?.error).toBeNull();
    });

    it('should dispatch clear when onTrialTypeChanged is called', () => {
      dispatchSpy.mockClear();
      component.onTrialTypeChanged();
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });

    describe('handleSharedResultsValidation', () => {
      beforeEach(() => {
        jest.spyOn(component, 'clearTrialEffectivenessError');
        jest.spyOn(component, 'missingAttendanceHandler');
        jest.spyOn(component, 'onTrialEffectivenessMissing');
      });

      it('should clear errors and trial effectiveness error', () => {
        component.errors = [{ id: 'test', message: 'test' }];
        component.handleSharedResultsValidation({
          hasAttendanceError: false,
          hasTrialEffectivenessError: false
        });
        expect(component.errors).toEqual([]);
        expect(component.clearTrialEffectivenessError).toHaveBeenCalled();
      });

      it('should call missingAttendanceHandler if hasAttendanceError is true and pending defendants exist', () => {
        const pending = [{ id: '1' }] as any;
        component.handleSharedResultsValidation({
          hasAttendanceError: true,
          hasTrialEffectivenessError: false,
          pendingAttendanceDefendants: pending
        });
        expect(component.missingAttendanceHandler).toHaveBeenCalledWith(pending);
      });

      it('should call onTrialEffectivenessMissing if hasTrialEffectivenessError is true', () => {
        component.handleSharedResultsValidation({
          hasAttendanceError: false,
          hasTrialEffectivenessError: true
        });
        expect(component.onTrialEffectivenessMissing).toHaveBeenCalled();
      });
    });

    it('should clear attendance errors array when onClearAttendanceError is called', () => {
      component.errors = [{ id: 'defendant-presence', message: 'Test error' }];
      component.onClearAttendanceError();
      expect(component.getAllErrors()).toEqual([]);
    });

    it('should dispatch clear when onClearTrialEffectivenessError is called', () => {
      dispatchSpy.mockClear();
      component.onClearTrialEffectivenessError();
      const call = dispatchSpy.mock.calls[0]?.[0];
      expect(call?.error).toBeNull();
    });
  });

  describe('Error Aggregation Methods', () => {
    beforeEach(() => {
      const mockState = createState(resultsByTarget, {
        ...hearingNoCourtApplicationsMock,
        type: { id: 'trial-id-1', description: 'Trial' }
      });
      initializeWithState(mockState);
    });

    it('hasErrors should return true when errors array has items', () => {
      component.errors = [{ id: 'test', message: 'Test error' }];
      expect(component.hasErrors()).toBe(true);
    });

    it('hasErrors should return false when errors array is empty', () => {
      component.errors = [];
      expect(component.hasErrors()).toBe(false);
    });

    it('getAllErrors should return current errors value', () => {
      const attendanceError = { id: 'defendant-presence', message: 'Presence error' };
      component.errors = [attendanceError];
      const allErrors = component.getAllErrors();
      expect(allErrors).toContain(attendanceError);
    });

    it('getAllErrors should return empty array when errors is empty', () => {
      component.errors = [];
      expect(component.getAllErrors().length).toBe(0);
    });
  });

  describe('share results validation errors', () => {
    it('should surface each validation issue in the error summary anchored to the affected offence or defendant', () => {
      const mockState = createState(resultsByTarget, hearingNoCourtApplicationsMock);
      mockState.validationIssues = [
        {
          ruleId: 'CTL-001',
          severity: 'ERROR',
          validationLevel: 'OFFENCE',
          affectedOffences: [
            { offenceId: 'offence-1', message: 'The results could not be shared: error 1' }
          ]
        },
        {
          ruleId: 'DEF-001',
          severity: 'ERROR',
          validationLevel: 'DEFENDANT',
          affectedDefendants: [
            { defendantId: 'defendant-1', message: 'The results could not be shared: error 2' }
          ]
        }
      ];
      initializeWithState(mockState);

      expect(component.shareValidationErrors).toEqual([
        {
          id: 'results-validation-error-offence-1',
          message: 'The results could not be shared: error 1',
          shouldFocus: false
        },
        {
          id: 'results-validation-error-defendant-1',
          message: 'The results could not be shared: error 2',
          shouldFocus: false
        }
      ]);
      expect(component.getAllErrors()).toEqual(component.shareValidationErrors);
      expect(scrollSpy).toHaveBeenCalledWith(0, 0);
    });

    it('should fall back to the top level error messages when the issues carry no affected offences or defendants', () => {
      const mockState = createState(resultsByTarget, hearingNoCourtApplicationsMock);
      mockState.errorMessages = ['The results could not be shared: error 1'];
      initializeWithState(mockState);

      expect(component.shareValidationErrors).toEqual([
        {
          id: 'results-validation-error-0',
          message: 'The results could not be shared: error 1',
          shouldFocus: false
        }
      ]);
      expect(scrollSpy).toHaveBeenCalledWith(0, 0);
    });

    it('should not surface share validation errors when no validation failure is stored', () => {
      const mockState = createState(resultsByTarget, hearingNoCourtApplicationsMock);
      initializeWithState(mockState);

      expect(component.shareValidationErrors).toEqual([]);
      expect(component.getAllErrors()).toEqual([]);
    });
  });

  describe('isTrialApplication$ Observable', () => {
    afterEach(() => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    });

    it('should return false when hearing type has trialTypeFlag = false', done => {
      const nonTrialHearingMock = {
        ...hearingNoCourtApplicationsMock,
        type: { id: 'non-trial-id-1', description: 'Plea' }
      };
      const mockState = createState(resultsByTarget, nonTrialHearingMock);
      initializeWithState(mockState);

      subscription = component.isTrialApplication$.subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when hearing type is not found in hearingTypes', done => {
      const unknownHearingMock = {
        ...hearingNoCourtApplicationsMock,
        type: { id: 'unknown-id', description: 'Unknown' }
      };
      const mockState = createState(resultsByTarget, unknownHearingMock);
      initializeWithState(mockState);

      subscription = component.isTrialApplication$.subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when hearing is null', done => {
      const mockState = createState(resultsByTarget, null);
      initializeWithState(mockState);

      subscription = component.isTrialApplication$.subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });

    it('should return false when hearingTypes is null', done => {
      const trialHearingMock = {
        ...hearingNoCourtApplicationsMock,
        type: { id: 'trial-id-1', description: 'Trial' }
      };
      const mockState = createState(resultsByTarget, trialHearingMock, null);
      initializeWithState(mockState);

      subscription = component.isTrialApplication$.subscribe(result => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  describe('Integration with existing methods', () => {
    beforeEach(() => {
      const mockState = createState(resultsByTarget, {
        ...hearingNoCourtApplicationsMock,
        type: { id: 'trial-id-1', description: 'Trial' }
      });
      initializeWithState(mockState);
    });

    it('should preserve errors when dispatching trialEffectiveness error', () => {
      const attendanceError = { id: 'defendant-presence', message: 'Presence error' };
      component.errors = [attendanceError];
      dispatchSpy.mockClear();
      component.onTrialEffectivenessMissing();
      expect(component.getAllErrors()).toEqual([attendanceError]);
    });

    it('should clear only errors when onClearAttendanceError is called', () => {
      component.errors = [{ id: 'defendant-presence', message: 'Presence error' }];
      component.onClearAttendanceError();
      expect(component.getAllErrors()).toEqual([]);
    });

    it('should dispatch clear only for trial error when onClearTrialEffectivenessError is called', () => {
      component.errors = [{ id: 'defendant-presence', message: 'Presence error' }];
      dispatchSpy.mockClear();
      component.onClearTrialEffectivenessError();
      expect(component.getAllErrors().length).toBe(1);
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
    });

    it('should maintain attendanceErrors getter functionality', () => {
      const ancillaryError = {
        id: 'ancillary-1',
        message: 'offence: result must include a final or interim result before it can be shared'
      };
      const attendanceError = { id: 'defendant-presence', message: 'Presence error' };
      component.errors = [attendanceError, ancillaryError];
      expect(component.attendanceErrors.length).toBe(1);
      expect(component.attendanceErrors[0]).toEqual(attendanceError);
    });
  });
});

@Component({
  template: ` <manage-hearing></manage-hearing> `,
  imports: [ManageHearingContainer]
})
class TestHostComponent {}

@Component({
  selector: 'extend-magistrates-access',
  template: '<div>Mock Extend Magistrates Access</div>'
})
class MockExtendMagistratesAccessComponent {
  @Input() hearingId: string;
  @Input() hearingAccessPermissionId: string;
  @Input() isLegalAdviser: boolean;
}

@Component({
  selector: 'case-access-alert',
  template: '<div>Mock Case Access Alert</div>'
})
class MockCaseAccessAlertComponent {
  @Input() urns: string[];
  @Input() hearingIds: string[];
  @Input() selectedHearingId: string;
  @Input() userId: string;
  @Input() checkOneTime: boolean;
}

@Component({
  selector: 'hearing-results-list',
  template: '<div>Mock Hearing Results List</div>'
})
class MockHearingResultsListComponent {
  @Input() hearing: any;
  @Input() hearingId: string;
  @Input() pleasMapping: any;
  @Input() guiltyPleasValues: any;
  @Input() selectedHearingDate: string;
  @Input() verdictTypes: any;
  @Input() todayDefendantsAttendance: any;
  @Input() reasonOptions: any;
  @Input() casesAndApplicationsGroupedByDefendant: any;
  @Input() hearingType: string;
  @Input() earliestNextHearingDate: string;
  @Input() activeCourtOrders: any;
  @Input() breachTypes: any;
  @Input() isPleaApplicableFlag: boolean;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() attendanceErrors: any;
  @Output() onPresenceChanged = new EventEmitter();
  @Output() onGoToEnterResult = new EventEmitter();
  @Output() onGoToEnterPlea = new EventEmitter();
  @Output() onGoToEnterVerdict = new EventEmitter();
  @Output() onOutstandingFine = new EventEmitter();
  @Output() onYouthCourtToggle = new EventEmitter();
  @Output() onBreachApplications = new EventEmitter();
  @Output() onSelectedParticipant = new EventEmitter();
}

@Component({
  selector: 'application-result-details-container',
  template: '<div>Mock Application Result Details</div>'
})
class MockApplicationResultDetailsContainer {
  @Input() hearing: any;
  @Input() hearingId: string;
  @Input() courtApplications: any;
  @Input() isGroupCaseApplicationText: string;
  @Input() hearingType: string;
  @Input() showSubject: boolean;
  @Input() pleasMapping: any;
  @Input() guiltyPleasValues: any;
  @Input() caseStatus: string;
  @Input() verdictTypes: any;
  @Input() todayDefendantsAttendance: any;
  @Input() selectedHearingDate: string;
  @Input() isPleaApplicableFlag: boolean;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() attendanceErrors: any;
  @Output() onGoToEnterResult = new EventEmitter();
  @Output() onOutstandingFine = new EventEmitter();
  @Output() onPresenceChanged = new EventEmitter();
  @Output() onYouthCourtToggle = new EventEmitter();
  @Output() onSelectedParticipant = new EventEmitter();
}

@Component({
  selector: 'cpp-share-result-container',
  template: '<div>Mock Share Result Container</div>'
})
class MockShareResultContainerComponent {
  @Input() pendingAttendanceDefendants: any;
  @Input() isApplicationJourney: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Output() sharedResultsValidation = new EventEmitter();
}
