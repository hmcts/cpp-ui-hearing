import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngrx/store';
import * as fromRoot from '../reducers';
import * as fromActions from '../actions/hearing';
import * as fromSelectors from './hearing';
import { getAllOffencesFromHearing, getApplicationSubjectAsCaseDefendant } from './hearing';
import * as mockData from './mock/hearing.json';
import { take } from 'rxjs/operators';
import {
  AppState,
  CourtApplication,
  CourtApplicationParty,
  getCPPDate,
  HearingDetailRedux,
  HearingState,
  HearingSummary,
  MasterDefendant,
  Organisation,
  Person,
  RouterStateUrl
} from '../../core';
import {
  AttendantType,
  AvailableHearing,
  CompanyRepresentative,
  DefenceCounsel,
  DefendantCasesApplications,
  ElectronicMonitoringDefendant,
  GroupedPlea,
  HearingCaseNotes,
  HearingDetail,
  HearingDetailResponse,
  HearingLockState,
  IndividualDefendant,
  IntermediaryCounsel,
  IntermediaryType,
  Plea,
  PleaOption,
  ProsecutionCaseDetails,
  ProsecutionCounsel
} from '../model';
import { mockProsecutionCounsels, mockSelectedOptions } from '../../mock-data/test-mock-data';
import { ProsecutingAuthority } from '../model/prosecuting-authority';
import {
  BreachType,
  CourtApplicationType,
  LinkType,
  OffenceActiveOrderType,
  PleaType,
  ReferenceDataActions,
  SummonsTemplateType
} from '@cpp/reference-data';
import { cloneDeep } from 'lodash-es';
import moment from 'moment';
import { UserDetails, UsersGroupsState } from '@cpp/users-groups';
import { CPPDate } from '../utils/cpp-date';
import { JurisdictionTypes } from '../../hearing-events-log/core/models/jurisdiction-types';
import { RouterReducerState } from '@ngrx/router-store';
import { ListingNote } from '@cpp/scheduling';

let store: Store<fromRoot.AppState>;
const mockHearing = (mockData as any).hearing as HearingDetail;
const mockPleas: GroupedPlea = (mockData as any).groupedPleas[0] as GroupedPlea;
const mockHearingList = (mockData as any).hearingList as HearingSummary[];
const mockPleaTypes = (mockData as any).pleaTypes as PleaType[];

const courtApplications = [
  {
    applicant: {
      masterDefendant: {
        masterDefendantId: '1'
      } as MasterDefendant,
      id: '1',
      organisation: {} as Organisation,
      organisationPersons: [],
      personDetails: {
        firstName: 'Frodo',
        lastName: 'Baggins'
      } as Person,
      prosecutingAuthority: {} as ProsecutingAuthority,
      representationOrganisation: {} as Organisation,
      synonym: ''
    } as CourtApplicationParty,
    applicationDecisionSoughtByDate: '',
    applicationOutcome: null,
    applicationParticulars: '',
    applicationReceivedDate: '',
    applicationReference: '',
    applicationStatus: '',
    courtApplicationPayment: null,
    id: '12',
    judicialResults: [],
    linkedApplicationId: '',
    linkedCaseId: '3',
    outOfTimeReasons: '',
    respondents: [
      {
        personDetails: {
          firstName: 'Sméagol',
          lastName: 'Gollum'
        } as Person
      } as CourtApplicationParty
    ],
    respondentsNA: false,
    subject: {
      id: '01e550d0-d27f-48c9-9e44-783aaa0e62c7'
    },
    type: {
      categoryCode: '',
      jurisdiction: '',
      legislation: 'Legal text and other mumbo jumbo',
      type: 'Bad character applications',
      id: '4'
    } as CourtApplicationType
  }
] as CourtApplication[];

const hearingLockedStates = [
  HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
  HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR,
  HearingLockState.APPROVAL_REQUESTED,
  HearingLockState.VALIDATED
];

