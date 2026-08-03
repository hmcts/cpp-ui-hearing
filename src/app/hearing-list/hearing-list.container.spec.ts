import { ChangeDetectorRef, Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { Location, DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { cloneDeep } from 'lodash-es';
import { HearingListContainer } from './hearing-list.container';
import { provideTranslateService } from '@ngx-translate/core';
import { CaseAccessAlertService } from '../case-access-alert/case-access-alert.service';
import { REDIRECT_TOKEN } from '../../bootstrap-app.config';
import { BsModalService } from 'ngx-bootstrap/modal';
import { EXPECTED_HEARING_USER_PERMISSIONS } from '../config/user-permissions';
import {
  ApplicantCounsel,
  AppState,
  AttendantType,
  CompanyRepresentative,
  DefenceCounsel,
  Defendant,
  HearingCaseLink,
  HearingCaseLinkType,
  HearingDetail,
  HearingDetailRedux,
  HearingLockState,
  HearingSummary,
  IntermediaryCounsel,
  IntermediaryType,
  LoadHearingDetailAction,
  RespondentCounsel,
  SaveApplicantCounselsAction,
  SaveCompanyRepresentativesAction,
  SaveDefenceCounselsAction,
  SaveIntermediaryCounselsAction,
  SaveProsecutionCounselsAction,
  SaveRespondentCounselsAction
} from '../core';
import { AppConfigService } from '../config';
import * as mockNoCourtApplications from '../manage-hearing/mock/data-no-court-applications.json';
import { hearingMock, mockHearingEventsState, mockSummary } from '../mock-data/test-mock-data';
import { ApplicationCounselsFormState } from './attendees-panel/application-counsels-panel/application-counsels-form.component';
import { BehaviorSubject, of } from 'rxjs';
import { PageScrollService } from 'ngx-page-scroll-core';
import { IdpcIngestionPhase } from '../core/model/idpc-ingestion';
import { IdpcIngestionComponentStore } from './component-store/idpc-ingestion-store';
import { WofdWarningService } from '@cpp/application';

describe('HearingListContainer', () => {
  let component: HearingListContainer;
  let fixture: ComponentFixture<HearingListContainer>;
  const mockHearingDetails = mockNoCourtApplications as any;

  let selectSpy;
  let dispatchSpy: any;
  let navigateSpy;
  let appConfigServiceSpy;
  let state: AppState;
  let pageScrollServiceSpy;
  let pageScrollInstanceSpy;
  let pageScrollServiceCreateSpy;
  let markForCheckSpy;

  const store: Store<AppState> = null;
  const mockWofdWarningService = {
    isWofdApplication: jest.fn().mockReturnValue(false),
    showModal: jest.fn()
  };

  @Injectable()
  class MockIdpcIngestionStore {
    ingestionPhase$ = new BehaviorSubject<IdpcIngestionPhase | null>(null);
    ingestIdpcs = jest.fn();
    setIngestionPhase = (phase: IdpcIngestionPhase) => this.ingestionPhase$.next(phase);
    clearIngestionPhase = () => this.ingestionPhase$.next(null);
  }

  const ingestionStore = new MockIdpcIngestionStore();

  beforeEach(fakeAsync(() => {
    state = <AppState>{
      hearings: {
        current: {
          hearing: hearingMock as any,
          hearingState: HearingLockState.INITIALISED
        } as HearingDetailRedux,
        summaries: [mockSummary],
        selectedHearingDate: null,
        isRestricted: true,
        isSelectedCaseBulk: null
      },
      api: {
        requests: []
      },
      referenceData: {
        organisationUnits: []
      },
      usersGroups: {
        userDetails: {
          userId: ':userId'
        }
      },
      hearingEventsLog: mockHearingEventsState
    };

    dispatchSpy = jest.fn();
    selectSpy = jest.fn().mockImplementation(selectorFunc => {
      return of(selectorFunc.call(store, state));
    });
    navigateSpy = jest.fn().mockReturnValue(
      new Promise<void>((resolve, reject) => {
        resolve();
      })
    );
    appConfigServiceSpy = jest.fn().mockReturnValue('http://test');
    pageScrollServiceSpy = jest.fn();
    pageScrollInstanceSpy = jest.fn();
    pageScrollServiceCreateSpy = jest.fn().mockReturnValue(pageScrollInstanceSpy);
    markForCheckSpy = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideTranslateService(),
        {
          provide: Store,
          useValue: { select: selectSpy, dispatch: dispatchSpy, pipe: jest.fn() }
        },
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: 'Window', useValue: window },
        {
          provide: AppConfigService,
          useValue: {
            getBaseUrl: appConfigServiceSpy,
            getFeedbackUrl: appConfigServiceSpy,
            getGuidanceUrl: appConfigServiceSpy
          }
        },
        {
          provide: PageScrollService,
          useValue: { start: pageScrollServiceSpy, create: pageScrollServiceCreateSpy }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {}
            }
          }
        },
        {
          provide: CaseAccessAlertService,
          useValue: {
            showModal: jest.fn(),
            shouldShowModal: jest.fn().mockReturnValue(false)
          }
        },
        { provide: ChangeDetectorRef, useValue: { markForCheck: markForCheckSpy } },
        { provide: Location, useValue: of(undefined) },
        { provide: REDIRECT_TOKEN, useValue: jest.fn() },
        { provide: BsModalService, useValue: { show: jest.fn() } },
        { provide: DOCUMENT, useValue: document },
        { provide: EXPECTED_HEARING_USER_PERMISSIONS, useValue: { viewHearing: {} } },
        { provide: IdpcIngestionComponentStore, useValue: ingestionStore },
        { provide: WofdWarningService, useValue: mockWofdWarningService }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingListContainer);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the template with the values expected', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('Idpc ingestion', () => {
    it('should clear ingestionPhase when filter is applied to load new hearings', () => {
      let observedPhase: IdpcIngestionPhase | null = null;
      const sub = component.idpcIngestionPhase$.subscribe(phase => (observedPhase = phase));
      ingestionStore.setIngestionPhase(IdpcIngestionPhase.STARTED);
      component.selectedOptions = {
        courtCentreFilter: { id: '1', name: 'Test Court' },
        dateFilter: '2024-01-01',
        courtRoomFilter: { id: '1', name: 'Test Room' },
        startTimeFilter: '09:00',
        endTimeFilter: '17:00'
      };
      expect(observedPhase).toEqual(IdpcIngestionPhase.STARTED);
      component.loadHearings();
      expect(observedPhase).toBeNull();
      sub.unsubscribe();
    });
  });

  describe('topMenuDetails', () => {
    beforeEach(() => {
      component.topMenu = [
        [{ text: 'Mock Event Log Title', active: true }, { text: 'Mock Reference Title' }]
      ];
    });

    it('should return all top menu elements if not bulkCase', () => {
      component.selectedHearing.prosecutionCases[0].isGroupMaster = false;
      expect(component.topMenuDetails).toEqual([
        [
          {
            active: true,
            text: 'Mock Event Log Title'
          },
          { text: 'Mock Reference Title' }
        ]
      ]);
    });

    it('should remove second element of top menu if hearing has bulkCase only', () => {
      component.hearingHasBulkCaseOnly = true;
      expect(component.topMenuDetails).toEqual([[{ active: true, text: 'Mock Event Log Title' }]]);
    });
  });

  it('should dispatch a LoadHearingDetailAction when loading hearing details', () => {
    const hearingSummaryMock = {
      id: 'test-hearing-id'
    } as HearingSummary;
    component.loadHearingDetails(hearingSummaryMock);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(LoadHearingDetailAction));
  });

  describe('When selecting a hearing from the list', () => {
    it('should clear the selected hearing', () => {
      const hearingSummaryMock = {
        id: 'id1',
        type: null,
        reportingRestrictionReason: '',
        hearingLanguage: '',
        hearingDays: [],
        hasSharedResults: true,
        prosecutionCaseSummaries: [],
        courtApplicationSummaries: []
      } as HearingSummary;
      component.hearingSelected(hearingSummaryMock);

      const action = new LoadHearingDetailAction('id1');

      expect(component.selectedHearing).toBe(undefined);
      expect(dispatchSpy).toHaveBeenCalledWith(action);
    });
  });

  describe('When selecting a defendant from the list', () => {
    it('should clear the selected defendant', () => {
      component.clearSelectedDefendant();
      expect(component.selectedDefendant).toBe(undefined);
    });
  });

  describe('changeJudiciaryLink getter', () => {
    it('should return the change-hearing-details link when a hearing is selected', () => {
      component.selectedHearing = cloneDeep(mockHearingDetails) as HearingDetail;
      expect(component.changeJudiciaryLink).toEqual(
        `http://test/listing/court-calendar/change-hearing-details/${mockHearingDetails.id}`
      );
    });

    it('should return null when no hearing is selected', () => {
      component.selectedHearing = undefined;
      expect(component.changeJudiciaryLink).toBeNull();
    });
  });

  beforeEach(() => {
    component.selectedHearing = cloneDeep(mockHearingDetails) as HearingDetail;
    component.prosecutionCounsels = component.selectedHearing.prosecutionCounsels;
    component.defenceCounsels = component.selectedHearing.defenceCounsels;
    component.intermediariesCounsel = component.selectedHearing.intermediaries;
    if (!component.intermediariesCounsel) {
      component.intermediariesCounsel = [];
    }
    component.companyRepresentatives = component.selectedHearing.companyRepresentatives;
  });

  describe('#getReferralReasonForDefendant', () => {
    it('Should return the right referral reason text for a specific defendant', () => {
      const defendant: Defendant = { id: 'e1d32d9d-29ec-4934-a932-22a50f223966' } as Defendant;
      const referralReasonDescription = component.getReferralReasonForDefendant(defendant);
      expect(referralReasonDescription).toEqual(
        'referred fo trial under section 12 magistrates court act'
      );
    });
  });

  describe('#isSaveButtonEnabled', () => {
    it('should return false if any of the counsels info is incomplete', () => {
      component.selectedHearing.prosecutionCounsels[0].firstName = '';
      const isSavedButtonEnabled = component.isSaveButtonEnabled();
      expect(isSavedButtonEnabled).toBeFalsy();
    });

    it('should return true when the `applicantCounselsFormState` is valid', () => {
      fixture.componentInstance.applicantCounselsFormState = {
        valid: true
      } as ApplicationCounselsFormState<ApplicantCounsel>;
      expect(component.isSaveButtonEnabled()).toBe(true);
      fixture.componentInstance.applicantCounselsFormState = {
        valid: false
      } as ApplicationCounselsFormState<ApplicantCounsel>;
      expect(component.isSaveButtonEnabled()).toBe(false);
    });

    it('should return true when the `respondentCounselsFormState` is valid', () => {
      fixture.componentInstance.respondentCounselsFormState = {
        valid: true
      } as ApplicationCounselsFormState<RespondentCounsel>;
      expect(component.isSaveButtonEnabled()).toBe(true);
      fixture.componentInstance.respondentCounselsFormState = {
        valid: false
      } as ApplicationCounselsFormState<RespondentCounsel>;
      expect(component.isSaveButtonEnabled()).toBe(false);
    });
  });

  describe('#changeSelectedAttendeeMenuItem', () => {
    it('should change the selected attendee menu item', () => {
      component.changeSelectedAttendeeMenuItem('DEFENCE');
      expect(component.selectedAttendeeItem).toEqual('DEFENCE');
    });
  });

  describe('#updateProsecutionCounsel', () => {
    it('should add the prosecution counsel selected hearing if it doesnt exist', () => {
      component.updateProsecutionCounsel({
        pc: {
          id: 'test-x',
          firstName: 'test',
          lastName: 'test',
          middleName: 'test',
          status: 'test',
          title: 'Mr',
          attendanceDays: [],
          prosecutionCases: []
        }
      });
      expect(component.prosecutionCounsels.length).toEqual(2);
      expect(component.editedProsecution).toBeTruthy();
    });
  });

  describe('#updateDefenceCounsel', () => {
    it('should add the defence counsel selected hearing if it doesnt exist', () => {
      component.updateDefenceCounsel({
        dc: {
          id: 'test-x',
          firstName: 'test',
          lastName: 'test',
          middleName: 'test',
          status: 'test',
          title: 'Mr',
          attendanceDays: [],
          defendants: ['test-1']
        }
      });
      expect(component.defenceCounsels.length).toEqual(2);
      expect(component.editedDefence).toBeTruthy();
    });

    it('should add the company representative selected hearing if it doesnt exist', () => {
      component.updateCompanyRepresentative({
        rep: {
          id: 'test-x',
          firstName: 'test',
          lastName: 'test',
          position: 'test',
          title: 'Mr',
          attendanceDays: [],
          defendants: ['test-1']
        }
      });
      expect(component.companyRepresentatives.length).toEqual(2);
      expect(component.editedCompanyRepresentative).toBeTruthy();
    });
  });

  describe('#saveCounsels', () => {
    it('should dispatch a SaveProsecutionCounselsAction on the Prosecution tab ', () => {
      component.selectedAttendeeItem = 'PROSECUTION';
      component.prosecutionCounselsIds = ['ea90d649-de68-470d-935c-46cb102997ab'];

      const newProsecutionCounsel = {
        id: 'test-x',
        firstName: 'test',
        lastName: 'test',
        middleName: 'test',
        status: 'test',
        title: 'Mr',
        attendanceDays: [component.selectedhearingDate],
        prosecutionCases: component.selectedHearing.prosecutionCases.map(kase => kase.id)
      };
      component.prosecutionCounsels = [newProsecutionCounsel];

      const expectedAction = new SaveProsecutionCounselsAction({
        hearingId: component.selectedHearing.id,
        prosecutionCounselsToAdd: [newProsecutionCounsel],
        prosecutionCounselsToUpdate: [],
        prosecutionCounselsToDelete: ['ea90d649-de68-470d-935c-46cb102997ab']
      });
      component.saveCounsels();

      expect(dispatchSpy).toHaveBeenCalledWith(expectedAction);
      expect(component.editedProsecution).toBeFalsy();
      expect(component.showAttendeesPanel).toBeFalsy();
    });

    it('should dispatch a SaveDefenceCounselsAction on the Defence tab ', () => {
      component.selectedAttendeeItem = 'DEFENCE';
      component.defenceCounselIds = ['d9188ab0-cf61-4e19-a323-0173054e031e'];
      component.defendantsCurrentHearing = [];

      const newDefenceCounsel = {
        id: 'test-x',
        firstName: 'test',
        lastName: 'test',
        middleName: 'test',
        status: 'test',
        title: 'Mr',
        attendanceDays: [component.selectedhearingDate],
        defendants: []
      } as DefenceCounsel;
      component.defenceCounsels.push(newDefenceCounsel);

      const expectedAction = new SaveDefenceCounselsAction({
        hearingId: component.selectedHearing.id,
        defenceCounselsToAdd: [newDefenceCounsel],
        defenceCounselsToUpdate: [
          { ...component.defenceCounsels[0], attendanceDays: [component.selectedhearingDate] }
        ],
        defenceCounselsToDelete: []
      });
      component.saveCounsels();

      expect(dispatchSpy).toHaveBeenCalledWith(expectedAction);
      expect(component.editedDefence).toBeFalsy();
      expect(component.showAttendeesPanel).toBeFalsy();
    });

    it('should dispatch a SaveCompanyRepresentativesAction on the Defence tab ', () => {
      component.selectedAttendeeItem = 'COMPANY REPRESENTATIVE';
      component.companyRepresentativeIds = ['d9188ab0-cf61-4e19-a323-0173054e031e'];
      component.defendantsCurrentHearing = [];

      const newCompanyRepresentative = {
        id: 'test-x',
        firstName: 'test',
        lastName: 'test',
        position: 'test',
        title: 'Mr',
        attendanceDays: [component.selectedhearingDate],
        defendants: []
      } as CompanyRepresentative;
      component.companyRepresentatives.push(newCompanyRepresentative);

      const expectedAction = new SaveCompanyRepresentativesAction({
        hearingId: component.selectedHearing.id,
        companyRepresentativesToAdd: [newCompanyRepresentative],
        companyRepresentativesToUpdate: [
          {
            ...component.companyRepresentatives[0],
            attendanceDays: [component.selectedhearingDate]
          }
        ],
        companyRepresentativesToDelete: []
      });
      component.saveCounsels();

      expect(dispatchSpy).toHaveBeenCalledWith(expectedAction);
      expect(component.editedCompanyRepresentative).toBeFalsy();
      expect(component.showAttendeesPanel).toBeFalsy();
    });

    it('should handle dispatching a `SaveApplicantCounselsAction`', () => {
      fixture.componentInstance.applicantCounselsFormState = {
        added: [{ id: '*' }],
        updated: [],
        valid: true
      } as ApplicationCounselsFormState<ApplicantCounsel>;
      fixture.componentInstance.saveCounsels();

      expect(dispatchSpy).toHaveBeenCalledWith(
        new SaveApplicantCounselsAction({
          hearingId: fixture.componentInstance.selectedHearing.id,
          added: [{ id: '*' } as ApplicantCounsel],
          updated: [],
          removed: []
        })
      );
    });

    it('should handle destroying an applicant counsel', () => {
      fixture.componentInstance.handleDestroyApplicantCounsel({ id: '*' } as ApplicantCounsel);
      expect(dispatchSpy).toHaveBeenCalledWith(
        new SaveApplicantCounselsAction({
          hearingId: fixture.componentInstance.selectedHearing.id,
          added: [],
          updated: [],
          removed: [{ id: '*' } as ApplicantCounsel]
        })
      );
    });

    // TODO: Verify still need this
    it.skip('should handle dispatching a `SaveRespondentCounselsAction`', () => {
      fixture.componentInstance.respondentCounselsFormState = {
        added: [{ id: '*' }],
        updated: [],
        valid: true
      } as ApplicationCounselsFormState<RespondentCounsel>;
      fixture.componentInstance.saveCounsels();

      expect(dispatchSpy).toHaveBeenCalledWith(
        new SaveRespondentCounselsAction({
          hearingId: fixture.componentInstance.selectedHearing.id,
          added: [{ id: '*' } as RespondentCounsel],
          updated: [],
          removed: []
        })
      );
    });

    // TODO: Verify still need this
    it.skip('should handle destroying a respondent counsel', () => {
      fixture.componentInstance.handleDestroyRespondentCounsel({ id: '*' } as RespondentCounsel);
      expect(dispatchSpy).toHaveBeenCalledWith(
        new SaveRespondentCounselsAction({
          hearingId: fixture.componentInstance.selectedHearing.id,
          added: [],
          updated: [],
          removed: [{ id: '*' } as RespondentCounsel]
        })
      );
    });

    it('should handle dispatching a `SaveIntermediaryCounselsAction`', () => {
      component.selectedAttendeeItem = 'INTERPRETER / INTERMEDIARY';
      component.intermediariesCounselIds = ['d9188ab0-cf61-4e19-a323-0173054e031e'];

      const newIntermediary: IntermediaryCounsel = {
        id: '1',
        firstName: 'add',
        lastName: 'me',
        attendanceDays: ['2019-05-01'],
        role: IntermediaryType.INTERMEDIARY,
        attendant: {
          defendantId: 'defendantID',
          name: undefined,
          attendantType: AttendantType.DEFENDANTS
        }
      };

      component.intermediariesCounsel.push(newIntermediary);

      const expectedAction = new SaveIntermediaryCounselsAction({
        hearingId: component.selectedHearing.id,
        added: [newIntermediary],
        removed: [component.intermediariesCounselIds[0]],
        updated: []
      });
      component.saveCounsels();

      expect(dispatchSpy).toHaveBeenCalledWith(expectedAction);
      expect(component.editedIntemediaries).toBeFalsy();
      expect(component.showAttendeesPanel).toBeFalsy();
    });
  });

  describe('#goToCaseMarkers', () => {
    it('opens a new window', () => {
      const hearingId = component.selectedHearing.id;
      const caseId = state.hearings.current.hearing.prosecutionCases[0].id;
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.goToCaseMarkers(caseId);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `http://test/prosecution-casefile/edit-case/${caseId}/case-markers/hearing/${hearingId}`,
        '_blank'
      );
    });
  });

  describe('#goToCaseLink', () => {
    it('should open the case material page', () => {
      const mockHearingCaseLink: HearingCaseLink = {
        caseId: mockHearingDetails.prosecutionCases[0].id,
        type: HearingCaseLinkType.CASE_MATERIAL
      };

      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.goToCaseLink(mockHearingCaseLink);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `http://test/prosecution-casefile/case-materials?caseId=${mockHearingDetails.prosecutionCases[0].id}&hearingId=${mockHearingDetails.id}`,
        '_blank'
      );
    });

    it('should open the case at a glance page', () => {
      const mockHearingCaseLink: HearingCaseLink = {
        caseId: mockHearingDetails.prosecutionCases[0].id,
        type: HearingCaseLinkType.CASE_AT_A_GLANCE
      };

      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.goToCaseLink(mockHearingCaseLink);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `http://test/prosecution-casefile/case-at-a-glance/${mockHearingDetails.prosecutionCases[0].id}`,
        '_blank'
      );
    });

    it('should open the add application page', () => {
      const mockHearingCaseLink: HearingCaseLink = {
        caseId: mockHearingDetails.prosecutionCases[0].id,
        type: HearingCaseLinkType.ADD_APPLICATION
      };

      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.goToCaseLink(mockHearingCaseLink);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `http://test/prosecution-casefile/application/select-type?hearingId=${mockHearingDetails.id}&caseId=${mockHearingDetails.prosecutionCases[0].id}`,
        '_blank'
      );
    });
  });

  describe('#goToCaseLink - AAAG WOFD check', () => {
    const mockAppId = 'test-app-id';
    const mockHearingCaseLink: HearingCaseLink = {
      applicationId: mockAppId,
      type: HearingCaseLinkType.APPLICATION_AT_A_GLANCE
    };

    beforeEach(() => {
      mockWofdWarningService.isWofdApplication.mockReset();
      mockWofdWarningService.showModal.mockReset();
    });

    it('should navigate directly when application is not WOFD', () => {
      mockWofdWarningService.isWofdApplication.mockReturnValue(false);
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.goToCaseLink(mockHearingCaseLink);

      expect(mockWofdWarningService.isWofdApplication).toHaveBeenCalled();
      expect(mockWofdWarningService.showModal).not.toHaveBeenCalled();
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `http://test/prosecution-casefile/application-at-a-glance/${mockAppId}`,
        '_blank'
      );
    });

    it('should show WOFD warning modal when application is WOFD', () => {
      mockWofdWarningService.isWofdApplication.mockReturnValue(true);
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.goToCaseLink(mockHearingCaseLink);

      expect(mockWofdWarningService.isWofdApplication).toHaveBeenCalled();
      expect(mockWofdWarningService.showModal).toHaveBeenCalledWith({
        onProceed: expect.any(Function)
      });
      expect(windowOpenSpy).not.toHaveBeenCalled();
    });

    it('should navigate when proceeding from WOFD modal', () => {
      mockWofdWarningService.isWofdApplication.mockReturnValue(true);
      mockWofdWarningService.showModal.mockImplementation(({ onProceed }) => onProceed());
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.goToCaseLink(mockHearingCaseLink);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        `http://test/prosecution-casefile/application-at-a-glance/${mockAppId}`,
        '_blank'
      );
    });
  });

  describe('#showCaseAlert - WOFD check', () => {
    let caseAlertShowModalSpy: jest.Mock;

    beforeEach(() => {
      mockWofdWarningService.isWofdApplication.mockReset();
      mockWofdWarningService.showModal.mockReset();
      caseAlertShowModalSpy = (TestBed.inject(CaseAccessAlertService) as any).showModal;
    });

    it('should call wofdWarningService.showModal when application is WOFD', () => {
      mockWofdWarningService.isWofdApplication.mockReturnValue(true);

      component.showCaseAlert({ url: 'http://test-url' });

      const caseAlertArgs = caseAlertShowModalSpy.mock.calls[0][0];
      caseAlertArgs.onSubmit();

      expect(mockWofdWarningService.isWofdApplication).toHaveBeenCalled();
      expect(mockWofdWarningService.showModal).toHaveBeenCalledWith({
        onProceed: expect.any(Function)
      });
    });

    it('should navigate directly when application is not WOFD', () => {
      mockWofdWarningService.isWofdApplication.mockReturnValue(false);
      const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

      component.showCaseAlert({ url: 'http://test-url' });

      const caseAlertArgs = caseAlertShowModalSpy.mock.calls[0][0];
      caseAlertArgs.onSubmit();

      expect(mockWofdWarningService.showModal).not.toHaveBeenCalled();
      expect(windowOpenSpy).toHaveBeenCalledWith('http://test-url', '_blank');
    });
  });
  describe('#goToCaseEdit', () => {
    it('should call the case alert with edit case url', () => {
      const spyCaseAlert = jest.spyOn(component, 'showCaseAlert');

      component.goToCaseDetails('caseId');

      expect(spyCaseAlert).toHaveBeenCalledWith({
        url: `http://test/prosecution-casefile/case-at-a-glance/caseId`
      });
    });
  });

  describe('#goToCreateTask', () => {
    it('should open create task in new tab', () => {
      window.open = jest.fn();
      const mockCaseUrn = 'caseUrn';
      const mockCourtCentreId = 'courtCentreId';
      component.goToCreateTask({ caseUrn: mockCaseUrn, courtCentreId: mockCourtCentreId });
      const url = `http://test/work-management/create?caseURN=${mockCaseUrn}&courtCentreId=${mockCourtCentreId}`;
      expect(window.open).toHaveBeenCalledWith(url, '_blank');
    });
  });

  describe('#get feedback and guidance urls', () => {
    it('should fetch configured feedback and guidance urls', () => {
      expect(component.feedbackUrl).toEqual('http://test');
      expect(component.guidanceUrl).toEqual('http://test');
    });
  });
});
