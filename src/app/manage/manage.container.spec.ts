import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, NavigationEnd, Router, provideRouter } from '@angular/router';
import { Store } from '@ngrx/store';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { AppConfigService } from '../config';
import {
  AppState,
  HearingCaseLink,
  HearingCaseLinkType,
  HearingDetail,
  HearingLockState,
  SetSelectedHearingDateAction
} from '../core';
import * as mockData from '../core/selectors/mock/hearing.json';
import { ManageContainer } from './manage.container';
import { PleaType } from '@cpp/reference-data';
import { mockSummary } from '../mock-data/test-mock-data';
import { DefendantNamesPipe } from '../shared/pipes/defendant-names.pipe';
import { WofdWarningService } from '@cpp/application';

const mockHearing = (mockData as any).hearing as HearingDetail;
const pleaTypes = (mockData as any).pleaTypes as PleaType[];

describe('ManageContainer', () => {
  let fixture: ComponentFixture<ManageContainer>;
  let selectSpy: any;
  let navigateSpy: any;
  let routerMock: Partial<Router> & { url: string; events: BehaviorSubject<NavigationEnd> };
  let scrollSpy: any;
  let state: any;
  let dispatchSpy: any;
  let component: ManageContainer;
  const store: Store<AppState> = null;
  const getBaseUrl = jest.fn();
  const mockWofdWarningService = {
    isWofdApplication: jest.fn().mockReturnValue(false),
    showModal: jest.fn()
  };

  beforeEach(waitForAsync(() => {
    state = {
      hearings: {
        current: {
          hearing: mockHearing,
          hearingState: HearingLockState.INITIALISED,
          isRestricted: true
        }
      },
      selectedHearingDate: '2018-01-01',
      router: {
        state: {
          url: '/manage/test-hearing-id'
        }
      },
      referenceData: {
        pleaStatusTypes: pleaTypes,
        organisationUnits: []
      },
      usersGroups: {
        userDetails: {
          userId: ':userId'
        },
        userRoles: [
          {
            userPlacements: [
              {
                placementId: 'placementId'
              }
            ]
          }
        ]
      },
      futureHearings: {
        hearings: [mockSummary]
      }
    };

    scrollSpy = jest.fn();
    dispatchSpy = jest.fn();
    selectSpy = jest.fn().mockImplementation(selectorFunc => {
      return of(selectorFunc.call(store, state));
    });

    navigateSpy = jest.fn().mockReturnValue(
      new Promise<void>(resolve => {
        resolve();
      })
    );

    routerMock = {
      navigate: navigateSpy,
      events: new BehaviorSubject<NavigationEnd>(new NavigationEnd(0, '*', '*')),
      url: 'testRoute'
    };

    TestBed.configureTestingModule({
      imports: [ManageContainer],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: Store, useValue: { select: selectSpy, dispatch: dispatchSpy } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { title: 'Title' } },
            params: of({ hearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8' })
          }
        },
        { provide: 'Window', useValue: { scroll: scrollSpy } },
        { provide: Router, useValue: routerMock },
        {
          provide: AppConfigService,
          useValue: {
            getBaseUrl
          }
        },
        DefendantNamesPipe,
        { provide: WofdWarningService, useValue: mockWofdWarningService }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();

    getBaseUrl.mockReturnValue('http://base-url');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageContainer);
    component = fixture.componentInstance;
    component.today = new Date('2018-01-01');
    fixture.detectChanges();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  describe('topMenuDetails$', () => {
    beforeEach(() => {
      component.topMenu = [
        [{ text: 'Mock Event Log Title', active: true }, { text: 'Mock Reference Title' }]
      ];
    });

    it('should return all top menu elements if not bulkHearing', () => {
      component.hearingHasBulkCaseOnly = false;
      expect(component.topMenuDetails).toEqual([
        [{ active: true, text: 'Mock Event Log Title' }, { text: 'Mock Reference Title' }]
      ]);
    });

    it('should remove second element of top menu if bulkHearing', () => {
      component.hearingHasBulkCaseOnly = true;
      expect(component.topMenuDetails).toEqual([[{ active: true, text: 'Mock Event Log Title' }]]);
    });

    it('should select all required data from Store upon initialization', () => {
      expect(selectSpy).toHaveBeenCalledTimes(21);
    });

    it('should dispatch an action when a day is selected and it has a value', () => {
      component.selectedDay('test');
      expect(dispatchSpy).toHaveBeenCalledWith(new SetSelectedHearingDateAction('test'));
    });
  });

  describe('#goToCaseLink', () => {
    beforeEach(() => {
      window.open = jest.fn();
    });

    it('should open the case material page', () => {
      const mockHearingCaseLink: HearingCaseLink = {
        caseId: mockHearing.prosecutionCases[0].id,
        type: HearingCaseLinkType.CASE_MATERIAL
      };

      const windowOpenSpy = jest.spyOn(window, 'open');

      component.goToCaseLink(mockHearingCaseLink);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `undefined/prosecution-casefile/case-materials?caseId=${mockHearing.prosecutionCases[0].id}&hearingId=${mockHearing.id}`,
        '_blank'
      );
    });

    it('should open the case at a glance page', () => {
      const mockHearingCaseLink: HearingCaseLink = {
        caseId: mockHearing.prosecutionCases[0].id,
        type: HearingCaseLinkType.CASE_AT_A_GLANCE
      };

      const windowOpenSpy = jest.spyOn(window, 'open');

      component.goToCaseLink(mockHearingCaseLink);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `undefined/prosecution-casefile/case-at-a-glance/${mockHearing.prosecutionCases[0].id}`,
        '_blank'
      );
    });

    it('should open the add application page', () => {
      const mockHearingCaseLink: HearingCaseLink = {
        caseId: mockHearing.prosecutionCases[0].id,
        type: HearingCaseLinkType.ADD_APPLICATION
      };

      const windowOpenSpy = jest.spyOn(window, 'open');

      component.goToCaseLink(mockHearingCaseLink);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        `undefined/prosecution-casefile/application/select-type?hearingId=${mockHearing.id}&caseId=${mockHearing.prosecutionCases[0].id}`,
        '_blank'
      );
    });

    describe('AAAG', () => {
      const mockAppId = '12';
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
        const windowOpenSpy = jest.spyOn(window, 'open');

        component.goToCaseLink(mockHearingCaseLink);

        expect(mockWofdWarningService.isWofdApplication).toHaveBeenCalled();
        expect(mockWofdWarningService.showModal).not.toHaveBeenCalled();
        expect(windowOpenSpy).toHaveBeenCalledWith(
          `undefined/prosecution-casefile/application-at-a-glance/${mockAppId}`,
          '_blank'
        );
      });

      it('should show WOFD warning modal when application is WOFD', () => {
        mockWofdWarningService.isWofdApplication.mockReturnValue(true);
        const windowOpenSpy = jest.spyOn(window, 'open');

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
        const windowOpenSpy = jest.spyOn(window, 'open');

        component.goToCaseLink(mockHearingCaseLink);

        expect(windowOpenSpy).toHaveBeenCalledWith(
          `undefined/prosecution-casefile/application-at-a-glance/${mockAppId}`,
          '_blank'
        );
      });
    });
  });

  describe('displayUnlockHearingLink', () => {
    beforeEach(() => {
      routerMock.url = '/manage/hearingId';
    });

    it('should set displayUnlockHearingLink to true when user cannot amend hearing and not on error page', () => {
      selectSpy.mockReturnValue(of(false));
      component.ngOnInit();

      expect(component.displayUnlockHearingLink).toBe(true);
    });

    it('should set displayUnlockHearingLink to false when user can amend hearing', () => {
      selectSpy.mockReturnValue(of(true));
      component.ngOnInit();

      expect(component.displayUnlockHearingLink).toBe(false);
    });

    it('should set displayUnlockHearingLink to false when on manage-hearing-error page regardless of amend permission', () => {
      routerMock.url = '/manage/hearingId/manage-hearing-error';
      selectSpy.mockReturnValue(of(false));
      component.ngOnInit();

      expect(component.displayUnlockHearingLink).toBe(false);
    });

    it('should update displayUnlockHearingLink when navigation occurs', () => {
      selectSpy.mockReturnValue(of(false));
      component.ngOnInit();
      expect(component.displayUnlockHearingLink).toBe(true);

      routerMock.url = '/manage/hearingId/manage-hearing-error';
      routerMock.events.next(new NavigationEnd(1, routerMock.url, routerMock.url));
      expect(component.displayUnlockHearingLink).toBe(false);
    });
  });
});