const mockAvailableHearings = [
  {
    allocated: true,
    id: 'available-hearing-id',
    jurisdictionType: JurisdictionTypes.MAGISTRATES,
    hearingDays: [
      {
        endTime: '2100-01-01'
      }
    ],
    listedCases: [
      {
        defendants: [
          {
            id: 'defendant-id-1',
            offences: [
              {
                id: 'offence-id-1'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    allocated: true,
    id: 'available-hearing-id-2',
    jurisdictionType: JurisdictionTypes.CROWN,
    hearingDays: [
      {
        endTime: '2100-01-01'
      }
    ],
    listedCases: [
      {
        defendants: [
          {
            id: 'defendant-id-1',
            offences: [
              {
                id: 'offence-id-1'
              }
            ]
          }
        ]
      }
    ]
  }
] as AvailableHearing[];

describe('Hearing selectors', () => {
  let cppDateUtil: CPPDate;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(fromRoot.reducers, {
          runtimeChecks: {},
          initialState: {
            router: {
              state: {
                url: 'url',
                params: {},
                queryParams: {
                  jurisdictionType: JurisdictionTypes.CROWN
                }
              },
              navigationId: 1
            } as RouterReducerState<RouterStateUrl>,
            usersGroups: {
              userDetails: {
                userId: 'userId'
              },
              userGroups: [],
              userServices: []
            } as UsersGroupsState['usersGroups']
          }
        })
      ],
      teardown: { destroyAfterEach: false }
    });

    store = TestBed.inject(Store);
    cppDateUtil = getCPPDate();
  });

  it('should return the hearing summaries stored in the store', () => {
    let result: any;

    store.select(fromSelectors.getHearingSummaries).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(new fromActions.LoadHearingListSuccessAction(mockHearingList));
    expect(result).toEqual(mockHearingList);
  });

  it('should return the hearing summaries grouped by case id', () => {
    let result: any;

    store
      .select(fromSelectors.getHearingSummariesGroupedByCaseId)
      .subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(
      new fromActions.LoadHearingListSuccessAction(
        (mockData as any).hearingSummaries as HearingSummary[]
      )
    );
    expect(result).toMatchSnapshot();
  });

  describe('check-in hearing summary selectors', () => {
    const personDefendantSummary = {
      id: 'hearing-1',
      courtCentre: { roomName: 'Courtroom 01' },
      prosecutionCaseSummaries: [
        {
          id: 'case-1',
          prosecutionCaseIdentifier: { caseURN: 'CASE-URN-1' },
          defendants: [
            {
              id: 'def-1',
              firstName: 'Glennie',
              middleName: 'M',
              lastName: 'Bailey'
            }
          ]
        }
      ]
    };

    const organisationDefendantSummary = {
      id: 'hearing-2',
      courtCentre: { roomName: 'Courtroom 02' },
      prosecutionCaseSummaries: [
        {
          id: 'case-2',
          prosecutionCaseIdentifier: { prosecutionAuthorityReference: 'PAR-9' },
          defendants: [{ id: 'def-2', organisationName: 'Acme Holdings Ltd' }]
        }
      ]
    };

    it('returns raw check-in summaries from the store', () => {
      let result: any;
      store.select(fromSelectors.getCheckInHearingSummaries).subscribe(value => (result = value));

      expect(result).toEqual([]);

      store.dispatch(
        fromActions.loadCheckInHearingListSuccess({ summaries: [personDefendantSummary] })
      );
      expect(result).toEqual([personDefendantSummary]);
    });

    it('groups by courtroom and renders person defendant name from first/middle/last', () => {
      let result: any;
      store
        .select(fromSelectors.getCheckInHearingSummariesGroupedByCaseId)
        .subscribe(value => (result = value));

      store.dispatch(
        fromActions.loadCheckInHearingListSuccess({ summaries: [personDefendantSummary] })
      );

      expect(result).toEqual([
        {
          courtroomName: 'Courtroom 01',
          cases: [
            {
              caseReference: 'CASE-URN-1',
              caseId: 'case-1',
              hearingId: 'hearing-1',
              courtroomName: 'Courtroom 01',
              defendants: [{ hearingId: 'hearing-1', id: 'def-1', name: 'Glennie M BAILEY' }]
            }
          ]
        }
      ]);
    });

    it('falls back to organisationName and prosecutionAuthorityReference when primary fields are absent', () => {
      let result: any;
      store
        .select(fromSelectors.getCheckInHearingSummariesGroupedByCaseId)
        .subscribe(value => (result = value));

      store.dispatch(
        fromActions.loadCheckInHearingListSuccess({ summaries: [organisationDefendantSummary] })
      );

      expect(result).toEqual([
        {
          courtroomName: 'Courtroom 02',
          cases: [
            {
              caseReference: 'PAR-9',
              caseId: 'case-2',
              hearingId: 'hearing-2',
              courtroomName: 'Courtroom 02',
              defendants: [{ hearingId: 'hearing-2', id: 'def-2', name: 'Acme Holdings Ltd' }]
            }
          ]
        }
      ]);
    });
  });

  it('should return the hearing list stored in the store', () => {
    let result: any;

    store.select(fromSelectors.getHearingList).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(new fromActions.LoadHearingListSuccessAction(mockHearingList));
    expect(result).toEqual(mockHearingList);
  });

  it('should return hearing details from the defendants of the current hearing', () => {
    let result: any;

    store.select(fromSelectors.getCurrentHearingPersonDetails).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toMatchSnapshot();
  });

  it('should return individual defendants from the current hearing', () => {
    let result: IndividualDefendant[] = [];

    store
      .select(fromSelectors.getCasesAndApplicationsIndividualDefendants)
      .subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: {
          ...mockHearing,
          prosecutionCases: [
            {
              ...mockHearing.prosecutionCases[0],
              defendants: [
                {
                  ...mockHearing.prosecutionCases[0].defendants[0],
                  masterDefendantId: 'f1dg2d9d-29ec-4934-a932-22a50f223999'
                }
              ]
            }
          ]
        },
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toMatchSnapshot();
    expect(result.length).toBe(1);
  });

  it('should return the urns of the current hearing as a string', () => {
    let result: any;

    store.select(fromSelectors.getCurrentHearingUrn).subscribe(value => (result = value));

    expect(result).toEqual(undefined);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toBe('8C720B32E45B');
  });

  it('should return the urns of the current hearing', () => {
    let result: any;

    store.select(fromSelectors.getCurrentHearingUrnList).subscribe(value => (result = value));

    expect(result).toEqual(undefined);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toEqual(['8C720B32E45B']);
  });

  it('should return the current hearing stored in the store', () => {
    let result: any;

    store.select(fromSelectors.getCurrentHearing).subscribe(value => (result = value));

    expect(result).toEqual(null);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toEqual(mockHearing);
  });

  it('should return the current hearing state stored in the store', () => {
    let result: any;

    store.select(fromSelectors.getCurrentHearingState).subscribe(value => (result = value));

    expect(result).toEqual(null);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toEqual(HearingLockState.INITIALISED);
  });

  it('should return the current hearing amended by user id stored in the store', () => {
    let result: any;

    store
      .select(fromSelectors.getCurrentHearingAmendedByUserId)
      .subscribe(value => (result = value));

    expect(result).toEqual(undefined);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED,
        amendedByUserId: '123'
      })
    );
    expect(result).toEqual('123');
  });

  it('should return the current hearing amended user details stored in the store', () => {
    const mockUserDetails = {
      userId: '123',
      firstName: 'Test',
      lastName: 'Testy',
      email: 'email',
      prosecutingAuthorityAccess: 'asd'
    };

    let result: any;

    store
      .select(fromSelectors.getCurrentHearingAmendedByUserDetails)
      .subscribe(value => (result = value));

    expect(result).toEqual(undefined);

    store.dispatch(new fromActions.LoadAmendingUserDetailsSuccessAction(mockUserDetails));
    expect(result).toEqual(mockUserDetails);
  });

  it('should return the current hearing id stored in the store', () => {
    let result: any;

    store.select(fromSelectors.getCurrentHearingId).subscribe(value => (result = value));

    expect(result).toEqual(null);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toEqual(mockHearing.id);
  });

  it('should return the current case ids stored in the store', () => {
    let result: any;

    store.select(fromSelectors.getCurrentCaseIds).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toEqual([mockHearing.prosecutionCases[0].id]);
  });

  it('should return the current application ids stored in the store', () => {
    let result: any;

    store.select(fromSelectors.getCurrentApplicationIds).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    expect(result).toEqual([mockHearing.courtApplications[0].id]);
  });

  it('should return the courtApplications in the store', () => {
    let result: any;

    store.select(fromSelectors.getHearingCourtApplications).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    expect(result).toEqual(courtApplications);
  });

  it('should return the counsels cache in the store', () => {
    let result: any;

    store.select(fromSelectors.getCounselsCache).subscribe(value => (result = value));

    expect(result).toEqual({ firstNameOpts: [], lastNameOpts: [] });

    store.dispatch(
      new fromActions.SaveProsecutionCounselsSuccessAction({
        prosecutionCounselsToAdd: [mockProsecutionCounsels[0]],
        prosecutionCounselsToUpdate: [mockProsecutionCounsels[1]]
      })
    );

    expect(result).toEqual({
      firstNameOpts: [
        { label: mockProsecutionCounsels[1].firstName, value: mockProsecutionCounsels[1] },
        { label: mockProsecutionCounsels[0].firstName, value: mockProsecutionCounsels[0] }
      ],
      lastNameOpts: [
        { label: mockProsecutionCounsels[1].lastName, value: mockProsecutionCounsels[1] },
        { label: mockProsecutionCounsels[0].lastName, value: mockProsecutionCounsels[0] }
      ]
    });
  });

  it('should return the hearing modified to suit groupedPleas', () => {
    let result: any;

    store.select(fromSelectors.getHearingPleasFromCurrentHearing).subscribe(value => {
      result = value;
      expect(result).toEqual([]);

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockHearing,
          hearingState: HearingLockState.INITIALISED
        })
      );

      expect(result).toEqual(mockPleas);
    });
  });

  it('should return a boolean if the hearing offences have delegated powers', () => {
    let result: any;

    store.select(fromSelectors.getAllPleasHaveDelegatedPowers).subscribe(value => {
      result = value;
      expect(result).toEqual(false);
    });
  });

  it('should return the current hearing stored startDate', () => {
    let result: any;
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store.select(fromSelectors.getCurrentHearingDay).subscribe(value => {
      result = value;
      expect(result).toEqual(mockHearing.hearingDays[0]);
    });
  });

  it('should return the selected hearing date in the store', () => {
    let result: any;
    store.select(fromSelectors.getSelectedHearingDate).subscribe(value => {
      result = value;
    });
    expect(result).toEqual(null);

    store.dispatch(new fromActions.SetSelectedHearingDateAction('2018-01-01'));
    expect(result).toEqual('2018-01-01');
  });

  describe('#getSelectedHearingOrderedDate', () => {
    it('should return hearing date', () => {
      let result;
      const pastDate = moment().subtract(3, 'days').format();

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: {
            ...mockHearing,
            hearingDays: [
              {
                ...mockHearing.hearingDays[0],
                sittingDay: pastDate
              }
            ]
          },
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.getSelectedHearingOrderedDate).subscribe(value => {
        result = value;
      });
      expect(result).toEqual(cppDateUtil.format(pastDate, cppDateUtil.US_DATE_FORMAT));
    });
  });

  describe('#isSelectedHearingInFuture', () => {
    it('should return true if the hearing date is in the future', () => {
      let result: any;
      const futureDate = moment().add(3, 'days').format();

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: {
            ...mockHearing,
            hearingDays: [
              {
                ...mockHearing.hearingDays[0],
                sittingDay: futureDate
              }
            ]
          },
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.isSelectedHearingInFuture).subscribe(value => {
        result = value;
      });
      expect(result).toEqual(true);
    });

    it('should return false if the hearing date is today', () => {
      let result: any;
      const today = moment().format();

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: {
            ...mockHearing,
            hearingDays: [
              {
                ...mockHearing.hearingDays[0],
                sittingDay: today
              }
            ]
          },
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.isSelectedHearingInFuture).subscribe(value => {
        result = value;
      });
      expect(result).toEqual(false);
    });

    it('should return false if the hearing date is in the past', () => {
      let result: any;
      const pastDate = moment().subtract(3, 'days').format();

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: {
            ...mockHearing,
            hearingDays: [
              {
                ...mockHearing.hearingDays[0],
                sittingDay: pastDate
              }
            ]
          },
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.isSelectedHearingInFuture).subscribe(value => {
        result = value;
      });
      expect(result).toEqual(false);
    });
  });

  it('should return the notes for current hearing', () => {
    let result: HearingCaseNotes[];
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    store.select(fromSelectors.getCurrentHearingNotes).subscribe(notes => {
      result = notes;
    });
    expect(result.length > 0).toEqual(true);
  });

  it('should return electronic monitoring offence ids', () => {
    const trackingStatus: ElectronicMonitoringDefendant[] = [
      {
        defendantId: '1d32d9d-29ec-4934-a932-22a50f223966',
        trackingStatus: [
          {
            offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
            emStatus: true,
            emLastModifiedTime: '2019-05-01T14:39:04.942Z',
            woaLastModifiedTime: '2019-05-01T14:39:04.942Z',
            woaStatus: true
          }
        ]
      }
    ];
    expect(fromSelectors.getElectronicMonitoringOfenceIds.projector(mockHearing as any)).toEqual(
      trackingStatus
    );
  });

  it('should return electronic monitoring status', () => {
    const trackingStatus: ElectronicMonitoringDefendant[] = [
      {
        defendantId: '1d32d9d-29ec-4934-a932-22a50f223966',
        trackingStatus: [
          {
            offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
            emStatus: true,
            emLastModifiedTime: '2019-05-01T14:39:04.942Z',
            woaLastModifiedTime: '2019-05-01T14:39:04.942Z',
            woaStatus: true
          }
        ]
      }
    ];
    expect(
      fromSelectors.getElectronicMonitoringOffences.projector(
        '2019-06-01',
        mockHearing.prosecutionCases[0].defendants[0].offences,
        trackingStatus
      )
    ).toEqual(mockHearing.prosecutionCases[0].defendants[0].offences);
  });

  it('should return warrent of arrest status', () => {
    const trackingStatus: ElectronicMonitoringDefendant[] = [
      {
        defendantId: '1d32d9d-29ec-4934-a932-22a50f223966',
        trackingStatus: [
          {
            offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
            emStatus: true,
            emLastModifiedTime: '2019-05-01T14:39:04.942Z',
            woaLastModifiedTime: '2019-05-01T14:39:04.942Z',
            woaStatus: true
          }
        ]
      }
    ];
    expect(
      fromSelectors.getWarrantOfArrestOffences.projector(
        '2019-06-01',
        mockHearing.prosecutionCases[0].defendants[0].offences,
        trackingStatus
      )
    ).toEqual(mockHearing.prosecutionCases[0].defendants[0].offences);
  });

  it('should return the getDefendantByOffenceId', () => {
    let state: AppState;
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    store.pipe(take(1)).subscribe(val => (state = val));

    expect(
      fromSelectors.getDefendantByOffenceId({
        ...state
      })
    ).toMatchSnapshot();

    expect(
      fromSelectors.getDefendantByOffenceId({
        ...state,
        router: {
          state: { params: { offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1' } } as any
        } as RouterReducerState<RouterStateUrl>
      })
    ).toMatchSnapshot();
  });

  it('should return the getCurrentOffence', () => {
    let state: AppState;
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );
    store.pipe(take(1)).subscribe(val => (state = val));

    expect(
      fromSelectors.getCurrentOffence({
        ...state
      })
    ).toMatchSnapshot();

    expect(
      fromSelectors.getCurrentOffence({
        ...state,
        router: {
          state: { params: { offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1' } } as any
        } as RouterReducerState<RouterStateUrl>
      })
    ).toMatchSnapshot();
  });

  it('should return the cases and applications grouped by defendant', () => {
    let result: DefendantCasesApplications[];
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store
      .select(fromSelectors.getCasesAndApplicationsGroupedByDefendant)
      .subscribe(value => (result = value));

    expect(result[0].firstName).toEqual(mockHearing.prosecutionCases[0].defendants[0].firstName);
  });

  it('should return the bulkcase as the first element of prosecutionCases', () => {
    const caseMock = {
      ...mockHearing.prosecutionCases[0],
      isGroupMaster: true,
      defendants: [
        {
          ...mockHearing.prosecutionCases[0].defendants[0],
          id: 'mock-id',
          masterDefendantId: 'mock-id'
        }
      ]
    };
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: { ...mockHearing, prosecutionCases: [...mockHearing.prosecutionCases, caseMock] },
        hearingState: HearingLockState.INITIALISED
      } as unknown as HearingDetailResponse)
    );

    store
      .select(fromSelectors.getCasesAndApplicationsGroupedByDefendant)
      .subscribe((value: any) => {
        expect(value.prosecutionCases[0].isGroupMaster).toBeTruthy();
      });
  });

  it('should get sorted defendants and offences', () => {
    const defendant1 = {
      personDefendant: {
        personDetails: {
          firstName: 'John',
          lastName: 'Applesent',
          dateOfBirth: '2000/02/23'
        }
      },
      offences: [
        {
          offenceDefinitionId: 'id',
          orderIndex: 1,
          count: 1
        }
      ]
    };
    const defendant2 = {
      personDefendant: {
        personDetails: {
          firstName: 'John',
          lastName: 'Applesent',
          dateOfBirth: '1990/02/23'
        }
      },
      offences: [
        {
          offenceDefinitionId: 'id',
          orderIndex: 1,
          count: 1
        }
      ]
    };

    const state = {
      usersGroups: {
        userGroups: [],
        userServices: []
      },
      hearings: {
        current: {
          hearing: {
            jurisdictionType: 'CROWN',
            prosecutionCases: [
              {
                prosecutionCaseIdentifier: {
                  caseURN: 'URN',
                  prosecutionAuthorityCode: 'TEST'
                },
                defendants: [defendant1, defendant2]
              }
            ]
          }
        }
      } as HearingState
    } as AppState;

    const extractedPleas = fromSelectors.getHearingPleasFromCurrentHearing(state);

    expect(extractedPleas).toEqual([
      {
        caseURN: 'URN',
        withCount: [
          {
            count: 1,
            defendants: [defendant2, defendant1],
            offenceLegislation: undefined,
            offenceTitle: undefined,
            wording: undefined
          }
        ],
        withoutCount: []
      }
    ]);
  });

  it('should return the available hearings', () => {
    let result: any;
    store.dispatch(new fromActions.SearchAvailableHearingsSuccessAction([]));

    store.select(fromSelectors.getAvailableHearings).subscribe(value => (result = value));

    expect(result).toEqual([]);
  });

  it('should return if a hearing is boxwork', () => {
    let result: any;
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store.select(fromSelectors.isBoxwork).subscribe(value => (result = value));

    expect(result).toEqual(false);
  });

  it('should return if the current hearing is a standalone boxwork application', () => {
    let result: any;
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store
      .select(fromSelectors.isCurrentHearingStandaloneBoxworkApplication)
      .subscribe(value => (result = value));

    expect(result).toBeFalsy();
  });

  describe('#getCurrentResultLineCaseUrns', () => {
    it('should return the prosecution cases urns of a hearing an array of strings', () => {
      let result: any;
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockHearing,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.getCurrentResultLineCaseUrns).subscribe(value => (result = value));

      expect(result).toEqual([mockHearing.prosecutionCases[0].prosecutionCaseIdentifier.caseURN]);
    });

    it('should return the empty array as the hearing has no prosecution cases', () => {
      let result: any;
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: { prosecutionCases: [] } as HearingDetail,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.getCurrentResultLineCaseUrns).subscribe(value => (result = value));

      expect(result).toEqual([]);
    });
  });

  describe('#extractProsecutionCaseReference', () => {
    const prosecutionCase = mockHearing.prosecutionCases[0];
    it('should extract the caseURN', () => {
      expect(fromSelectors.extractProsecutionCaseReference(prosecutionCase)).toEqual(
        prosecutionCase.prosecutionCaseIdentifier.caseURN
      );
    });

    it('should extract the prosecutionAuthorityCode', () => {
      const mockProsecutionCase = cloneDeep(prosecutionCase);
      mockProsecutionCase.prosecutionCaseIdentifier.caseURN = undefined;
      expect(fromSelectors.extractProsecutionCaseReference(mockProsecutionCase)).toEqual(
        mockProsecutionCase.prosecutionCaseIdentifier.prosecutionAuthorityCode
      );
    });
  });

  describe('getTodayHearingListIds', () => {
    const nativeDate = Date.now;

    beforeEach(() => {
      global.Date.now = jest.fn(() => new Date('2020-02-07T10:20:30Z').getTime());
    });

    afterAll(() => {
      global.Date.now = nativeDate;
    });

    it('should return the same day hearing ids', () => {
      expect(
        fromSelectors.getTodayHearingListIds.projector(
          [
            {
              id: 'hearingId',
              hearingDays: [{ sittingDay: '2020-02-07' }]
            },
            {
              id: 'hearingId1',
              hearingDays: [{ sittingDay: '2020-02-09' }]
            }
          ] as Array<any>,
          {
            id: 'hearingId1'
          } as HearingDetail
        )
      ).toEqual(['hearingId']);
    });

    it('should return the selected hearing id if the hearing list do not have hearingDays property', () => {
      expect(
        fromSelectors.getTodayHearingListIds.projector(
          [
            {
              id: 'hearing-list-id'
            } as any
          ],
          {
            id: 'selected-hearing-id',
            hearingDays: [{ sittingDay: '2020-02-07' }]
          } as HearingDetail
        )
      ).toEqual(['selected-hearing-id']);
    });
  });

  it('should return the standard plea options for the current hearing', () => {
    let result: any;

    store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));

    store.select(fromSelectors.getHearingStandardPleaOptions).subscribe(value => {
      result = value;
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'GUILTY' }),
        expect.objectContaining({ value: 'NOT_GUILTY' })
      ])
    );
  });

  it('should return the standard plea options for the current hearing', () => {
    let result: any;

    store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));

    store.select(fromSelectors.getHearingStandardPleaOptions).subscribe(value => {
      result = value;
    });
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'GUILTY' }),
        expect.objectContaining({ value: 'NOT_GUILTY' })
      ])
    );
  });

  describe('#isVerdictsPageAvailable', () => {
    let copyMockHearing: HearingDetail;
    beforeEach(() => {
      copyMockHearing = cloneDeep(mockHearing);
    });

    it('should return false when the hearing is locked and the amending user is different to the current user', () => {
      let result: any;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].plea = {
        pleaValue: 'NOT_GUILTY'
      } as Plea;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].notifiedPlea = undefined;

      hearingLockedStates.forEach(hearingState => {
        store.dispatch(
          new fromActions.LoadHearingDetailSuccessAction({
            hearing: copyMockHearing,
            hearingState: hearingState,
            amendedByUserId: 'differentUserId'
          })
        );
        store.dispatch(
          ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes })
        );

        store.select(fromSelectors.isVerdictsPageAvailable).subscribe(value => (result = value));

        expect(result).toBeFalsy();
      });
    });

    it('should return true when the hearing is locked and the amending user is the same as the current user', () => {
      let result: any;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].plea = {
        pleaValue: 'NOT_GUILTY'
      } as Plea;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].notifiedPlea = undefined;

      hearingLockedStates.forEach(hearingState => {
        store.dispatch(
          new fromActions.LoadHearingDetailSuccessAction({
            hearing: copyMockHearing,
            hearingState: hearingState,
            amendedByUserId: 'userId'
          })
        );
        store.dispatch(
          ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes })
        );

        store.select(fromSelectors.isVerdictsPageAvailable).subscribe(value => (result = value));

        expect(result).toBeTruthy();
      });
    });

    it('should return true where offence pleas is of type `not guilty` and notified plea is undefined', () => {
      let result: any;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].plea = {
        pleaValue: 'NOT_GUILTY'
      } as Plea;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].notifiedPlea = undefined;
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: copyMockHearing,
          hearingState: HearingLockState.INITIALISED,
          amendedByUserId: 'userId'
        })
      );
      store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));

      store.select(fromSelectors.isVerdictsPageAvailable).subscribe(value => (result = value));

      expect(result).toBeTruthy();
    });

    it('should return false where offence pleas is of type `guilty` and notified plea is undefined', () => {
      let result: any;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].plea = {
        pleaValue: 'GUILTY'
      } as Plea;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].notifiedPlea = undefined;
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: copyMockHearing,
          hearingState: HearingLockState.INITIALISED,
          amendedByUserId: 'userId'
        })
      );
      store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));

      store.select(fromSelectors.isVerdictsPageAvailable).subscribe(value => (result = value));

      expect(result).toBeFalsy();
    });

    it('should return false when there is a bulk prosecution case only', () => {
      let result;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].plea = {
        pleaValue: 'NOT_GUILTY'
      } as any;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].notifiedPlea = undefined;
      copyMockHearing.prosecutionCases[0].isGroupMaster = true;
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: copyMockHearing,
          hearingState: HearingLockState.INITIALISED
        })
      );
      store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));

      store.select(fromSelectors.isVerdictsPageAvailable).subscribe(value => (result = value));

      expect(result).toEqual(false);
    });

    it('should return false where offence pleas is undefined` and notified plea is undefined', () => {
      let result: any;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].plea = undefined;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].notifiedPlea = undefined;
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: copyMockHearing,
          hearingState: HearingLockState.INITIALISED,
          amendedByUserId: 'userId'
        })
      );
      store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));

      store.select(fromSelectors.isVerdictsPageAvailable).subscribe(value => (result = value));

      expect(result).toBeFalsy();
    });

    it('should return true when at least one hearing offence has mode of trial Either Way', () => {
      let result: any;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].plea = undefined;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].notifiedPlea = undefined;
      copyMockHearing.prosecutionCases[0].defendants[0].offences[0].modeOfTrial = 'Either Way';
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: copyMockHearing,
          hearingState: HearingLockState.INITIALISED,
          amendedByUserId: 'userId'
        })
      );
      store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));

      store.select(fromSelectors.isVerdictsPageAvailable).subscribe(value => (result = value));

      expect(result).toBeTruthy();
    });

    it('should false for the appeal application', () => {
      expect(
        fromSelectors.isVerdictsPageAvailable.projector([], [], false, false, {
          courtApplications: [
            {
              type: {
                appealFlag: true
              }
            }
          ]
        } as any)
      ).toBeFalsy();
    });
  });

  describe('#getHearingHasCivilCase', () => {
    it('should return true if any case isCivil', () => {
      let result: boolean;

      const bulkCivilCase: ProsecutionCaseDetails = {
        ...mockHearing.prosecutionCases[0],
        isGroupMember: true,
        isCivil: true,
        defendants: [
          {
            ...mockHearing.prosecutionCases[0].defendants[0],
            defendantId: 'bulk-defendant-id',
            masterDefendantId: 'mock-master-id',
            firstName: 'Michael',
            lastName: 'Wilson'
          }
        ]
      };

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: {
            ...mockHearing,
            prosecutionCases: [...mockHearing.prosecutionCases, bulkCivilCase]
          },
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.getHearingHasCivilCase).subscribe(value => (result = value));

      expect(result).toBeTruthy();
    });
  });

  describe('#getCivilCaseHearingPleaOptions', () => {
    it('should return civil cases plea option', () => {
      store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockHearing,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.getCivilCaseHearingPleaOptions).subscribe(result => {
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ value: 'ADMITS_MAGISTRATES' }),
            expect.objectContaining({ value: 'OPPOSES' }),
            expect.objectContaining({ value: 'CONSENTS' })
          ])
        );
        expect(result.length).toEqual(3);
      });
    });
  });

  it('should return the extra plea options for the current hearing sorted by jurisdiction, MAGS first, CROWN last', () => {
    let result: PleaOption[];
    store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store
      .select(fromSelectors.getHearingExtraPleaOptions('CROWN'))
      .subscribe(value => (result = value));
    expect(result).toEqual(
      expect.arrayContaining([
        expect.not.objectContaining({ value: 'GUILTY' }),
        expect.not.objectContaining({ value: 'NOT_GUILTY' }),
        expect.not.objectContaining({ value: 'INDICATED_GUILTY' })
      ])
    );

    expect(result[0].value).toBe('PARDON');
    expect(result[result.length - 1].value).toBe('NO_PLEA');
  });

  it('should return pleas mapping for the current hearing', () => {
    let result: any;
    store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store.select(fromSelectors.getPleasMapping).subscribe(value => (result = value));
    expect(result).toEqual(
      expect.objectContaining({
        GUILTY: expect.any(String),
        NOT_GUILTY: expect.any(String),
        INDICATED_GUILTY: expect.any(String)
      })
    );
  });

  it('should return the guilty pleas values for the current hearing', () => {
    let result: any;
    store.dispatch(ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes }));
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store.select(fromSelectors.getGuiltyPleasValues).subscribe(value => (result = value));
    expect(result).toEqual(expect.arrayContaining(['GUILTY']));
  });

  describe('#getApplicantEmailAddress', () => {
    it('should return the master defendant applicant email', () => {
      let actualEmail: string;

      const expectedEmail = 'some@email.com';
      const mockHearingData = cloneDeep(mockHearing);
      mockHearingData.courtApplications[0].applicant.masterDefendant = {
        personDefendant: { personDetails: { contact: { primaryEmail: expectedEmail } } }
      } as MasterDefendant;

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockHearingData,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store
        .select(
          fromSelectors.getApplicantEmailForSummonsApplication(
            mockHearingData.courtApplications[0].id
          )
        )
        .subscribe(value => (actualEmail = value));

      expect(actualEmail).toEqual(expectedEmail);
    });

    it('should return the master defendant organisation email', () => {
      let actualEmail: string;

      const expectedEmail = 'legalEntity@email.com';
      const mockhearingData = cloneDeep(mockHearing);
      mockhearingData.courtApplications[0].applicant.masterDefendant = {
        ...mockhearingData.courtApplications[0].applicant.masterDefendant,
        legalEntityDefendant: { organisation: { contact: { primaryEmail: expectedEmail } } }
      } as MasterDefendant;

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockhearingData,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store
        .select(
          fromSelectors.getApplicantEmailForSummonsApplication(mockHearing.courtApplications[0].id)
        )
        .subscribe(value => (actualEmail = value));

      expect(actualEmail).toEqual(expectedEmail);
    });

    it('should return organisation applicant email', () => {
      const expectedEmail = 'org@email.com';

      const applicant: CourtApplicationParty = {
        ...mockHearing.courtApplications[0].applicant,
        masterDefendant: undefined,
        personDetails: undefined
      };

      applicant.organisation = {
        contact: { primaryEmail: expectedEmail }
      } as Organisation;

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockHearing,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store
        .select(
          fromSelectors.getApplicantEmailForSummonsApplication(mockHearing.courtApplications[0].id)
        )
        .subscribe(value => expect(value).toEqual(expectedEmail));
    });

    it('should return person details applicant email', () => {
      const expectedEmail = 'person@email.com';

      const applicant: CourtApplicationParty = {
        ...mockHearing.courtApplications[0].applicant,
        masterDefendant: undefined
      };

      applicant.personDetails = {
        contact: { primaryEmail: expectedEmail }
      } as Person;

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockHearing,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store
        .select(
          fromSelectors.getApplicantEmailForSummonsApplication(mockHearing.courtApplications[0].id)
        )
        .subscribe(value => expect(value).toEqual(expectedEmail));
    });

    it('should return prosecutor applicant email', () => {
      const expectedEmail = 'prosecutor@email.com';

      const applicant: CourtApplicationParty = {
        ...mockHearing.courtApplications[0].applicant,
        masterDefendant: undefined,
        personDetails: undefined,
        organisation: undefined
      };

      applicant.prosecutingAuthority = {
        contact: { primaryEmail: expectedEmail }
      } as ProsecutingAuthority;

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: mockHearing,
          hearingState: HearingLockState.INITIALISED
        })
      );

      store
        .select(
          fromSelectors.getApplicantEmailForSummonsApplication(mockHearing.courtApplications[0].id)
        )
        .subscribe(value => expect(value).toEqual(expectedEmail));
    });
  });

  describe('Future hearings - change of jurisdiction', () => {
    beforeEach(() => {
      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: {
            prosecutionCases: [
              {
                defendants: [
                  {
                    id: 'defendant-id-1',
                    offences: [
                      {
                        id: 'offence-id-1'
                      }
                    ]
                  }
                ]
              }
            ]
          }
        } as HearingDetailResponse)
      );
      store.dispatch(new fromActions.SearchAvailableHearingsSuccessAction(mockAvailableHearings));
    });

    it('should retrieve a list of future hearings', () => {
      let result;
      store.select(fromSelectors.getAvailableFutureHearings).subscribe(value => (result = value));
      expect(result).toEqual(mockAvailableHearings);
    });

    it('should retrieve the available allocated future hearings with offences selected', () => {
      let result;
      store
        .select(fromSelectors.getAvailableFutureHearingsWithOffenceSelected)
        .subscribe(value => (result = value));
      expect(result).toEqual(mockAvailableHearings);
    });

    it('should return true if the application is in the same jurisdiction as any of the allocated future hearings', () => {
      let result;
      store
        .select(fromSelectors.getApplicationHasSameJurisdiction)
        .subscribe(value => (result = value));
      expect(result).toEqual(true);
    });

    it('should return a list of available allocated future hearings if the application is in the same jurisdiction', () => {
      let result;
      store
        .select(fromSelectors.getAvailableFutureHearingsForApplication)
        .subscribe(value => (result = value));
      expect(result).toEqual([mockAvailableHearings[0]]);
    });
  });

  describe('getNonBulkCaseDefendants', () => {
    it('should return non bulk defendants and handle both prosecutionCases and courtApplications', done => {
      const bulkCase = {
        ...mockHearing.prosecutionCases[0],
        isGroupMaster: true,
        defendants: [
          {
            ...mockHearing.prosecutionCases[0].defendants[0],
            defendantId: 'bulk-defendant-id',
            masterDefendantId: 'mock-master-id',
            firstName: 'Michael',
            lastName: 'Wilson'
          }
        ]
      };

      const exampleCourtApplicationType: CourtApplicationType = {
        id: 'type-1',
        code: 'CA01',
        type: 'Application',
        legislation: 'Some legislation',
        categoryCode: 'CAT1',
        linkType: LinkType.STANDALONE,
        jurisdiction: 'JurisdictionName',
        appealFlag: false,
        summonsTemplateType: SummonsTemplateType.GENERIC_APPLICATION,
        validFrom: '2020-01-01',
        hearingCode: 'HC01',
        applicantAppellantFlag: false,
        pleaApplicableFlag: true,
        offenceActiveOrder: OffenceActiveOrderType.OFFENCE,
        commrOfOathFlag: false,
        breachType: BreachType.GENERIC_BREACH,
        courtOfAppealFlag: false,
        courtExtractAvlFlag: true,
        listingNotifTemplate: undefined,
        boxworkNotifTemplate: undefined,
        typeWelsh: undefined,
        legislationWelsh: undefined,
        prosecutorThirdPartyFlag: false,
        spiOutApplicableFlag: false,
        resentencingActivationCode: '',
        prefix: ''
      };

      const courtApplication: CourtApplication = {
        id: 'court-application-1',
        subject: {
          id: 'subject-1',
          personDetails: {
            firstName: 'Anna',
            lastName: 'Smith',
            additionalNationalityCode: '',
            additionalNationalityDescription: '',
            additionalNationalityId: '',
            address: {} as any,
            contact: {} as any,
            dateOfBirth: '',
            disabilityStatus: '',
            documentationLanguageNeeds: '',
            ethnicityCode: '',
            ethnicityDescription: '',
            ethnicityId: '',
            gender: '',
            interpreterLanguageNeeds: '',
            middleName: '',
            nationalInsuranceNumber: '',
            nationalityCode: '',
            nationalityDescription: '',
            nationalityId: '',
            occupation: '',
            occupationCode: '',
            specificRequirements: '',
            title: ''
          }
        },
        applicant: {
          id: 'applicant-1'
        },
        defendantASN: '',
        name: '',
        legislation: '',
        applicationDecisionSoughtByDate: '',
        applicationOutcome: undefined,
        applicationParticulars: '',
        applicationReceivedDate: '',
        applicationReference: '',
        applicationStatus: '',
        courtApplicationPayment: undefined,
        dueDate: undefined,
        judicialResults: undefined,
        linkedApplicationId: '',
        linkedCaseId: '',
        outOfTimeReasons: '',
        respondents: [],
        courtApplicationCases: undefined,
        courtOrder: undefined,
        respondentsNA: false,
        type: exampleCourtApplicationType,
        isStandaloneApplication: false,
        parentApplicationId: undefined,
        allegationOrComplaintStartDate: undefined,
        allegationOrComplaintEndDate: undefined,
        commissionerOfOath: false,
        hasSummonsSupplied: false,
        summonsAgreedHearingDate: undefined,
        futureSummonsHearing: undefined,
        plea: undefined,
        indicatedPlea: undefined,
        convictionDate: undefined,
        verdict: undefined,
        modeOfTrial: undefined,
        allocationDecision: undefined,
        isGroupCaseApplication: false
      };

      store.dispatch(
        new fromActions.LoadHearingDetailSuccessAction({
          hearing: {
            ...mockHearing,
            prosecutionCases: [...mockHearing.prosecutionCases, bulkCase],
            courtApplications: [courtApplication]
          },
          hearingState: HearingLockState.INITIALISED
        })
      );

      store.select(fromSelectors.getNonBulkCaseDefendants).subscribe(result => {
        // Should exclude the bulk defendant from defendants list
        expect(result.defendants.length).toBeGreaterThan(0);
        expect(result.defendants.some(d => 'personDefendant' in d)).toBe(false);
        expect(result.hasBulkDefendant).toBe(true);

        // Checking that defendantId of bulk defendant is excluded
        expect(
          result.defendants.some(d => 'defendantId' in d && d.defendantId === 'bulk-defendant-id')
        ).toBe(false);

        done();
      });
    });
  });
});

