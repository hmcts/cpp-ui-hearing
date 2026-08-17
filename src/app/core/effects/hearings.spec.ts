/**/
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import {} from '@angular/router/testing';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { ReferenceDataService } from '@cpp/reference-data';
import {
  UserDetails,
  UsersGroupsActions,
  UsersGroupsService,
  RolePermission,
  UserGroup,
  UserRole
} from '@cpp/users-groups';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action, provideStore } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { hearingCaseNoteMock, hearingMock, mockSummary } from '../../mock-data/test-mock-data';
import {
  addWitness,
  AddCompanyRepresentativesSuccessAction,
  AddDefenceCounselsSuccessAction,
  ApiError,
  EditCompanyRepresentativesSuccessAction,
  EditDefenceCounselsSuccessAction,
  ExtendMagistratesAccess,
  getSelectedHearingIsRestricted,
  getSelectedHearingIsRestrictedSuccess,
  LoadAmendingUserDetailsSuccessAction,
  LoadDefendantsTrackingStatusAction,
  LoadDefendantsTrackingStatusSuccessAction,
  LoadHearingDetailAction,
  LoadHearingDetailSuccessAction,
  LoadHearingListAction,
  LoadHearingListSuccessAction,
  RemoveCompanyRepresentativesSuccessAction,
  RemoveDefenceCounselsSuccessAction,
  SaveApplicantCounselsAction,
  SaveApplicantCounselsSuccessAction,
  SaveCompanyRepresentativesAction,
  SaveDefenceCounselsAction,
  SaveHearingCaseNoteAction,
  SaveHearingCaseNoteActionSuccess,
  SaveIntermediaryCounselsAction,
  SaveIntermediaryCounselsSuccessAction,
  SaveProsecutionCounselsAction,
  SaveProsecutionCounselsSuccessAction,
  SaveRespondentCounselsAction,
  SaveRespondentCounselsSuccessAction,
  SearchAvailableHearingsAction,
  SearchAvailableHearingsSuccessAction,
  UpdateApplicationResponseAction,
  UpdateApplicationResponseSuccessAction,
  UpdatePleaAction,
  UpdatePresenceAction,
  UpdatePresenceSuccessAction,
  UpdateVerdictAction,
  UpdateVerdictSuccessAction,
  VacateTrialAction
} from '../actions';
import {
  AttendanceTypeEnum,
  AttendantType,
  CompanyRepresentative,
  CourtApplicationResponse,
  DefenceCounsel,
  ElectronicMonitoringDefendant,
  ExtendMagistratesAccessPermission,
  HearingDetail,
  HearingDetailResponse,
  HearingLockState,
  IntermediaryType,
  PleaData,
  ProsecutionCounsel,
  SearchAvailableHearingsFormOptions,
  SearchCriteriaAvailableHearingsType,
  TierAndListType
} from '../model';
import { Judiciary } from '../model/shared/judiciary';
import { AppState, reducers } from '../reducers';
import { HearingService, ListingService } from '../services';
import { HearingEffects } from './hearing';
import { validAvailableHearingMock1 } from '../../results/hearing-details/related-hearings/mock/data';
import {
  deleteListingNote as deleteListingNoteAction,
  createListingNoteSuccess,
  deleteListingNoteSuccess,
  ListingNote,
  loadListingNotes as loadListingNotesAction,
  updateListingNote as updateListingNoteAction,
  updateListingNoteSuccess,
  createListingNote as createListingNoteAction,
  ListingNotesService
} from '@cpp/scheduling';
import { CrackedIneffectiveSubReasonService } from '../services/cracked-ineffective-sub-reason.service';
import { CrackedIneffectiveSubReason } from '../model/shared/cracked-ineffective-sub-reason';
import * as HearingActions from '../actions/hearing';
import { ValidationError } from '@cpp/pdk';

