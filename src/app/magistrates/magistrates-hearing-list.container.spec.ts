import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppState } from '../core';
import { HearingSummary } from './interfaces/magistrates-hearing.interface';
import { Component } from '@angular/core';
import { MagistratesHearingListContainer } from './magistrates-hearing-list.container';
import { provideTranslateService } from '@ngx-translate/core';
import { AppConfigService } from '../config';
import { OrganisationUnit } from '@cpp/reference-data';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  EXPECTED_HEARING_USER_PERMISSIONS,
  HearingUserPermissions
} from '../config/user-permissions';

jest.mock('../core/utils/cpp-date', () => {
  const actual = jest.requireActual('../core/utils/cpp-date');

  class MockCPPDate extends actual.CPPDate {
    getCurrentDate(): Date {
      return new Date('2024-08-28T20:00:00.000Z');
    }
  }

  return {
    ...actual,
    CPPDate: MockCPPDate,
    getCPPDate: () => new MockCPPDate()
  };
});

describe('MagistratesHearingListContainer', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  const baseUrlSpy = jest.fn().mockReturnValue('http://base-url');
  let store: MockStore<AppState>;

  const createState = () => {
    return {
      magistratesHearings: {
        summaries: buildHearings()
      },
      referenceData: {
        organisationUnits: buildOrganisationUnits()
      },
      usersGroups: {
        userGroups: [],
        permissionsMap: {
          permissionId: {
            action: 'Extend',
            object: 'HearingAccess',
            target: 'hearing-id-test',
            permissionId: 'permissionId'
          }
        },
        switchableRoles: [],
        userServices: []
      }
    } as any;
  };

  const mockState = createState();

  const mockUserPermissions: HearingUserPermissions = {
    editCrackedIneffective: { object: 'CrackedIneffective', action: 'Edit' },
    hearingAccess: { object: 'HearingAccess', action: 'Extend' },
    viewHearingList: { object: 'ViewHearingList', action: 'View' },
    userGrantAccess: { object: 'GrantExtendedHearingAccess', action: 'GrantAccess' },
    viewCpSearch: { object: 'CP Search', action: 'View' },
    viewHearing: { object: 'CaseAccess', action: 'View' },
    viewIntelligence: { object: 'AI search', action: 'View' }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideTranslateService(),
        provideMockStore({ initialState: mockState }),
        { provide: AppConfigService, useValue: { getBaseUrl: baseUrlSpy } },
        { provide: 'Window', useValue: jest.fn() },
        { provide: EXPECTED_HEARING_USER_PERMISSIONS, useValue: mockUserPermissions }
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(TestHostComponent);
  });

  it('should render the template with the values expected if user has required permissions', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  it('should not render the template with the values expected if user does not have the required permissions', () => {
    const newState = {
      ...mockState,
      usersGroups: {
        userGroups: [],
        permissionsMap: [
          {
            permissionId: {
              action: 'Extend',
              object: 'HearingAccess',
              target: 'hearing-id-test-no-target',
              permissionId: 'permissionId'
            }
          }
        ],
        switchableRoles: [],
        userServices: []
      }
    } as unknown as AppState;
    store.setState(newState);
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });
});

@Component({
  template: ` <magistrates-hearing-list></magistrates-hearing-list> `,
  imports: [MagistratesHearingListContainer]
})
class TestHostComponent {}

function buildHearings(): HearingSummary[] {
  return [
    {
      courtCentreId: 'court-centre-id-test',
      hearingDays: [
        {
          listedDurationMinutes: 1,
          listingSequence: 0,
          sittingDay: '2019-12-03T18:32:00.000Z'
        }
      ],
      id: 'hearing-id-test',
      prosecutionCaseSummaries: [
        {
          defendants: [
            {
              dateOfBirth: '1994-12-02',
              firstName: 'Wilson',
              id: 'defendant1-id-test',
              lastName: 'Prohaska',
              middleName: 'Vernon',
              offences: [
                {
                  id: 'offence-id-test',
                  offenceTitle: 'Section 18 - attempt    wounding with intent',
                  wording: 'Wound / inflict grievous bodily harm without intent',
                  wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH'
                }
              ]
            },
            {
              dateOfBirth: '1991-12-02',
              firstName: 'Kenna',
              id: 'defendant2-id-test',
              lastName: 'McKenzie',
              middleName: 'Lillie',
              offences: [
                {
                  id: 'offence-id-test',
                  offenceTitle: 'Section 18 - attempt    wounding with intent',
                  wording: 'Wound / inflict grievous bodily harm without intent',
                  wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH'
                }
              ]
            }
          ],
          id: 'prosecution-case-id-test',
          prosecutionCaseIdentifier: {
            prosecutionAuthorityCode: 'B01BH',
            prosecutionAuthorityReference: 'test ref',
            prosecutionAuthorityId: 'prosecution-authority-id-test',
            caseURN: '57GD1981019'
          }
        }
      ],
      totalCases: 1,
      roomId: 'room2-id-test',
      type: {
        description: 'First Hearing',
        id: 'type-id-test'
      }
    }
  ];
}

function buildOrganisationUnits(): OrganisationUnit[] {
  return [
    {
      id: 'court-centre-id-test',
      oucodeL3Code: 'test-ou-code',
      oucodeL3Name: 'Test Magistrates Court',
      courtrooms: [
        {
          id: 'room1-id-test',
          venueName: 'Test Magistrates Court',
          courtroomId: 121,
          courtroomName: 'Courtroom 01'
        },
        {
          id: 'room2-id-test',
          venueName: 'Test Magistrates Court',
          courtroomId: 122,
          courtroomName: 'Courtroom 02'
        }
      ]
    }
  ];
}