describe('getListingNotes', () => {
  it('should get listing notes from store', () => {
    const state = {
      hearings: {
        listingNotes: [{ id: 'note-id' }]
      } as HearingState
    } as AppState;

    const notes = fromSelectors.getListingNotes(state);

    expect(notes).toEqual([{ id: 'note-id' }]);
  });
});

describe('isCurrentHearingRestricted', () => {
  it('should get isCurrentHearingRestricted from store', () => {
    const state = {
      hearings: {
        isRestricted: true
      } as HearingState
    } as AppState;

    const isHearingRestricted = fromSelectors.isCurrentHearingRestricted(state);

    expect(isHearingRestricted).toEqual(true);
  });
});

describe('isCurrentHearingInWelshCourt', () => {
  it('should get isCurrentHearingInWelshCourt from store', () => {
    const state = {
      referenceData: {
        organisationUnits: [
          { id: '123', isWelsh: 'true', oucodeL3Code: 'test', oucodeL3Name: 'test' }
        ]
      },
      hearings: {
        current: {
          hearing: {
            courtCentre: {
              id: '123'
            }
          }
        },
        isRestricted: true
      } as HearingState
    } as AppState;

    const isCurrentHearingInWelshCourt = fromSelectors.isCurrentHearingInWelshCourt(state);

    expect(isCurrentHearingInWelshCourt).toEqual(true);
  });

  it('should get isCurrentHearingInWelshCourt from store', () => {
    const state = {
      referenceData: {
        organisationUnits: [{ id: '123', oucodeL3Code: 'test', oucodeL3Name: 'test' }]
      },
      hearings: {
        current: {
          hearing: {
            courtCentre: {
              id: '123'
            }
          }
        },
        isRestricted: true
      } as HearingState
    } as AppState;

    const isCurrentHearingInWelshCourt = fromSelectors.isCurrentHearingInWelshCourt(state);

    expect(isCurrentHearingInWelshCourt).toEqual(false);
  });
});