describe('Hearing effects', () => {
  let actions$ = new Observable<Action>();
  let store: MockStore<AppState>;
  let effects: HearingEffects;
  let hearingService: HearingService;
  let usersGroupsService: UsersGroupsService;
  let mockState: any;

  const updatePleas = jest.fn();
  const updateVerdicts = jest.fn();
  const addProsecutionCounsel = jest.fn();
  const updateProsecutionCounsel = jest.fn();
  const removeProsecutionCounsel = jest.fn();
  const addDefenceCounsel = jest.fn();
  const updateDefenceCounsel = jest.fn();
  const removeDefenceCounsel = jest.fn();
  const addCompanyRepresentative = jest.fn();
  const updateCompanyRepresentative = jest.fn();
  const removeCompanyRepresentative = jest.fn();
  const updateDefendantAttendance = jest.fn();
  const getHearingsByDate = jest.fn();
  const getHearingsForCheckIn = jest.fn();
  const getHearing = jest.fn();
  const getUserDetails = jest.fn();
  const fetchJudicialMembers = jest.fn();
  const updateApplicationResponse = jest.fn();
  const setTrialType = jest.fn();
  const setTierAndListType = jest.fn();
  const searchAvailableHearings = jest.fn();
  const splitFutureHearingDays = jest.fn();
  const sortByHearingDay = jest.fn();
  const vacateTrial = jest.fn();
  const saveNewNote = jest.fn();
  const navigateSpy = jest.fn().mockReturnValue(
    new Promise<void>((resolve, reject) => {
      resolve();
    })
  );
  const createListingNotes = jest.fn();
  const updateListingNote = jest.fn();
  const deleteListingNote = jest.fn();
  const setYouthCourtDefendants = jest.fn();
  const getSubReasons = jest.fn();
  const getSubReasonById = jest.fn();

  beforeEach(() => {
    const createState = () => {
      return {
        referenceData: {
          organisationUnits: [
            {
              id: 'organisationUnitId',
              oucode: 'courtCentreOuCode'
            }
          ],
          trialTypes: [
            {
              id: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
              seqNo: 1,
              reasonCode: 'A',
              trialType: 'Cracked',
              jurisdiction: 'CCM',
              reasonShortDescription: `Acceptable guilty plea(s) entered late to some or all charges / counts
                                          on the charge sheet, offered for the first time by the defence`
            },
            {
              id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c',
              seqNo: 2,
              reasonCode: 'B',
              trialType: 'Cracked',
              jurisdiction: 'CCM',
              reasonShortDescription: `Acceptable guilty plea(s) entered late to some or all charges / counts
                                          on the charge sheet, previously rejected by the prosecution`
            }
          ]
        },
        hearingReferenceData: {},
        hearings: {
          current: {
            hearing: {
              id: 'hearingId',
              courtCentre: {
                id: 'organisationUnitId'
              },
              prosecutionCases: [
                {
                  id: 'caseId1',
                  defendants: [
                    {
                      id: '1',
                      defendantId: 'def-id1',
                      personDefendant: { personDetails: { firstName: 'David', lastName: 'Jones' } },
                      offences: []
                    },
                    {
                      id: '2',
                      defendantId: 'def-id3',
                      personDefendant: {
                        personDetails: { firstName: 'Johanna', lastName: 'Jones' }
                      },
                      offences: []
                    }
                  ]
                },
                {
                  id: 'caseId2',
                  defendants: [
                    {
                      id: '3',
                      defendantId: 'def-id3',
                      personDefendant: {
                        personDetails: { firstName: 'Mickey', lastName: 'Noodle' }
                      },
                      offences: []
                    }
                  ]
                }
              ],
              youthCourtDefendantIds: []
            },
            hearingState: HearingLockState.INITIALISED
          }
        },
        usersGroups: {
          userDetails: {
            userId: 'userId'
          },
          permissionsMap: [
            {
              permissionId: 'permissionId0',
              source: 'userId',
              target: 'caseId1',
              object: 'RestrictedCase',
              action: 'View'
            },
            {
              permissionId: 'permissionId1',
              source: 'userId',
              target: 'noMatchHearingId',
              object: 'CaseAccess',
              action: 'View'
            },
            {
              permissionId: 'permissionId2',
              source: 'userId',
              target: 'noMatchCaseId',
              object: 'CaseAccess',
              action: 'View'
            }
          ],
          userRoles: [{ userPlacements: [{ placementId: 'courtCentreOuCode' }] }]
        }
      } as any;
    };

    mockState = createState();

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideCppCoreHttpServices(),
        HearingEffects,
        UsersGroupsService,
        ReferenceDataService,
        CrackedIneffectiveSubReasonService,
        provideMockStore({ initialState: mockState }),
        {
          provide: ReferenceDataService,
          useValue: {
            fetchJudicialMembers
          }
        },
        {
          provide: HearingService,
          useValue: {
            saveNewNote,
            updatePleas,
            addProsecutionCounsel,
            updateProsecutionCounsel,
            removeProsecutionCounsel,
            addDefenceCounsel,
            updateDefenceCounsel,
            removeDefenceCounsel,
            addCompanyRepresentative,
            updateCompanyRepresentative,
            removeCompanyRepresentative,
            updateVerdicts,
            updateDefendantAttendance,
            addApplicantCounsel: jest.fn(),
            removeApplicantCounsel: jest.fn(),
            updateApplicantCounsel: jest.fn(),
            addRespondentCounsel: jest.fn(),
            removeRespondentCounsel: jest.fn(),
            updateRespondentCounsel: jest.fn(),
            getHearingsByDate,
            getHearingsForCheckIn,
            getHearing,
            getUserDetails,
            updateApplicationResponse,
            addIntermediaryCounsel: jest.fn(),
            updateIntermediaryCounsel: jest.fn(),
            removeIntermediaryCounsel: jest.fn(),
            setTrialType,
            setTierAndListType,
            vacateTrial,
            getLoggedInUserDetails: jest.fn(),
            extendMagistratesAccess: jest.fn(),
            setYouthCourtDefendants,
            getDefendantsTrackingStatus: jest.fn(),
            addWitness: jest.fn()
          }
        },
        {
          provide: ListingService,
          useValue: {
            searchAvailableHearings,
            splitFutureHearingDays,
            sortByHearingDay
          }
        },
        {
          provide: ListingNotesService,
          useValue: {
            createListingNotes,
            updateListingNote,
            deleteListingNote
          }
        },
        {
          provide: CrackedIneffectiveSubReasonService,
          useValue: {
            getSubReasons: getSubReasons,
            getSubReasonById: getSubReasonById
          }
        },
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            commandSync: jest.fn()
          }
        },
        provideMockActions(() => actions$),
        { provide: Router, useValue: { navigate: navigateSpy } }
      ],
      teardown: { destroyAfterEach: false }
    });

    hearingService = TestBed.inject(HearingService);
    usersGroupsService = TestBed.inject(UsersGroupsService);
    effects = TestBed.inject(HearingEffects);
    store = TestBed.inject(MockStore);
  });

  describe('updatePleas$', () => {
    const plea: PleaData[] = [
      <PleaData>{
        isDelegatedPowers: false,
        offenceId: 'ddd0fc02-4395-455f-9f54-1f58ecc8e778',
        date: '2017-08-01',
        value: 'GUILTY'
      }
    ];

    const inputAction = new UpdatePleaAction({
      body: plea,
      hearingId: '123'
    });

    it('should update the pleas for a hearing and defendant', () => {
      const outputAction = new LoadHearingDetailSuccessAction({} as any);
      const logInSpy = jest.spyOn(hearingService, 'getLoggedInUserDetails');
      logInSpy.mockReturnValue(
        of({
          userId: 1,
          firstName: 'sdf',
          lastName: 'sdf',
          email: 'test@test.com',
          prosecutingAuthorityAccess: false
        } as any)
      );

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      updatePleas.mockReturnValue(of(undefined));
      getHearing.mockReturnValue(of({}));
      expect(effects.updatePleas$).toBeObservable(expected$);
      expect(navigateSpy).toHaveBeenCalledWith(['/manage/123']);
    });

    it('should not update the pleas for a hearing and defendant and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');
      const logInSpy = jest.spyOn(hearingService, 'getLoggedInUserDetails');
      logInSpy.mockReturnValue(
        of({
          userId: 1,
          firstName: 'sdf',
          lastName: 'sdf',
          email: 'test@test.com',
          prosecutingAuthorityAccess: false
        } as any)
      );
      actions$ = hot('-a---', { a: inputAction });
      const error$ = cold('#');
      const expected$ = cold('-(b|)', { b: expectedAction });
      updatePleas.mockReturnValue(error$);
      expect(effects.updatePleas$).toBeObservable(expected$);
    });
  });

  describe('updateVerdicts$', () => {
    const verdict = {
      caseId: '0f604e25-8192-4644-ad2f-6f70941998e7',
      defendants: [
        {
          id: '215d7707-0984-469e-a52c-de0b2cc077f3',
          offences: [
            {
              id: '5750e1e1-f142-4e79-8a1f-0ae75ef17256',
              verdict: {
                id: '5750e1e1-f142-4e79-8a1f-0ae75ef17256',
                value: {
                  id: '6be38d04-e3c7-437a-9327-d4e24cbc781a',
                  category: 'GUILTY'
                },
                verdictDate: '2018-04-30',
                numberOfJurors: 12,
                numberOfSplitJurors: 0,
                unanimous: true
              }
            }
          ]
        },
        {
          id: 'ce91982c-34f5-40ee-95de-b2d759035fc2',
          offences: []
        }
      ]
    };
    const inputAction = new UpdateVerdictAction({
      hearingId: '123',
      verdict
    });

    it('should update the verdicts for a hearing and defendant', () => {
      const outputAction = new UpdateVerdictSuccessAction({
        hearingId: '123',
        verdict
      });

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      updateVerdicts.mockReturnValue(of(undefined));
      expect(effects.updateVerdicts$).toBeObservable(expected$);
      expect(navigateSpy).toHaveBeenCalledWith(['/manage/123']);
    });

    it('should not update the verdicts for a hearing and defendant and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');

      actions$ = hot('-a---', { a: inputAction });
      const error$ = cold('#');
      const expected$ = cold('-b', { b: expectedAction });

      updateVerdicts.mockReturnValue(error$);
      expect(effects.updateVerdicts$).toBeObservable(expected$);
    });
  });

  describe('updatePresence$', () => {
    const defendantAttendance = {
      hearingId: '123',
      defendantId: '123',
      attendanceDay: {
        day: 'test',
        attendanceType: AttendanceTypeEnum.NOT_PRESENT
      }
    };

    const inputAction = new UpdatePresenceAction(defendantAttendance);

    it('should update the defendant presence in a hearing', () => {
      const outputAction = new UpdatePresenceSuccessAction(defendantAttendance);

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      updateDefendantAttendance.mockReturnValue(of(undefined));
      expect(effects.updatePresence$).toBeObservable(expected$);
    });

    it('should not update the defendant presence and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');

      actions$ = hot('-a---', { a: inputAction });
      const error$ = cold('#');
      const expected$ = cold('-b', { b: expectedAction });

      updateDefendantAttendance.mockReturnValue(error$);
      expect(effects.updatePresence$).toBeObservable(expected$);
    });
  });

  describe('saveHearingCaseNote$ @effect', () => {
    it('should saveHearingCaseNote$ : success expect dispatch Action SaveHearingCaseNoteActionSuccess', () => {
      const mockDate = new Date('2020-02-07T10:20:30Z');
      const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      const logInSpy = jest.spyOn(hearingService, 'getLoggedInUserDetails');
      logInSpy.mockReturnValue(
        of({
          userId: '1',
          firstName: 'sdf',
          lastName: 'sdf',
          email: 'test@test.com',
          prosecutingAuthorityAccess: false
        } as any)
      );
      const triggerAction: SaveHearingCaseNoteAction = new SaveHearingCaseNoteAction(
        hearingCaseNoteMock
      );

      hearingCaseNoteMock.courtClerk.userId = '1';
      hearingCaseNoteMock.courtClerk.firstName = 'sdf';
      hearingCaseNoteMock.courtClerk.lastName = 'sdf';
      hearingCaseNoteMock.noteDateTime = '2020-02-07T10:20:30Z';

      const expectedAction: SaveHearingCaseNoteActionSuccess = new SaveHearingCaseNoteActionSuccess(
        hearingCaseNoteMock
      );
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });
      saveNewNote.mockReturnValue(of(hearingCaseNoteMock));

      expect(effects.saveHearingCaseNote$).toBeObservable(expected);
      spy.mockRestore();
    });
    it('should saveHearingCaseNote$ : error expect throw ApiError', () => {
      const logInSpy = jest.spyOn(hearingService, 'getLoggedInUserDetails');
      logInSpy.mockReturnValue(
        of({
          userId: 1,
          firstName: 'sdf',
          lastName: 'sdf',
          email: 'test@test.com',
          prosecutingAuthorityAccess: false
        } as any)
      );
      const triggerAction: SaveHearingCaseNoteAction = new SaveHearingCaseNoteAction(
        hearingCaseNoteMock
      );
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      saveNewNote.mockReturnValue(error$);
      expect(effects.saveHearingCaseNote$).toBeObservable(expected);
    });
  });

  describe('extendMagistrateAccess$ @effect', () => {
    it('should extendMagistrateAccess$ : success expect dispatch Action SetUserPermissions', () => {
      const extendHearingAccessMock = {
        action: 'Extend',
        object: 'HearingAccess',
        active: true
      } as ExtendMagistratesAccessPermission;

      const mockPermissions: RolePermission[] = [
        {
          permissionId: 'perm-1',
          description: 'Extend Magistrates Access',
          action: 'Extend',
          object: 'HearingAccess'
        }
      ];

      const fetchUserPermissionsServiceResponse = {
        permissions: mockPermissions,
        groups: [] as UserGroup[],
        switchableRoles: [] as UserRole[]
      };

      const extendMagistrateAccessSpy = jest.spyOn(hearingService, 'extendMagistratesAccess');
      extendMagistrateAccessSpy.mockReturnValue(of(extendHearingAccessMock));
      const triggerAction: ExtendMagistratesAccess = new ExtendMagistratesAccess(
        extendHearingAccessMock
      );

      const fetchUsersPermissionsSpy = jest.spyOn(usersGroupsService, 'fetchUserPermissions');
      fetchUsersPermissionsSpy.mockReturnValue(of(fetchUserPermissionsServiceResponse));

      const expectedAction = UsersGroupsActions.setUserPermissions({
        permissions: mockPermissions,
        userGroups: [],
        switchableRoles: []
      });
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });

      expect(effects.extendMagistrateAccess$).toBeObservable(expected);
    });

    it('should extendMagistrateAccess$ : error expect throw ApiError', () => {
      const extendHearingAccessMock = {
        action: 'Extend',
        object: 'HearingAccess',
        active: true
      } as ExtendMagistratesAccessPermission;

      const extendMagistrateAccessSpy = jest.spyOn(hearingService, 'extendMagistratesAccess');
      const triggerAction: ExtendMagistratesAccess = new ExtendMagistratesAccess(
        extendHearingAccessMock
      );

      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      extendMagistrateAccessSpy.mockReturnValue(error$);

      expect(effects.extendMagistrateAccess$).toBeObservable(expected);
    });
  });

  describe('saveProsecutionCounsels$', () => {
    const saveProsecutionCounselsPayload = {
      hearingId: 'test-1',
      prosecutionCounselsToAdd: [
        {
          id: 'test-1',
          title: 'title-test',
          firstName: 'test-name',
          middleName: 'test-middleName',
          lastName: 'test-lastName',
          status: 'test-status',
          prosecutionCases: [],
          attendanceDays: []
        }
      ] as ProsecutionCounsel[],
      prosecutionCounselsToUpdate: [
        {
          id: 'test-2',
          title: 'title-test-2',
          firstName: 'test-name-2',
          middleName: 'test-middleName-2',
          lastName: 'test-lastName-2',
          status: 'test-status',
          prosecutionCases: [],
          attendanceDays: []
        }
      ] as ProsecutionCounsel[],
      prosecutionCounselsToDelete: ['test-3']
    };

    const inputAction = new SaveProsecutionCounselsAction(saveProsecutionCounselsPayload);

    it('should update the prosecution counsels for a hearing', () => {
      const outputAction = new SaveProsecutionCounselsSuccessAction({
        prosecutionCounselsToAdd: saveProsecutionCounselsPayload.prosecutionCounselsToAdd,
        prosecutionCounselsToUpdate: saveProsecutionCounselsPayload.prosecutionCounselsToUpdate
      });

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      addProsecutionCounsel.mockReturnValue(of(undefined));
      updateProsecutionCounsel.mockReturnValue(of(undefined));
      removeProsecutionCounsel.mockReturnValue(of(undefined));
      expect(effects.saveProsecutionCounsels$).toBeObservable(expected$);
    });

    it('should not update the prosecution counsels for a hearing and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: inputAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      addProsecutionCounsel.mockReturnValue(error$);
      updateProsecutionCounsel.mockReturnValue(of(undefined));
      removeProsecutionCounsel.mockReturnValue(of(undefined));
      expect(effects.saveProsecutionCounsels$).toBeObservable(expected);
    });
  });

  describe('saveDefenceCounsels$', () => {
    const saveDefenceCounselsPayload = {
      hearingId: 'test-1',
      defenceCounselsToAdd: [
        {
          id: 'test-1',
          title: 'title-test',
          firstName: 'test-name',
          middleName: 'test-middleName',
          lastName: 'test-lastName',
          status: 'test-status',
          defendants: ['test-1'],
          attendanceDays: []
        }
      ] as DefenceCounsel[],
      defenceCounselsToUpdate: [
        {
          id: 'test-2',
          title: 'title-test-2',
          firstName: 'test-name-2',
          middleName: 'test-middleName-2',
          lastName: 'test-lastName-2',
          status: 'test-status',
          defendants: ['test-1'],
          attendanceDays: []
        }
      ] as DefenceCounsel[],
      defenceCounselsToDelete: ['test-3']
    };

    const inputAction = new SaveDefenceCounselsAction(saveDefenceCounselsPayload);

    it('should update the defence counsels for a hearing', () => {
      const outputAction = new AddDefenceCounselsSuccessAction({
        defenceCounselsToAdd: saveDefenceCounselsPayload.defenceCounselsToAdd
      });

      const outputAction2 = new EditDefenceCounselsSuccessAction({
        defenceCounselsToEdit: saveDefenceCounselsPayload.defenceCounselsToUpdate
      });

      const outputAction3 = new RemoveDefenceCounselsSuccessAction({
        defenceCounselsToRemove: saveDefenceCounselsPayload.defenceCounselsToDelete
      });

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-(bcd)', { b: outputAction, c: outputAction2, d: outputAction3 });

      addDefenceCounsel.mockReturnValue(of(undefined));
      updateDefenceCounsel.mockReturnValue(of(undefined));
      removeDefenceCounsel.mockReturnValue(of(undefined));
      expect(effects.saveDefenceCounsels$).toBeObservable(expected$);
    });

    it('should not update the prosecution counsels for a hearing and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: inputAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      addDefenceCounsel.mockReturnValue(error$);
      updateDefenceCounsel.mockReturnValue(of(undefined));
      removeDefenceCounsel.mockReturnValue(of(undefined));
      expect(effects.saveDefenceCounsels$).toBeObservable(expected);
    });
  });

  describe('saveCompanyRepresentatives$', () => {
    const saveCompanyRepresentativesPayload = {
      hearingId: 'test-1',
      companyRepresentativesToAdd: [
        {
          id: 'test-1',
          title: 'title-test',
          firstName: 'test-name',
          lastName: 'test-lastName',
          position: 'test-position',
          defendants: ['test-1'],
          attendanceDays: []
        }
      ] as CompanyRepresentative[],
      companyRepresentativesToUpdate: [
        {
          id: 'test-2',
          title: 'title-test-2',
          firstName: 'test-name-2',
          lastName: 'test-lastName-2',
          position: 'test-position',
          defendants: ['test-1'],
          attendanceDays: []
        }
      ] as CompanyRepresentative[],
      companyRepresentativesToDelete: ['test-3']
    };

    const inputAction = new SaveCompanyRepresentativesAction(saveCompanyRepresentativesPayload);

    it('should update the company representatives for a hearing', () => {
      const outputAction = new AddCompanyRepresentativesSuccessAction({
        companyRepresentativesToAdd: saveCompanyRepresentativesPayload.companyRepresentativesToAdd
      });

      const outputAction2 = new EditCompanyRepresentativesSuccessAction({
        companyRepresentativesToEdit:
          saveCompanyRepresentativesPayload.companyRepresentativesToUpdate
      });

      const outputAction3 = new RemoveCompanyRepresentativesSuccessAction({
        companyRepresentativesToRemove:
          saveCompanyRepresentativesPayload.companyRepresentativesToDelete
      });

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-(bcd)', { b: outputAction, c: outputAction2, d: outputAction3 });

      addCompanyRepresentative.mockReturnValue(of(undefined));
      updateCompanyRepresentative.mockReturnValue(of(undefined));
      removeCompanyRepresentative.mockReturnValue(of(undefined));
      expect(effects.saveCompanyRepresentatives$).toBeObservable(expected$);
    });

    it('should not update the prosecution counsels for a hearing and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: inputAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      addCompanyRepresentative.mockReturnValue(error$);
      updateCompanyRepresentative.mockReturnValue(of(undefined));
      removeCompanyRepresentative.mockReturnValue(of(undefined));
      expect(effects.saveCompanyRepresentatives$).toBeObservable(expected);
    });
  });

  describe('saveApplicantCounsels$', () => {
    it('should handle saving the applicant counsels', () => {
      const action = new SaveApplicantCounselsAction({
        added: [
          {
            id: 'applicantCounselId3',
            applicants: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'James',
            lastName: 'Gray',
            status: '',
            title: ''
          }
        ],
        updated: [
          {
            id: 'applicantCounselId1',
            applicants: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'Gordon',
            lastName: 'Cumming',
            status: '',
            title: ''
          }
        ],
        removed: [
          {
            id: 'applicantCounselId2',
            applicants: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'Gordon',
            lastName: 'Cumming',
            status: '',
            title: ''
          }
        ],
        hearingId: 'hearingId'
      });
      const success = new SaveApplicantCounselsSuccessAction(action.payload);

      actions$ = hot('-a-------', { a: action });
      const added$ = cold('--(o|)');
      const updated$ = cold('-(o|)');
      const removed$ = cold('---(o|)');
      const expected = cold('----s---', { s: success });

      (hearingService.addApplicantCounsel as jest.Mock).mockReturnValue(added$);
      (hearingService.updateApplicantCounsel as jest.Mock).mockReturnValue(updated$);
      (hearingService.removeApplicantCounsel as jest.Mock).mockReturnValue(removed$);

      expect(effects.saveApplicantCounsels$).toBeObservable(expected);
      expect(hearingService.addApplicantCounsel).toHaveBeenCalledWith(
        'hearingId',
        action.payload.added[0]
      );
      expect(hearingService.updateApplicantCounsel).toHaveBeenCalledWith(
        'hearingId',
        action.payload.updated[0]
      );
      expect(hearingService.removeApplicantCounsel).toHaveBeenCalledWith(
        'hearingId',
        'applicantCounselId2'
      );
    });

    it('should raise an api error when saving the applicant counsels fails', () => {
      const error = { status: 400 };
      const apiError = new ApiError(error);
      const action = new SaveApplicantCounselsAction({
        added: [],
        updated: [],
        removed: [
          {
            id: 'applicantCounselId2',
            applicants: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'Gordon',
            lastName: 'Cumming',
            status: '',
            title: ''
          }
        ],
        hearingId: '*'
      });

      actions$ = hot('-a--', { a: action });
      const failed$ = cold('--#', undefined, error);
      const expected = cold('---e', { e: apiError });

      (hearingService.removeApplicantCounsel as jest.Mock).mockReturnValue(failed$);

      expect(effects.saveApplicantCounsels$).toBeObservable(expected);
    });
  });

  describe('saveRespondentCounsels$', () => {
    it('should handle saving the respondent counsels', () => {
      const action = new SaveRespondentCounselsAction({
        added: [
          {
            id: 'respondentCounselId3',
            respondents: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'James',
            lastName: 'Gray',
            status: '',
            title: ''
          }
        ],
        updated: [
          {
            id: 'respondentCounselId1',
            respondents: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'Gordon',
            lastName: 'Cumming',
            status: '',
            title: ''
          }
        ],
        removed: [
          {
            id: 'respondentCounselId2',
            respondents: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'Gordon',
            lastName: 'Cumming',
            status: '',
            title: ''
          }
        ],
        hearingId: 'hearingId'
      });
      const success = new SaveRespondentCounselsSuccessAction(action.payload);

      actions$ = hot('-a-------', { a: action });
      const added$ = cold('--(o|)');
      const updated$ = cold('-(o|)');
      const removed$ = cold('---(o|)');
      const expected = cold('----s---', { s: success });

      (hearingService.addRespondentCounsel as jest.Mock).mockReturnValue(added$);
      (hearingService.updateRespondentCounsel as jest.Mock).mockReturnValue(updated$);
      (hearingService.removeRespondentCounsel as jest.Mock).mockReturnValue(removed$);

      expect(effects.saveRespondentCounsels$).toBeObservable(expected);
      expect(hearingService.addRespondentCounsel).toHaveBeenCalledWith(
        'hearingId',
        action.payload.added[0]
      );
      expect(hearingService.updateRespondentCounsel).toHaveBeenCalledWith(
        'hearingId',
        action.payload.updated[0]
      );
      expect(hearingService.removeRespondentCounsel).toHaveBeenCalledWith(
        'hearingId',
        'respondentCounselId2'
      );
    });

    it('should raise an api error when saving the respondent counsels fails', () => {
      const error = { status: 400 };
      const apiError = new ApiError(error);
      const action = new SaveRespondentCounselsAction({
        added: [],
        updated: [],
        removed: [
          {
            id: 'respondentCounselId2',
            respondents: ['applicantId'],
            attendanceDays: ['2019-05-01'],
            firstName: 'Gordon',
            lastName: 'Cumming',
            status: '',
            title: ''
          }
        ],
        hearingId: '*'
      });

      actions$ = hot('-a--', { a: action });
      const failed$ = cold('--#', undefined, error);
      const expected = cold('---e', { e: apiError });

      (hearingService.removeRespondentCounsel as jest.Mock).mockReturnValue(failed$);

      expect(effects.saveRespondentCounsels$).toBeObservable(expected);
    });
  });

  describe('loadDefendantsTrackingStatus$', () => {
    it('should retrieve the defendant tracking status when LOAD_DEFENDANTS_TRACKING_STATUS is triggered', () => {
      const serviceResponse: ElectronicMonitoringDefendant[] = [
        {
          defendantId: 'defendantId',
          trackingStatus: [
            {
              offenceId: 'offenceId',
              emStatus: false,
              emLastModifiedTime: '2019-05-01',
              woaLastModifiedTime: '2019-05-01',
              woaStatus: false
            }
          ]
        }
      ];

      const response = new LoadDefendantsTrackingStatusSuccessAction(serviceResponse);
      const triggerAction = new LoadDefendantsTrackingStatusAction();
      const trackingStatus$ = cold('-a-', { a: serviceResponse });
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('--a', { a: response });
      (hearingService.getDefendantsTrackingStatus as jest.Mock).mockReturnValue(trackingStatus$);

      expect(effects.loadDefendantsTrackingStatus$).toBeObservable(expected);
    });
  });

  describe('getAmendingUserDetails$', () => {
    it('should get user details once the LOAD_AMENDING_USER_DETAILS action is triggered', () => {
      const userDetails = {} as UserDetails;
      const triggerAction = new LoadAmendingUserDetailsSuccessAction(userDetails);
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('--', []);
      expect(effects.getAmendingUserDetails$).toBeObservable(expected);
    });
  });

  describe('getHearingEventLogs$', () => {
    it('should get all the documents for a hearing once the hearing details have been retrieved', () => {
      const hearingId = 'test-hearing-id';
      const hearingDetails = { id: hearingId } as HearingDetail;
      const triggerAction: LoadHearingDetailSuccessAction = new LoadHearingDetailSuccessAction({
        hearing: hearingDetails,
        hearingState: HearingLockState.INITIALISED
      });
      const expectedAction = getSelectedHearingIsRestricted();

      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });

      expect(effects.getHearingEventLogs$).toBeObservable(expected);
    });
  });

  describe('getHearingList$ @effect', () => {
    const payload = {
      date: 'test-date',
      courtCentreId: 'test-courtcentre-id',
      roomId: 'test-roomid'
    };

    it('should getHearingList$ : success expect dispatch Action LoadHearingListSuccessAction', () => {
      const triggerAction: LoadHearingListAction = new LoadHearingListAction(payload);
      const expectedAction: LoadHearingListSuccessAction = new LoadHearingListSuccessAction([
        mockSummary
      ]);
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });
      getHearingsByDate.mockReturnValue(of([mockSummary]));
      expect(effects.getHearingList$).toBeObservable(expected);
    });

    it('should getHearingList$ : success expect dispatch Action LoadHearingListSuccessAction and Action LoadHearingDetailAction', () => {
      const triggerAction: LoadHearingListAction = new LoadHearingListAction({
        ...payload,
        hearingId: 'hearing-id'
      });
      const loadHearingListAction: LoadHearingListSuccessAction = new LoadHearingListSuccessAction([
        mockSummary
      ]);
      const loadHearingDetaildAction: LoadHearingDetailAction = new LoadHearingDetailAction(
        'hearing-id'
      );
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-(bc)-', { b: loadHearingListAction, c: loadHearingDetaildAction });
      getHearingsByDate.mockReturnValue(of([mockSummary]));
      expect(effects.getHearingList$).toBeObservable(expected);
    });

    it('should getHearingList$ : error expect throw ApiError', () => {
      const triggerAction: LoadHearingListAction = new LoadHearingListAction(payload);
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      getHearingsByDate.mockReturnValue(error$);
      expect(effects.getHearingList$).toBeObservable(expected);
    });
  });

  describe('getCheckInHearingList$ @effect', () => {
    const payload = {
      date: '2026-05-22',
      courtCentreId: 'court-centre-id'
    };
    const checkInSummary: any = {
      id: 'hearing-1',
      courtCentre: { roomName: 'Courtroom 01' },
      prosecutionCaseSummaries: []
    };

    it('should dispatch loadCheckInHearingListSuccess on success', () => {
      const triggerAction = HearingActions.loadCheckInHearingList(payload);
      const expectedAction = HearingActions.loadCheckInHearingListSuccess({
        summaries: [checkInSummary]
      });
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });
      getHearingsForCheckIn.mockReturnValue(of([checkInSummary]));
      expect(effects.getCheckInHearingList$).toBeObservable(expected);
      expect(getHearingsForCheckIn).toHaveBeenCalledWith('2026-05-22', 'court-centre-id');
    });

    it('should dispatch ApiError on failure', () => {
      const triggerAction = HearingActions.loadCheckInHearingList(payload);
      const expectedAction = new ApiError('error');
      actions$ = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      getHearingsForCheckIn.mockReturnValue(error$);
      expect(effects.getCheckInHearingList$).toBeObservable(expected);
    });
  });

  describe('getHearingDetails$ @effect', () => {
    const hearingId = 'test-hearingid';
    const hearingDetails = {
      id: hearingId,
      judiciary: [],
      hearingDays: [{ sittingDay: '2020-03-20' }]
    } as HearingDetail;

    it('should getHearingDetails$ : success expect dispatch Action LoadHearingDetailSuccessAction', () => {
      const triggerAction: LoadHearingDetailAction = new LoadHearingDetailAction(hearingId);
      const expectedAction: LoadHearingDetailSuccessAction = new LoadHearingDetailSuccessAction({
        hearing: hearingDetails,
        hearingState: HearingLockState.INITIALISED
      });
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });
      getHearing.mockReturnValue(
        of({ hearing: hearingDetails, hearingState: HearingLockState.INITIALISED })
      );
      expect(effects.getHearingDetails$).toBeObservable(expected);
    });

    it('should getHearingDetails$ : fetch judicial members if there are judiciaries', () => {
      const judicialId = 'mock-judicial-id';
      const judicialMember = { id: 'mock-judicial-id' };

      const triggerAction: LoadHearingDetailAction = new LoadHearingDetailAction(hearingId);
      const expectedAction: LoadHearingDetailSuccessAction = new LoadHearingDetailSuccessAction({
        hearing: {
          ...hearingDetails,
          judiciary: [{ judicialId, judicialMember } as Judiciary]
        },
        hearingState: HearingLockState.INITIALISED
      });

      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });

      getHearing.mockReturnValue(
        of({
          hearing: { ...hearingDetails, judiciary: [{ judicialId }] },
          hearingState: HearingLockState.INITIALISED
        })
      );
      fetchJudicialMembers.mockReturnValue(of([{ id: judicialMember.id }]));

      expect(effects.getHearingDetails$).toBeObservable(expected);
      expect(fetchJudicialMembers).toHaveBeenCalledWith({ ids: judicialId });
    });

    it('should getHearingDetails$ : fetch amended user details if hearing is shared and amendedbyuserId is there', () => {
      const amendedByUserId = 'mock-amended-by-user-id';

      const triggerAction: LoadHearingDetailAction = new LoadHearingDetailAction(hearingId);
      const expectedAction: LoadHearingDetailSuccessAction = new LoadHearingDetailSuccessAction({
        hearing: hearingDetails,
        hearingState: HearingLockState.APPROVAL_REQUESTED,
        amendedByUserId
      });

      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });

      getHearing.mockReturnValue(
        of({
          hearing: hearingDetails,
          hearingState: HearingLockState.APPROVAL_REQUESTED,
          amendedByUserId
        })
      );
      getUserDetails.mockReturnValue(of({ userId: amendedByUserId }));

      expect(effects.getHearingDetails$).toBeObservable(expected);
      expect(getUserDetails).toHaveBeenCalledWith(amendedByUserId);
    });

    it('should getHearingDetails$ : error expect throw ApiError', () => {
      const triggerAction: LoadHearingDetailAction = new LoadHearingDetailAction(hearingId);
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      getHearing.mockReturnValue(error$);
      expect(effects.getHearingDetails$).toBeObservable(expected);
    });
  });

  describe('saveApplicationResponse$ @effect', () => {
    const payload = {
      hearingId: 'test-hearingid',
      body: {
        applicationResponse: {} as CourtApplicationResponse,
        applicationPartyId: 'test-application-partyid'
      }
    };

    it('should saveApplicationResponse$ : success expect dispatch Action UpdateApplicationResponseSuccessAction', () => {
      const triggerAction: UpdateApplicationResponseAction = new UpdateApplicationResponseAction(
        payload
      );
      const expectedAction: UpdateApplicationResponseSuccessAction =
        new UpdateApplicationResponseSuccessAction(payload);
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });
      updateApplicationResponse.mockReturnValue(of(''));
      expect(effects.saveApplicationResponse$).toBeObservable(expected);
    });
    it('should saveApplicationResponse$ : error expect throw ApiError', () => {
      const triggerAction: UpdateApplicationResponseAction = new UpdateApplicationResponseAction(
        payload
      );
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      updateApplicationResponse.mockReturnValue(error$);
      expect(effects.saveApplicationResponse$).toBeObservable(expected);
    });
  });

  describe('saveIntermediaryCounsels$', () => {
    it('should handle saving the intermediary counsels', () => {
      const action = new SaveIntermediaryCounselsAction({
        added: [
          {
            id: 'intermediary1',
            firstName: 'add',
            lastName: 'me',
            attendanceDays: ['2019-05-01'],
            role: IntermediaryType.INTERMEDIARY,
            attendant: {
              defendantId: 'defendantID',
              name: '',
              attendantType: AttendantType.DEFENDANTS
            }
          }
        ],
        updated: [
          {
            id: 'intermediary2',
            firstName: 'udpdate',
            lastName: 'me',
            attendanceDays: ['2019-08-01'],
            role: IntermediaryType.INTERPRETER,
            attendant: {
              defendantId: '',
              name: 'witness name',
              attendantType: AttendantType.WITNESS
            }
          }
        ],
        removed: ['intermediaryIdToRemove'],
        hearingId: 'hearingId'
      });
      const success = new SaveIntermediaryCounselsSuccessAction(action.payload);

      actions$ = hot('-a-------', { a: action });
      const added$ = cold('--(o|)');
      const updated$ = cold('-(o|)');
      const removed$ = cold('---(o|)');
      const expected = cold('----s---', { s: success });

      (hearingService.addIntermediaryCounsel as jest.Mock).mockReturnValue(added$);
      (hearingService.updateIntermediaryCounsel as jest.Mock).mockReturnValue(updated$);
      (hearingService.removeIntermediaryCounsel as jest.Mock).mockReturnValue(removed$);

      expect(effects.saveIntermediaryCounsels$).toBeObservable(expected);
      expect(hearingService.addIntermediaryCounsel).toHaveBeenCalledWith(
        'hearingId',
        action.payload.added[0]
      );
      expect(hearingService.updateIntermediaryCounsel).toHaveBeenCalledWith(
        'hearingId',
        action.payload.updated[0]
      );
      expect(hearingService.removeIntermediaryCounsel).toHaveBeenCalledWith(
        'hearingId',
        'intermediaryIdToRemove'
      );
    });

    it('should raise an api error when saving the intermediary counsels fails', () => {
      const error = { status: 400 };
      const apiError = new ApiError(error);
      const action = new SaveIntermediaryCounselsAction({
        added: [],
        updated: [],
        removed: ['intermediaryIdToRemove'],
        hearingId: '*'
      });

      actions$ = hot('-a--', { a: action });
      const failed$ = cold('--#', undefined, error);
      const expected = cold('---e', { e: apiError });

      (hearingService.removeIntermediaryCounsel as jest.Mock).mockReturnValue(failed$);
      expect(effects.saveIntermediaryCounsels$).toBeObservable(expected);
    });
  });

  describe('searchAvailableHearings$ @effect', () => {
    const formOptions = {
      hearingId: 'test-hearing-id',
      caseUrns: null,
      searchCriterias: [SearchCriteriaAvailableHearingsType.CASE_IN_HEARING]
    } as SearchAvailableHearingsFormOptions;

    const hearings = [validAvailableHearingMock1];
    it('should search available hearings', () => {
      const notes = [{ id: 'note-id' } as ListingNote];
      store.dispatch(
        new LoadHearingDetailSuccessAction({
          hearing: hearingMock as any,
          hearingState: HearingLockState.INITIALISED
        } as HearingDetailResponse)
      );

      const triggerAction = new SearchAvailableHearingsAction(formOptions);
      const outputHearingAction = new SearchAvailableHearingsSuccessAction(hearings);
      const outputNotesAction = loadListingNotesAction({ notes });
      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-(bc)-', { b: outputHearingAction, c: outputNotesAction });
      searchAvailableHearings.mockReturnValue(of({ hearings, notes }));
      splitFutureHearingDays.mockReturnValue(hearings);
      sortByHearingDay.mockReturnValue(hearings);
      expect(effects.searchAvailableHearings$).toBeObservable(expected);
    });
    it('should handle an api error from searching available hearings', () => {
      store.dispatch(
        new LoadHearingDetailSuccessAction({
          hearing: hearingMock as any,
          hearingState: HearingLockState.INITIALISED
        })
      );

      const triggerAction = new SearchAvailableHearingsAction(formOptions);
      const expectedAction: ApiError = new ApiError('error');
      actions$ = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      searchAvailableHearings.mockReturnValue(error$);
      expect(effects.searchAvailableHearings$).toBeObservable(expected);
    });
  });

  describe('vacate trial', () => {
    const vacateTrialParams = {
      hearingId: 'mock-hearing-id',
      vacatedTrialReasonId: 'mock-vacated-trial-reasonid'
    };
    const vacateTrialAction = new VacateTrialAction(vacateTrialParams);

    it('should vacate trial', () => {
      const loadHearingDetailAction = new LoadHearingDetailAction('mock-hearing-id');

      actions$ = hot('-a-----', { a: vacateTrialAction });
      const vacateTrial$ = cold('-(b|)');
      const expected$ = cold('--d', { d: loadHearingDetailAction });
      vacateTrial.mockReturnValue(vacateTrial$);
      expect(effects.vacateTrial$).toBeObservable(expected$);
      expect(vacateTrial).toHaveBeenCalledWith(vacateTrialParams);
    });

    it('should handle an api error from vacate trial', () => {
      const error = { status: 500 };
      const apiError = new ApiError(error);

      actions$ = hot('-a-', { a: vacateTrialAction });
      const hearing$ = cold('-#', null, error);
      const expected$ = cold('--b', { b: apiError });

      vacateTrial.mockReturnValue(hearing$);
      expect(effects.vacateTrial$).toBeObservable(expected$);
    });
  });

  describe('setTrialType$', () => {
    const hearingId = 'test-hearing-123';
    const trialTypeBody = {
      isEffectiveTrial: false,
      trialTypeId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
      crackedIneffectiveSubReasonId: 'sub-1'
    };

    const inputAction = new HearingActions.SetTrialTypeAction({
      hearingId,
      trialTypeBody
    });

    it('should set the trial type for a hearing and dispatch SetTrialTypeActionSuccess', () => {
      const outputAction = new HearingActions.SetTrialTypeActionSuccess({
        hearingId,
        trialTypeSuccessBody: {
          crackedIneffectiveTrial: {
            id: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
            seqNo: 1,
            reasonCode: 'A',
            trialType: 'Cracked',
            jurisdiction: 'CCM',
            reasonShortDescription: `Acceptable guilty plea(s) entered late to some or all charges / counts
                                          on the charge sheet, offered for the first time by the defence`,
            crackedIneffectiveSubReasonId: 'sub-1'
          },
          isEffectiveTrial: false
        }
      });

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      setTrialType.mockReturnValue(of(undefined));
      expect(effects.setTrialType$).toBeObservable(expected$);
    });

    it('should catch error when setting trial type and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');

      actions$ = hot('-a---', { a: inputAction });
      const error$ = cold('#');
      const expected$ = cold('-b', { b: expectedAction });

      setTrialType.mockReturnValue(error$);
      expect(effects.setTrialType$).toBeObservable(expected$);
    });
  });

  describe('setTierAndListType$', () => {
    const hearingId = 'test-hearing-123';
    const tierAndListType = {
      tier: 'TIER_2',
      tier2Subcategory: 'WITNESS_FROM_ABROAD',
      listType: 'TYPE_1',
      fixedDateReason: 'Witness only available in June'
    } as TierAndListType;

    const inputAction = new HearingActions.SetTierAndListTypeAction({
      hearingId,
      tierAndListType
    });

    it('should save the tier and list type and dispatch SetTierAndListTypeActionSuccess', () => {
      const outputAction = new HearingActions.SetTierAndListTypeActionSuccess({
        hearingId,
        tierAndListType
      });

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      setTierAndListType.mockReturnValue(of(undefined));
      expect(effects.setTierAndListType$).toBeObservable(expected$);
      expect(setTierAndListType).toHaveBeenCalledWith(hearingId, tierAndListType);
    });

    it('should catch an error when saving the tier and list type and throw ApiError', () => {
      const expectedAction: ApiError = new ApiError('error');

      actions$ = hot('-a---', { a: inputAction });
      const error$ = cold('#');
      const expected$ = cold('-b', { b: expectedAction });

      setTierAndListType.mockReturnValue(error$);
      expect(effects.setTierAndListType$).toBeObservable(expected$);
    });
  });

  describe('getSelectedHearingIsRestricted$', () => {
    it(`should getSelectedHearingIsRestricted$: dispatch getSelectedHearingIsRestrictedSuccess in case of standalone application`, () => {
      const getPermissionsBySpy = jest.spyOn(usersGroupsService, 'getPermissionsBy');
      getPermissionsBySpy.mockReturnValue(of([]));
      store.setState({
        ...mockState,
        hearings: {
          ...mockState.hearings,
          current: {
            ...mockState.hearings.current,
            prosecutionCases: []
          }
        }
      });
      const triggerAction = getSelectedHearingIsRestricted();
      const expectedAction = getSelectedHearingIsRestrictedSuccess({ isRestricted: true });

      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });

      expect(effects.getSelectedHearingIsRestricted$).toBeObservable(expected);
    });

    it('should getSelectedHearingIsRestricted$ : success expect dispatch Action getSelectedHearingIsRestrictedSuccess', () => {
      const getPermissionsBySpy = jest.spyOn(usersGroupsService, 'getPermissionsBy');
      getPermissionsBySpy.mockReturnValue(of([]));
      const triggerAction = getSelectedHearingIsRestricted();
      const expectedAction = getSelectedHearingIsRestrictedSuccess({ isRestricted: true });

      actions$ = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });

      expect(effects.getSelectedHearingIsRestricted$).toBeObservable(expected);
    });

    it('should getSelectedHearingIsRestricted$ : error expect throw ApiError', () => {
      const getPermissionsBySpy = jest.spyOn(usersGroupsService, 'getPermissionsBy');

      const error = { status: 500 };
      const apiError = new ApiError(error);

      actions$ = hot('-a-', { a: getSelectedHearingIsRestricted });
      const response$ = cold('-#', null, error);
      const expected$ = cold('--c', {
        c: apiError
      });

      getPermissionsBySpy.mockReturnValue(response$);
      expect(effects.getSelectedHearingIsRestricted$).toBeObservable(expected$);
    });
  });

  describe('addWitness$', () => {
    it('should add witness and reload hearing details', () => {
      const hearingId = 'hearingId';
      const witnessName = 'Test Witness';
      const triggerAction = addWitness({ hearingId, witnessName });
      const expectedAction = new HearingActions.LoadHearingDetailAction(hearingId);

      actions$ = hot('-a---', { a: triggerAction });
      const response$ = cold('-(b|)', { b: { success: true } });
      const expected$ = cold('--b', { b: expectedAction });

      jest.spyOn(hearingService, 'addWitness').mockReturnValue(response$);

      expect(effects.addWitness$).toBeObservable(expected$);
      expect(hearingService.addWitness).toHaveBeenCalledWith(hearingId, witnessName);
    });

    it('should handle error when adding witness fails', () => {
      const hearingId = 'hearingId';
      const witnessName = 'Test Witness';
      const error = { status: 500 };
      const apiError = new ApiError(error);

      actions$ = hot('-a---', { a: addWitness({ hearingId, witnessName }) });
      const response$ = cold('-#', null, error);
      const expected$ = cold('--b', { b: apiError });

      jest.spyOn(hearingService, 'addWitness').mockReturnValue(response$);

      expect(effects.addWitness$).toBeObservable(expected$);
      expect(hearingService.addWitness).toHaveBeenCalledWith(hearingId, witnessName);
    });
  });

  describe('listingNotes', () => {
    describe('create listing note', () => {
      const note = {
        hearingDate: '2020-09-16',
        courtRoomId: 'courtRoom-id',
        noteDescription: 'new note'
      };

      it('should create listing notes', () => {
        const response = {
          id: 'note-1',
          date: '2020-09-16',
          courtRoomId: 'courtRoom-id',
          note: 'new note'
        } as ListingNote;

        const createListingNotesuccessAction = createListingNoteSuccess({ note: response });

        actions$ = hot('-a-', { a: createListingNoteAction({ note }) });
        const response$ = cold('-(b|)', { b: response });
        const expected$ = cold('--d', {
          d: createListingNotesuccessAction
        });
        createListingNotes.mockReturnValue(response$);
        expect(effects.createListingNote$).toBeObservable(expected$);
      });

      it('should handle an api error from create listing note', () => {
        const error = { status: 500 };
        const apiError = new ApiError(error);

        actions$ = hot('-a-', { a: createListingNoteAction({ note }) });
        const response$ = cold('-#', null, error);
        const expected$ = cold('--d)', {
          d: apiError
        });

        createListingNotes.mockReturnValue(response$);
        expect(effects.createListingNote$).toBeObservable(expected$);
      });
    });

    describe('update listing note', () => {
      const update = {
        noteId: 'note-id',
        noteDescription: 'new note'
      };

      it('should update a listing note', () => {
        const updateListingNoteSuccessAction = updateListingNoteSuccess(update);

        actions$ = hot('-a-', { a: updateListingNoteAction(update) });
        const response$ = cold('-(b|)', { b: update });
        const expected$ = cold('--d', {
          d: updateListingNoteSuccessAction
        });
        updateListingNote.mockReturnValue(response$);
        expect(effects.updateListingNote$).toBeObservable(expected$);
      });

      it('should handle an api error from update listing note', () => {
        const error = { status: 500 };
        const apiError = new ApiError(error);

        actions$ = hot('-a-', { a: updateListingNoteAction(update) });
        const response$ = cold('-#', null, error);
        const expected$ = cold('--d', {
          d: apiError
        });

        updateListingNote.mockReturnValue(response$);
        expect(effects.updateListingNote$).toBeObservable(expected$);
      });
    });

    describe('delete listing note', () => {
      const deleteNote = {
        noteId: 'note-id'
      };
      it('should delete a listing note', () => {
        const deleteListingNoteSuccessAction = deleteListingNoteSuccess(deleteNote);

        actions$ = hot('-a-', { a: deleteListingNoteAction(deleteNote) });
        const response$ = cold('-(b|)', { b: deleteNote });
        const expected$ = cold('--d', {
          d: deleteListingNoteSuccessAction
        });
        deleteListingNote.mockReturnValue(response$);
        expect(effects.deleteListingNote$).toBeObservable(expected$);
      });

      it('should handle an api error from delete listing note', () => {
        const error = { status: 500 };
        const apiError = new ApiError(error);

        actions$ = hot('-a-', { a: deleteListingNoteAction(deleteNote) });
        const response$ = cold('-#', null, error);
        const expected$ = cold('--d', {
          d: apiError
        });

        deleteListingNote.mockReturnValue(response$);
        expect(effects.deleteListingNote$).toBeObservable(expected$);
      });
    });
  });

  describe('Cracked Ineffective Sub Reasons Effects', () => {
    describe('loadAllCrackedIneffectiveSubReasons$', () => {
      const triggerAction = HearingActions.loadCrackedIneffectiveSubReasons();

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should load all sub reasons successfully', () => {
        const mockSubReasons: CrackedIneffectiveSubReason[] = [
          {
            id: '1',
            subReasonCode: 'SUB1',
            subReasonDesc: 'Sub Reason 1',
            primaryReasonCode: 'CRACKED',
            validFrom: '',
            validTo: ''
          },
          {
            id: '2',
            subReasonCode: 'SUB2',
            subReasonDesc: 'Sub Reason 2',
            primaryReasonCode: 'CRACKED',
            validFrom: '',
            validTo: ''
          }
        ];

        const successAction = HearingActions.loadCrackedIneffectiveSubReasonsSuccess({
          subReasons: mockSubReasons
        });

        getSubReasons.mockReturnValue(cold('-b|', { b: mockSubReasons }));

        actions$ = hot('-a---', { a: triggerAction });
        const expected$ = cold('--c', { c: successAction });

        expect(effects.loadAllCrackedIneffectiveSubReasons$).toBeObservable(expected$);
        expect(getSubReasons).toHaveBeenCalledTimes(1);
      });

      it('should handle error when loading all sub reasons fails', () => {
        const error: ValidationError = { id: 'test-id', message: 'Error loading sub reasons' };
        const failureAction = HearingActions.loadCrackedIneffectiveSubReasonsFailure({ error });

        getSubReasons.mockReturnValue(cold('-#', null, error));

        actions$ = hot('-a---', { a: triggerAction });
        const expected$ = cold('--c', { c: failureAction });

        expect(effects.loadAllCrackedIneffectiveSubReasons$).toBeObservable(expected$);
      });
    });

    describe('loadCrackedIneffectiveSubReasonById$', () => {
      const subReasonId = '123';
      const triggerAction = HearingActions.loadCrackedIneffectiveSubReasonById({
        subReasonId
      });

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should load sub reason by id successfully', () => {
        const mockSubReason: CrackedIneffectiveSubReason = {
          id: '123',
          subReasonCode: 'SUB1',
          subReasonDesc: 'Sub Reason 1',
          primaryReasonCode: 'CRACKED',
          validFrom: '',
          validTo: ''
        };

        const successAction = HearingActions.loadCrackedIneffectiveSubReasonByIdSuccess({
          subReason: mockSubReason
        });

        getSubReasonById.mockReturnValue(cold('-b|', { b: mockSubReason }));

        actions$ = hot('-a---', { a: triggerAction });
        const expected$ = cold('--c', { c: successAction });

        expect(effects.loadCrackedIneffectiveSubReasonById$).toBeObservable(expected$);
        expect(getSubReasonById).toHaveBeenCalledWith(subReasonId);
      });

      it('should handle error when loading sub reason by id fails', () => {
        const error: ValidationError = { id: 'test-id', message: 'Sub reason not found' };
        const failureAction = HearingActions.loadCrackedIneffectiveSubReasonByIdFailure({ error });

        getSubReasonById.mockReturnValue(cold('-#', null, error));

        actions$ = hot('-a---', { a: triggerAction });
        const expected$ = cold('--c', { c: failureAction });

        expect(effects.loadCrackedIneffectiveSubReasonById$).toBeObservable(expected$);
      });
    });
  });
});