describe('#canUserAmendHearing', () => {
  it('should return true if hearing state is initialised and shared', () => {
    const amendAllowedStates = [HearingLockState.INITIALISED, HearingLockState.SHARED];

    amendAllowedStates.forEach(hearingState => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId: 'user-1234' } }
      } as AppState;

      const canUserAmendHearing = fromSelectors.canUserAmendHearing(state);

      expect(canUserAmendHearing).toEqual(true);
    });
  });

  it('should return false if hearing state is approval requested and validated', () => {
    const amendDisabledStates = [HearingLockState.APPROVAL_REQUESTED, HearingLockState.VALIDATED];

    amendDisabledStates.forEach(hearingState => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId: 'user-1234' } }
      } as AppState;

      const canUserAmendHearing = fromSelectors.canUserAmendHearing(state);

      expect(canUserAmendHearing).toEqual(false);
    });
  });

  it('should return false if hearing is locked by other user', () => {
    const amendLockedStates = [
      HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
      HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
    ];

    amendLockedStates.forEach(hearingState => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState,
            amendedByUserId: 'user-4321'
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId: 'user-1234' } }
      } as AppState;

      const canUserAmendHearing = fromSelectors.canUserAmendHearing(state);

      expect(canUserAmendHearing).toEqual(false);
    });
  });

  it('should return true if hearing is locked by the same user', () => {
    const amendLockedStates = [
      HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
      HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
    ];

    amendLockedStates.forEach(hearingState => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState,
            amendedByUserId: 'user-1234'
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId: 'user-1234' } }
      } as AppState;

      const canUserAmendHearing = fromSelectors.canUserAmendHearing(state);

      expect(canUserAmendHearing).toEqual(true);
    });
  });
});

describe('#getAmendmentMessage', () => {
  it('should return LOCKED_BY_SOMEONE_ELSE string if hearing is locked by other user', () => {
    const lockedStates = [
      HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
      HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
    ];

    lockedStates.forEach(hearingState => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState,
            amendedByUserId: 'user-4321',
            amendedByUser: { firstName: 'John', lastName: 'Mocky' } as UserDetails
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId: 'user-1234' } }
      } as AppState;

      const getAmendmentMessage = fromSelectors.getAmendmentMessage(state);

      expect(getAmendmentMessage).toEqual({
        message: 'PAGE_HEADER.LOCKED_BY_SOMEONE_ELSE',
        user: 'John Mocky'
      });
    });
  });

  it('should return APPROVAL_REQUESTED string if hearing is approval request state', () => {
    const amendingUserId = 'amendingUserId';
    const otherUserId = 'otherUserId';

    [amendingUserId, otherUserId].forEach(userId => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState: HearingLockState.APPROVAL_REQUESTED,
            amendedByUserId: userId,
            amendedByUser: { firstName: 'John', lastName: 'Mocky' } as UserDetails
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId } }
      } as AppState;

      const getAmendmentMessage = fromSelectors.getAmendmentMessage(state);

      expect(getAmendmentMessage).toEqual({ message: 'PAGE_HEADER.APPROVAL_REQUESTED' });
    });
  });

  it('should return VALIDATED string if hearing is validated state', () => {
    const amendingUserId = 'amendingUserId';
    const otherUserId = 'otherUserId';

    [amendingUserId, otherUserId].forEach(userId => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState: HearingLockState.VALIDATED,
            amendedByUserId: userId,
            amendedByUser: { firstName: 'John', lastName: 'Mocky' } as UserDetails
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId } }
      } as AppState;

      const getAmendmentMessage = fromSelectors.getAmendmentMessage(state);

      expect(getAmendmentMessage).toEqual({ message: 'PAGE_HEADER.VALIDATED' });
    });
  });

  it('should return empty string if hearing is shared or initialised', () => {
    const freeStates = [HearingLockState.SHARED, HearingLockState.INITIALISED];

    freeStates.forEach(hearingState => {
      const state = {
        hearings: {
          current: {
            hearing: { ...mockHearing },
            hearingState,
            amendedByUserId: 'user-1234',
            amendedByUser: { firstName: 'John', lastName: 'Mocky' } as UserDetails
          } as HearingDetailRedux
        } as HearingState,
        usersGroups: { userDetails: { userId: 'user-1234' } }
      } as AppState;

      const getAmendmentMessage = fromSelectors.getAmendmentMessage(state);

      expect(getAmendmentMessage).toEqual({ message: '' });
    });
  });
});

describe('#getDefendantsFromAllCases', () => {
  it('should return the defendant from all cases', () => {
    let result: any;
    store.dispatch(
      new fromActions.LoadHearingDetailSuccessAction({
        hearing: mockHearing,
        hearingState: HearingLockState.INITIALISED
      })
    );

    store.select(fromSelectors.getDefendantsFromAllCases).subscribe(value => {
      result = value;
    });

    const [expectedDefedant] = mockHearing.prosecutionCases[0].defendants;
    const [offence] = expectedDefedant.offences;

    expect(result).toStrictEqual([
      {
        ...expectedDefedant,
        offences: [{ ...offence, verdict: { ...offence.verdict, applicationId: undefined } }]
      }
    ]);
  });
});

describe('getListingNotesMap', () => {
  it('should get map of listing notes', () => {
    const listingNotes = [
      {
        id: 'note-id',
        courtRoomId: 'courtRoom-id-1',
        note: 'note-1',
        date: '2020-09-16'
      },
      {
        id: 'note-id-2',
        courtRoomId: 'courtRoom-id-1',
        note: 'note-2',
        date: '2020-09-22'
      },
      {
        id: 'note-id-3',
        courtRoomId: 'courtRoom-id-2',
        note: 'note-3',
        date: '2020-09-16'
      },
      {
        id: 'note-id-4',
        courtRoomId: 'courtRoom-id-2',
        note: 'note-4',
        date: '2020-09-22'
      }
    ] as ListingNote[];

    const expectedMap = {
      'courtRoom-id-1': {
        '2020-09-16': {
          id: 'note-id',
          courtRoomId: 'courtRoom-id-1',
          note: 'note-1',
          date: '2020-09-16'
        },
        '2020-09-22': {
          id: 'note-id-2',
          courtRoomId: 'courtRoom-id-1',
          note: 'note-2',
          date: '2020-09-22'
        }
      },
      'courtRoom-id-2': {
        '2020-09-16': {
          id: 'note-id-3',
          courtRoomId: 'courtRoom-id-2',
          note: 'note-3',
          date: '2020-09-16'
        },
        '2020-09-22': {
          id: 'note-id-4',
          courtRoomId: 'courtRoom-id-2',
          note: 'note-4',
          date: '2020-09-22'
        }
      }
    } as Record<string, Record<string, ListingNote>>;

    expect(fromSelectors.getListingNotesMap.projector(listingNotes)).toEqual(expectedMap);
  });
});

describe('getListingNoteByCourtRoomAndDate', () => {
  it('should get listing note by court room and date', () => {
    const courtRoom = 'courtRoom-id-1';
    const date = '2020-09-16';
    const listingNoteMap = {
      'courtRoom-id-1': {
        '2020-09-16': {
          id: 'note-id',
          courtRoomId: 'courtRoom-id-1',
          note: 'note-1',
          date: '2020-09-16'
        },
        '2020-09-22': {
          id: 'note-id-2',
          courtRoomId: 'courtRoom-id-1',
          note: 'note-2',
          date: '2020-09-22'
        }
      },
      'courtRoom-id-2': {
        '2020-09-16': {
          id: 'note-id-3',
          courtRoomId: 'courtRoom-id-2',
          note: 'note-3',
          date: '2020-09-16'
        },
        '2020-09-22': {
          id: 'note-id-4',
          courtRoomId: 'courtRoom-id-2',
          note: 'note-4',
          date: '2020-09-22'
        }
      }
    } as Record<string, Record<string, ListingNote>>;

    const expectedListingNote = {
      id: 'note-id',
      courtRoomId: 'courtRoom-id-1',
      note: 'note-1',
      date: '2020-09-16'
    } as ListingNote;

    const getListingNoteSelector = fromSelectors.getListingNoteByCourtRoomAndDate(courtRoom, date);

    expect(getListingNoteSelector.projector(listingNoteMap)).toEqual(expectedListingNote);
  });

  describe('getAllOffencesFromHearing', () => {
    it('should select all offences from hearing', () => {
      expect(
        getAllOffencesFromHearing.projector({
          prosecutionCases: [
            {
              defendants: [
                {
                  offences: [
                    {
                      offenceTitle: 'Defendant offence'
                    }
                  ]
                }
              ]
            } as any
          ],
          courtApplications: [
            {
              courtOrder: {
                courtOrderOffences: [
                  {
                    offence: {
                      offenceTitle: 'Court order offence'
                    }
                  }
                ]
              },
              courtApplicationCases: [
                {
                  offences: [
                    {
                      offenceTitle: 'Application offence'
                    }
                  ]
                }
              ]
            }
          ]
        } as any)
      ).toMatchSnapshot();
    });

    it('should not throw and still return application offences when prosecutionCases is omitted', () => {
      const select = () =>
        getAllOffencesFromHearing.projector({
          courtApplications: [
            {
              courtApplicationCases: [
                {
                  offences: [
                    {
                      offenceTitle: 'Application offence'
                    }
                  ]
                }
              ]
            }
          ]
        } as any);

      expect(select).not.toThrow();
      expect(select()).toEqual([{ offenceTitle: 'Application offence' }]);
    });
  });

  describe('getApplicationSubjectAsCaseDefendant', () => {
    it('should select all subject person defendants from hearing', () => {
      expect(
        getApplicationSubjectAsCaseDefendant([
          {
            subject: {
              id: 'subjectId',
              masterDefendant: {
                masterDefendantId: 'master-defendant-id',
                personDefendant: {
                  personDetails: {
                    firstName: 'F',
                    lastName: 'L'
                  }
                }
              }
            },
            courtOrder: {
              courtOrderOffences: [
                {
                  offence: {
                    offenceTitle: 'Court order offence'
                  }
                }
              ]
            },
            courtApplicationCases: [
              {
                offences: [
                  {
                    offenceTitle: 'Application offence'
                  }
                ]
              }
            ]
          } as CourtApplication
        ])
      ).toMatchSnapshot();
    });
    it('should select all subject legal entity defendants from hearing', () => {
      expect(
        getApplicationSubjectAsCaseDefendant([
          {
            subject: {
              id: 'subjectId',
              masterDefendant: {
                masterDefendantId: 'master-defendant-id',
                legalEntityDefendant: {
                  organisation: {
                    name: 'Org'
                  }
                }
              }
            },
            courtOrder: {
              courtOrderOffences: [
                {
                  offence: {
                    offenceTitle: 'Court order offence'
                  }
                }
              ]
            },
            courtApplicationCases: [
              {
                offences: [
                  {
                    offenceTitle: 'Application offence'
                  }
                ]
              }
            ]
          } as CourtApplication
        ])
      ).toMatchSnapshot();
    });
  });

  describe('isPleaApplicable', () => {
    it('should return false when the hearing is locked and the amending user is different to the current user', () => {
      const copyMockHearing = cloneDeep(mockHearing);
      let result: any;

      hearingLockedStates.forEach(hearingState => {
        store.dispatch(
          new fromActions.LoadHearingDetailSuccessAction({
            hearing: copyMockHearing,
            hearingState: hearingState,
            amendedByUserId: 'differentUserId'
          })
        );

        store.select(fromSelectors.isPleaApplicable).subscribe(value => (result = value));

        expect(result).toBeFalsy();
      });
    });

    it('should return true when the hearing is locked and the amending user is the same as the current user', () => {
      const copyMockHearing = cloneDeep(mockHearing);
      let result: any;

      hearingLockedStates.forEach(hearingState => {
        store.dispatch(
          new fromActions.LoadHearingDetailSuccessAction({
            hearing: {
              ...copyMockHearing,
              courtApplications: []
            },
            hearingState: hearingState,
            amendedByUserId: 'userId'
          })
        );
        store.dispatch(
          ReferenceDataActions.loadPleaTypesSuccess({ pleaStatusTypes: mockPleaTypes })
        );

        store.select(fromSelectors.isPleaApplicable).subscribe(value => (result = value));

        expect(result).toBeTruthy();
      });
    });

    it('should select true if hearing has prosecution cases', () => {
      expect(
        fromSelectors.isPleaApplicable.projector(
          {
            prosecutionCases: [
              {
                id: 'caseId'
              }
            ]
          } as any,
          false,
          false
        )
      ).toBeTruthy();
    });

    it('should select false if hearing has prosecution cases and court applications with please applicable false', () => {
      expect(
        fromSelectors.isPleaApplicable.projector(
          {
            prosecutionCases: [],
            courtApplications: [
              {
                type: {
                  pleaApplicableFlag: false
                }
              }
            ] as any
          } as any,
          false,
          false
        )
      ).toBeFalsy();
    });

    it('should select false if hearing has appeal applications', () => {
      expect(
        fromSelectors.isPleaApplicable.projector(
          {
            prosecutionCases: [],
            courtApplications: [
              {
                type: {
                  appealFlag: true
                }
              }
            ] as any
          } as any,
          false,
          false
        )
      ).toBeFalsy();
    });

    it('should select true if court application has court order', () => {
      expect(
        fromSelectors.isPleaApplicable.projector(
          {
            courtApplications: [
              {
                type: {
                  pleaApplicableFlag: true
                },
                courtOrder: {
                  courtOrderOffences: [
                    {
                      offence: {
                        offenceTitle: 'Court order offence'
                      }
                    }
                  ]
                }
              }
            ]
          } as any,
          false,
          false
        )
      ).toBeTruthy();
    });

    it('should select true if court application has offences', () => {
      expect(
        fromSelectors.isPleaApplicable.projector(
          {
            courtApplications: [
              {
                type: {
                  pleaApplicableFlag: true
                },
                courtApplicationCases: [
                  {
                    offences: [
                      {
                        offenceTitle: 'Application offence'
                      }
                    ]
                  }
                ]
              }
            ]
          } as any,
          false,
          false
        )
      ).toBeTruthy();
    });

    it('should select false standalone court application and plea is not applicable', () => {
      expect(
        fromSelectors.isPleaApplicable.projector(
          {
            courtApplications: [
              {
                type: {
                  pleaApplicableFlag: false
                }
              }
            ]
          } as any,
          false,
          false
        )
      ).toBeFalsy();
    });

    describe('getSelectedOptions', () => {
      it('should get selected options from store', () => {
        const state = {
          hearings: {
            selectedOptions: mockSelectedOptions
          } as HearingState
        } as AppState;
        const selectedOptions = fromSelectors.getSelectedOptions(state);

        expect(selectedOptions).toEqual(mockSelectedOptions);
      });
    });

    describe('getCurrentHearingWitnesses', () => {
      it('should select witnesses from hearing', () => {
        expect(
          fromSelectors.getCurrentHearingWitnesses({
            hearings: {
              current: {
                witnesses: ['witness1', 'witness2']
              } as HearingDetailRedux
            }
          } as AppState)
        ).toEqual(['witness1', 'witness2']);
      });
    });
  });
});

describe('Read-only "Hearing parties" selectors', () => {
  const DAY = '2024-05-01';

  const buildState = (hearing: Partial<HearingDetail> | null): AppState =>
    ({
      hearings: {
        current: { hearing },
        selectedHearingDate: DAY
      } as HearingState
    } as AppState);

  const prosecutionCounsel = (overrides: Partial<ProsecutionCounsel>): ProsecutionCounsel => ({
    id: '',
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    status: '',
    prosecutionCases: [],
    attendanceDays: [],
    ...overrides
  });

  const defenceCounsel = (overrides: Partial<DefenceCounsel>): DefenceCounsel => ({
    id: '',
    title: '',
    firstName: '',
    middleName: '',
    lastName: '',
    status: '',
    defendants: [],
    attendanceDays: [],
    ...overrides
  });

  const companyRepresentative = (
    overrides: Partial<CompanyRepresentative>
  ): CompanyRepresentative => ({
    id: '',
    title: '',
    firstName: '',
    lastName: '',
    position: '',
    defendants: [],
    attendanceDays: [],
    ...overrides
  });

  const intermediary = (overrides: Partial<IntermediaryCounsel>): IntermediaryCounsel => ({
    id: '',
    firstName: '',
    lastName: '',
    role: IntermediaryType.INTERPRETER,
    attendant: { attendantType: AttendantType.DEFENDANTS, name: '' },
    attendanceDays: [],
    ...overrides
  });

  describe('#getCurrentHearingProsecutionCounsels', () => {
    it('should return the prosecution counsels attending on the selected day', () => {
      const state = buildState({
        prosecutionCases: [],
        prosecutionCounsels: [
          prosecutionCounsel({ id: 'p1', attendanceDays: [DAY] }),
          prosecutionCounsel({ id: 'p2', attendanceDays: ['2024-01-01'] })
        ]
      });

      expect(fromSelectors.getCurrentHearingProsecutionCounsels(state).map(c => c.id)).toEqual([
        'p1'
      ]);
    });

    it('should return [] when the hearing payload omits prosecution counsels', () => {
      const state = buildState({ prosecutionCases: [] });
      expect(fromSelectors.getCurrentHearingProsecutionCounsels(state)).toEqual([]);
    });

    it('should return [] when the hearing has no prosecution cases', () => {
      const state = buildState({
        prosecutionCounsels: [prosecutionCounsel({ id: 'p1', attendanceDays: [DAY] })]
      });
      expect(fromSelectors.getCurrentHearingProsecutionCounsels(state)).toEqual([]);
    });
  });

  describe('#getCurrentHearingDefenceCounsels', () => {
    it('should return the defence counsels for the day, sorted by first defendant', () => {
      const state = buildState({
        prosecutionCases: [],
        defenceCounsels: [
          defenceCounsel({ id: 'd2', defendants: ['def-b'], attendanceDays: [DAY] }),
          defenceCounsel({ id: 'd1', defendants: ['def-a'], attendanceDays: [DAY] })
        ]
      });

      expect(fromSelectors.getCurrentHearingDefenceCounsels(state).map(c => c.id)).toEqual([
        'd1',
        'd2'
      ]);
    });

    it('should return [] when the hearing payload omits defence counsels', () => {
      const state = buildState({ prosecutionCases: [] });
      expect(fromSelectors.getCurrentHearingDefenceCounsels(state)).toEqual([]);
    });
  });

  describe('#getCurrentHearingCompanyRepresentatives', () => {
    it('should return the company representatives for the day, sorted by first defendant', () => {
      const state = buildState({
        prosecutionCases: [],
        companyRepresentatives: [
          companyRepresentative({ id: 'cr2', defendants: ['def-b'], attendanceDays: [DAY] }),
          companyRepresentative({ id: 'cr1', defendants: ['def-a'], attendanceDays: [DAY] })
        ]
      });

      expect(fromSelectors.getCurrentHearingCompanyRepresentatives(state).map(c => c.id)).toEqual([
        'cr1',
        'cr2'
      ]);
    });

    it('should return [] when company representatives are omitted from the new hearing', () => {
      const state = buildState({ prosecutionCases: [] });
      expect(fromSelectors.getCurrentHearingCompanyRepresentatives(state)).toEqual([]);
    });
  });

  describe('#getCurrentHearingIntermediaries', () => {
    it('should return the intermediaries attending on the selected day for a prosecution hearing', () => {
      const state = buildState({
        prosecutionCases: [],
        intermediaries: [
          intermediary({ id: 'i1', attendanceDays: [DAY] }),
          intermediary({ id: 'i2', attendanceDays: ['2024-01-01'] })
        ]
      });

      expect(fromSelectors.getCurrentHearingIntermediaries(state).map(c => c.id)).toEqual(['i1']);
    });

    it('should return [] when intermediaries are omitted from the new hearing', () => {
      const state = buildState({ prosecutionCases: [] });
      expect(fromSelectors.getCurrentHearingIntermediaries(state)).toEqual([]);
    });

    it('should keep every intermediary on an application hearing (not day-filtered)', () => {
      const state = buildState({
        courtApplications: [],
        intermediaries: [intermediary({ id: 'i1', attendanceDays: ['2024-01-01'] })]
      });

      expect(fromSelectors.getCurrentHearingIntermediaries(state).map(c => c.id)).toEqual(['i1']);
    });
  });

  it('should return [] for every role when there is no current hearing', () => {
    const state = buildState(null);

    expect(fromSelectors.getCurrentHearingProsecutionCounsels(state)).toEqual([]);
    expect(fromSelectors.getCurrentHearingDefenceCounsels(state)).toEqual([]);
    expect(fromSelectors.getCurrentHearingCompanyRepresentatives(state)).toEqual([]);
    expect(fromSelectors.getCurrentHearingIntermediaries(state)).toEqual([]);
  });
});
