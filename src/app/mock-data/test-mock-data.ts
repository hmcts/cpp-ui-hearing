import { Actions } from '@ngrx/effects';
import { EMPTY as empty, Observable } from 'rxjs';

import {
  AttendanceTypeEnum,
  CompanyRepresentative,
  DefaultOptions,
  DefenceCounsel,
  DefendantName,
  HearingSummary,
  ProsecutionCounsel
} from '../core/model';
import { HearingEventsLogState } from '../core/reducers/hearing-events-log';
import {
  CourtApplication,
  CourtApplicationParty,
  HearingCaseNotes,
  HearingLockState,
  JudicialMember,
  JurisdictionType,
  SessionTimesCourt,
  UserDetails
} from '../core';
import { ProsecutionCaseIdentifier } from '../core/model/shared/prosecution-case-identifier';
import { ProsecutionCaseSummary } from '../core/model/shared/prosecution-case-summary';
import { SessionTimesState } from '../core/reducers/session-times';
import { CourtOrder } from '../core/model/court-orders';
import { CourtOrderState } from '../core/reducers/court-order';
import { ElectronicMonitoringDefendant } from '../core/model/hearing-detail';
import { HearingSlot } from '@cpp/scheduling';

export const hearingCaseNoteMock: HearingCaseNotes = {
  courtClerk: {
    userId: '',
    firstName: '',
    lastName: ''
  },
  id: '5d5b9cbd-b391-4845-8c62-a08b358d5432',
  note: 'test note hearing on navihgation out yo this is another editsfdsffsdfdsfdsfsdfsdfdsf',
  noteDateTime: '',
  noteType: 'HMCTS',
  originatingHearingId: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
  prosecutionCases: ['674e7bd0-f6f4-11e8-9a22-4569d614b7b5']
};
export const hearingMultidayCaseNotesMock: HearingCaseNotes[] = [
  {
    courtClerk: {
      userId: '',
      firstName: '',
      lastName: ''
    },
    id: '5d5b9cbd-b391-4845-8c62-a08b358d5432',
    note: 'test note case on multi-hearing last',
    noteDateTime: '2018-12-03T12:10:25.044Z',
    noteType: 'HMCTS',
    originatingHearingId: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
    prosecutionCases: ['674e7bd0-f6f4-11e8-9a22-4569d614b7b5']
  },
  {
    courtClerk: {
      userId: '',
      firstName: '',
      lastName: ''
    },
    id: '5d5b9cbd-b391-4845-8c62-a08b358d5432',
    note: 'test note case on multi-hearing',
    noteDateTime: '2018-12-03T12:10:20.044Z',
    noteType: 'HMCTS',
    originatingHearingId: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
    prosecutionCases: ['674e7bd0-f6f4-11e8-9a22-4569d614b7b5']
  },
  {
    courtClerk: {
      userId: '',
      firstName: '',
      lastName: ''
    },
    id: '5d5b9cbd-b391-4845-8c62-a08b358d5432',
    note: 'test note case on multi-hearing last',
    noteDateTime: '2018-12-04T12:10:30.044Z',
    noteType: 'HMCTS',
    originatingHearingId: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
    prosecutionCases: ['674e7bd0-f6f4-11e8-9a22-4569d614b7b5']
  },
  {
    courtClerk: {
      userId: '',
      firstName: '',
      lastName: ''
    },
    id: '5d5b9cbd-b391-4845-8c62-a08b358d5432',
    note: 'test note case on multi-hearing',
    noteDateTime: '2018-12-04T12:10:20.044Z',
    noteType: 'HMCTS',
    originatingHearingId: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
    prosecutionCases: ['674e7bd0-f6f4-11e8-9a22-4569d614b7b5']
  },
  {
    courtClerk: {
      userId: '',
      firstName: '',
      lastName: ''
    },
    id: '5d5b9cbd-b391-4845-8c62-a08b358d5432',
    note: 'test note case on multi-hearing',
    noteDateTime: '2018-12-05T12:10:20.044Z',
    noteType: 'HMCTS',
    originatingHearingId: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
    prosecutionCases: ['674e7bd0-f6f4-11e8-9a22-4569d614b7b5']
  }
];

export const defendatName: DefendantName = {
  id: '1',
  firstName: 'test',
  lastName: 'test'
};

export const prosecutionCaseIdentifierMock: ProsecutionCaseIdentifier = {
  prosecutionAuthorityCode: 'prosecutionAuthorityCode',
  prosecutionAuthorityReference: 'string',
  prosecutionAuthorityId: '674e7bd2-f6f4-11e8-9a22-4569d614b7b5',
  caseURN: '90EU623841'
};
export const prosecutionCaseSummaryMock: ProsecutionCaseSummary = {
  id: 'string',
  prosecutionCaseIdentifier: prosecutionCaseIdentifierMock,
  defendants: [defendatName]
};

export const mockSummary = {
  id: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
  type: {
    description: 'First hearing',
    id: '41fec9c5-fab0-4b22-97a8-6e6c693ff179'
  },
  jurisdictionType: 'CROWN' as JurisdictionType,
  reportingRestrictionReason: 'reportingRestrictionReason',
  hearingLanguage: 'ENGLISH',
  hearingDays: [
    {
      listedDurationMinutes: 30,
      listingSequence: 100,
      sittingDay: '2018-12-03T12:10:20.044Z'
    }
  ],
  prosecutionCaseSummaries: [prosecutionCaseSummaryMock],
  hasSharedResults: false,
  courtApplicationSummaries: []
} as HearingSummary;

export const mockApplicant = {
  masterDefendant: {
    masterDefendantId: '1'
  },
  id: '1',
  organisation: {},
  organisationPersons: [],
  personDetails: {
    firstName: 'Frodo',
    lastName: 'Baggins'
  },
  prosecutingAuthority: {},
  representationOrganisation: {},
  synonym: 'Applicant'
} as CourtApplicationParty;

export const mockBulkDefendant = [
  {
    associatedPersons: [] as any[],
    courtProceedingsInitiated: '2021-06-14T13:24:50.621Z',
    id: 'cce405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
    isYouth: false,
    bulkDefendant: true,
    isGroupMaster: true,
    masterDefendantId: 'cce405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
    offences: [
      {
        allocationDecision: {
          allocationDecisionDate: '2021-06-14',
          motReasonCode: '01',
          motReasonDescription: 'Summary-only offence',
          motReasonId: 'b8c37e33-defd-351c-b91e-1e03e51657da',
          offenceId: '1f7ff08e-3ccb-4c8c-b8cd-0fc9d167928d',
          originatingHearingId: 'a8ebb8b6-4e7c-4af8-a40d-a53a97128053',
          sequenceNumber: 90
        },
        arrestDate: '2017-12-12',
        chargeDate: '2017-12-12',
        convictionDate: '2021-06-14',
        count: 0,
        endorsableFlag: true,
        id: '1f7ff08e-3ccb-4c8c-b8cd-0fc9d167928d',
        introducedAfterInitialProceedings: false,
        isDiscontinued: false,
        modeOfTrial: 'Summary',
        offenceCode: 'CA03012',
        offenceDefinitionId: '3ebe41c9-666d-4964-aa80-a005d89927a3',
        offenceLegislation:
          'Contrary to section 363(3)(b) and (4) of the    Communications Act 2003.',
        offenceTitle:
          'Possess /    control TV set with intent another use install without a licence',
        orderIndex: 1,
        plea: {
          offenceId: '1f7ff08e-3ccb-4c8c-b8cd-0fc9d167928d',
          originatingHearingId: 'a8ebb8b6-4e7c-4af8-a40d-a53a97128053',
          pleaDate: '2021-06-14',
          pleaValue: 'GUILTY'
        },
        proceedingsConcluded: false,
        reportingRestrictions: [] as any[],
        startDate: '2017-12-12',
        wording: 'second offence'
      },
      {
        allocationDecision: {
          allocationDecisionDate: '2021-06-14',
          motReasonCode: '01',
          motReasonDescription: 'Summary-only offence',
          motReasonId: 'b8c37e33-defd-351c-b91e-1e03e51657da',
          offenceId: '6eff958b-5891-4d74-9d56-0d7048367d2d',
          originatingHearingId: 'a8ebb8b6-4e7c-4af8-a40d-a53a97128053',
          sequenceNumber: 90
        },
        arrestDate: '2016-12-12',
        chargeDate: '2016-12-12',
        convictionDate: '2021-06-14',
        count: 0,
        endorsableFlag: true,
        id: '6eff958b-5891-4d74-9d56-0d7048367d2d',
        introducedAfterInitialProceedings: false,
        isDiscontinued: false,
        modeOfTrial: 'Summary',
        offenceCode: 'CA03014',
        offenceDefinitionId: 'd6bd72ad-37bf-330d-bcc6-215728949d3e',
        offenceLegislation: 'Contrary to section 366(8)(b) and (9) of the Communications Act 2003.',
        offenceTitle:
          'Fail / refuse give assistance to person executing Communications Act search warrant',
        orderIndex: 2,
        plea: {
          offenceId: '6eff958b-5891-4d74-9d56-0d7048367d2d',
          originatingHearingId: 'a8ebb8b6-4e7c-4af8-a40d-a53a97128053',
          pleaDate: '2021-06-14',
          pleaValue: 'GUILTY'
        },
        proceedingsConcluded: false,
        reportingRestrictions: [],
        startDate: '2017-12-12',
        wording: 'third offence'
      }
    ],
    personDefendant: {
      arrestSummonsNumber: 'DVLA',
      bailStatus: {
        code: 'A',
        description: 'Not applicable',
        id: '86009c70-759d-3308-8de4-194886ff9a77'
      },
      personDetails: {
        address: {
          address1: '99',
          address2: 'MALLERTON WAY',
          address3: 'DUNSTABLE',
          postcode: 'LN5 5TT'
        },
        contact: { home: '015324443756' },
        dateOfBirth: '1978-12-21',
        documentationLanguageNeeds: 'ENGLISH',
        ethnicity: {
          observedEthnicityCode: '1',
          observedEthnicityDescription: 'White - North European',
          observedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
          selfDefinedEthnicityCode: 'W1',
          selfDefinedEthnicityDescription: 'British',
          selfDefinedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b'
        },
        firstName: 'TommyTommy',
        gender: 'MALE',
        lastName: 'ddddsds',
        occupation: 'Accountant',
        occupationCode: '2201',
        title: 'MR'
      }
    },
    proceedingsConcluded: true,
    prosecutionAuthorityReference: 'DVLA',
    prosecutionCaseId: '2d39cfd1-7d0d-457f-a8bb-bc29e18557ca'
  } as any
];

export const mockDefendant: any = {
  defendantId: '841164f6-13bc-46ff-8634-63cf9ae85d36',
  personId: '5a6e2001-91ed-4af2-99af-f30ddc9ef5af',
  personDefendant: {
    personDetails: {
      firstName: 'Ken',
      lastName: 'Thompson',
      dateOfBirth: '1945-02-18'
    },
    bailStatus: 'IN_CUSTODY',
    custodyTimeLimit: '2018-01-01'
  },
  firstName: 'Ken',
  lastName: 'Thompson',
  homeTelephone: '02070101010',
  mobile: '07422263910',
  fax: '021111111',
  email: 'ken.thompson@acme.me',
  address: {
    formatedAddress: '222 Furze Road Exeter Lorem Ipsum Solor Porro Quisquam CR0 1XG',
    address1: '222 Furze Road Exeter',
    address2: 'Lorem Ipsum',
    address3: 'Solor',
    address4: 'Porro Quisquam',
    postCode: 'CR0 1XG'
  },
  offences: [
    {
      id: ':offenceId',
      allocationDecision: {},
      plea: {},
      indicatedPlea: {}
    }
  ]
};
export const mockDefendantInCustody: any = {
  defendantId: '841164f6-13bc-46ff-8634-63cf9ae85d36',
  personId: '5a6e2001-91ed-4af2-99af-f30ddc9ef5af',
  isYouth: false,
  personDefendant: {
    personDetails: {
      firstName: 'Ken',
      lastName: 'Thompson',
      dateOfBirth: '1945-02-18'
    },
    bailStatus: 'IN_CUSTODY',
    custodyTimeLimit: '2018-01-01'
  },
  firstName: 'Ken',
  lastName: 'Thompson',
  homeTelephone: '02070101010',
  mobile: '07422263910',
  fax: '021111111',
  email: 'ken.thompson@acme.me',
  address: {
    formatedAddress: '222 Furze Road Exeter Lorem Ipsum Solor Porro Quisquam CR0 1XG',
    address1: '222 Furze Road Exeter',
    address2: 'Lorem Ipsum',
    address3: 'Solor',
    address4: 'Porro Quisquam',
    postCode: 'CR0 1XG'
  },
  offences: []
};

export const mockYouthDefendantInCustody: any = {
  defendantId: '841164f6-13bc-46ff-8634-63cf9ae85d36',
  personId: '5a6e2001-91ed-4af2-99af-f30ddc9ef5af',
  isYouth: true,
  personDefendant: {
    personDetails: {
      firstName: 'Ken',
      lastName: 'Thompson',
      dateOfBirth: '1945-02-18'
    },
    bailStatus: 'IN_CUSTODY',
    custodyTimeLimit: '2018-01-01'
  },
  firstName: 'Ken',
  lastName: 'Thompson',
  homeTelephone: '02070101010',
  mobile: '07422263910',
  fax: '021111111',
  email: 'ken.thompson@acme.me',
  address: {
    formatedAddress: '222 Furze Road Exeter Lorem Ipsum Solor Porro Quisquam CR0 1XG',
    address1: '222 Furze Road Exeter',
    address2: 'Lorem Ipsum',
    address3: 'Solor',
    address4: 'Porro Quisquam',
    postCode: 'CR0 1XG'
  },
  offences: []
};

export const mockDefendants = [
  {
    id: 'test-defendant',
    personDefendant: {
      personDetails: {
        additionalNationalityCode: 'GBP',
        additionalNationalityId: '25f26487-6065-4680-9706-9398fa0ea030',
        address: {
          address1: '8888 Fuse Road',
          address2: 'East Croydon',
          address3: 'South London',
          address4: 'London',
          address5: 'UK',
          postcode: 'U5K 9LX'
        },
        contact: {
          fax: '02012345678',
          home: '02012345678',
          mobile: '1468105168',
          primaryEmail: 'iw0e4x5bne@yc1qeldnlc.fgxm31rcjh',
          secondaryEmail: 'r1biivekjx@7f8x6b4hks.dv3oqgbmkq',
          work: '592199886'
        },
        dateOfBirth: '2000-03-26',
        disabilityStatus: 'Na',
        ethnicityCode: 'British',
        ethnicityId: '95be16c7-91c2-4b09-9639-535c54f03a0e',
        firstName: 'Victoria',
        gender: 'FEMALE',
        interpreterLanguageNeeds: 'NA',
        lastName: 'Dale',
        middleName: '',
        nationalInsuranceNumber: 'EZ814857C',
        nationalityCode: 'GBP',
        nationalityId: '47688578-d9a6-497b-8a73-340043448df6',
        occupation: 'Serviec',
        occupationCode: 'Ser',
        specificRequirements: 'Na',
        title: 'MR'
      }
    }
  } as any
];

export const mockIntermediaryCounsels = [
  {
    id: '1',
    firstName: 'icf-1',
    lastName: 'icl-1',
    attendanceDays: [''],
    role: 'INTERPRETER',
    attendant: {
      defendantId: '',
      name: 'witness name',
      attendantType: 'WITNESS'
    }
  },
  {
    id: '2',
    firstName: 'icf-2',
    lastName: 'icl-2',
    attendanceDays: [''],
    role: 'INTERMEDIARY',
    attendant: {
      defendantId: 'defendantId',
      name: '',
      attendantType: 'DEFENDANT'
    }
  }
];

export const mockLegalEntityDefendant = [
  {
    id: 'test-legal-entity-defendant',
    legalEntityDefendant: {
      organisation: {
        address: {
          address1: 'Some Building',
          address2: '444 Fuse Road',
          address3: 'Esst Croydon',
          address4: 'South London',
          address5: 'London',
          postcode: 'N08 9JD'
        },
        contact: {
          fax: '765997700',
          home: '759019681',
          mobile: '1444010616',
          primaryEmail: 'zdivwdsblf@gxvm7kqbh4.duzrohmbtt',
          secondaryEmail: 'dusl1j0oxw@0rzelb2mln.rvjnuth3ar',
          work: '584591171'
        },
        incorporationNumber: 'Jwo9KG3JWW',
        name: 'TestNameLei',
        registeredCharityNumber: 'TestCharityLEi'
      }
    }
  }
];

export const mockDefenceCounsels = [
  {
    id: '1',
    firstName: 'pc-1',
    lastName: 'pc-1',
    title: 'test',
    middleName: 'test',
    status: 'test',
    attendanceDays: [],
    defendants: ['test-1']
  },
  {
    id: '2',
    firstName: 'pc-2',
    lastName: 'pc-2',
    title: 'test',
    middleName: 'test',
    status: 'test',
    attendanceDays: [],
    defendants: ['test-2']
  }
] as DefenceCounsel[];

export const mockProsecutionCounsels = [
  {
    id: '1',
    firstName: 'pc-1',
    lastName: 'pc-1',
    title: 'test',
    middleName: 'test',
    status: 'test',
    attendanceDays: [],
    prosecutionCases: []
  },
  {
    id: '2',
    firstName: 'pc-2',
    lastName: 'pc-2',
    title: 'test',
    middleName: 'test',
    status: 'test',
    attendanceDays: [],
    prosecutionCases: []
  }
] as ProsecutionCounsel[];

export const mockProsecutionCasesSummary = [
  {
    id: 'fe90f56f-492d-4a32-8299-b7d1d5a87f21',
    prosecutionCaseIdentifier: { prosecutionAuthorityCode: 'TVL', caseURN: '25GD5336220' }
  },
  {
    id: 'dd0b5261-2952-4e5b-9191-ea1a68f805f6',
    prosecutionCaseIdentifier: { prosecutionAuthorityCode: 'TVL', caseURN: '40GD3598020' }
  }
];

export const mockProsecutionCasesSummaryWithBulkCase = [
  {
    id: 'fe90f56f-492d-4a32-8299-b7d1d5a87f21',
    prosecutionCaseIdentifier: { prosecutionAuthorityCode: 'TVL', caseURN: '25GD5336220' },
    isGroupMaster: true
  },
  {
    id: 'dd0b5261-2952-4e5b-9191-ea1a68f805f6',
    prosecutionCaseIdentifier: { prosecutionAuthorityCode: 'TVL', caseURN: '40GD3598020' }
  }
];

export const mockCounselsCache = {
  firstNameOpts: [
    { label: 'John', value: { firstName: 'John', lastName: 'Francis', status: 'Status1' } }
  ],
  lastNameOpts: [
    { label: 'Francis', value: { firstName: 'John', lastName: 'Francis', status: 'Status1' } }
  ]
};

export const mockCompanyRepresentatives = [
  {
    id: '1',
    firstName: 'co-fn-1',
    lastName: 'co-ln-1',
    title: 'co-title-1',
    position: 'DIRECTOR',
    attendanceDays: [],
    defendants: ['test-1']
  },
  {
    id: '2',
    firstName: 'co-fn-2',
    lastName: 'co-ln-2',
    title: 'co-title-2',
    position: 'SECRETARY',
    attendanceDays: [],
    defendants: ['test-2']
  }
] as CompanyRepresentative[];

export const hearingMock = {
  id: '674e2db1-f6f4-11e8-9a22-4569d614b7b5',
  type: {
    description: '90EU623841',
    id: '41fec9c5-fab0-4b22-97a8-6e6c693ff179'
  },
  jurisdictionType: 'CROWN' as JurisdictionType,
  reportingRestrictionReason: 'reportingRestrictionReason',
  hearingLanguage: 'ENGLISH',
  hearingDays: [
    {
      listedDurationMinutes: 30,
      listingSequence: 100,
      sittingDay: '2018-12-03T12:10:20.044Z'
    }
  ],
  courtCentre: {
    id: 'd9bff7d8-6168-4163-ad77-3b98d61de174',
    name: 'Wimbledon Magistrates Court',
    roomId: '1414ea28-8b0e-3ba7-8f97-f2bb6d5dd38c',
    roomName: 'Courtroom 05',
    welshName: 'Sion',
    welshRoomName: 'restroom'
  },
  judiciary: [
    {
      firstName: 'Albert',
      isBenchChairman: false,
      isDeputy: false,
      judicialId: '674e54c0-f6f4-11e8-9a22-4569d614b7b5',
      judicialRoleType: 'CIRCUIT_JUDGE',
      lastName: 'Gabbrielli',
      middleName: 'Cameron',
      title: 'Mr'
    }
  ],
  courtApplications: [
    {
      applicant: mockApplicant,
      subject: mockApplicant,
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
          synonym: 'Respondent',
          personDetails: {
            firstName: 'Sméagol',
            lastName: 'Gollum'
          } as any
        }
      ],
      respondentsNA: false,
      type: {
        categoryCode: '',
        jurisdiction: '',
        legislation: 'Legal text and other mumbo jumbo',
        type: 'Bad character applications',
        id: '4',
        applicantAppellantFlag: false
      }
    } as CourtApplication
  ],
  prosecutionCases: [
    {
      id: '674e7bd0-f6f4-11e8-9a22-4569d614b7b5',
      prosecutionCaseIdentifier: prosecutionCaseIdentifierMock,
      defendants: [mockDefendant],
      originatingOrganisation: 'string',
      initiationCode: 'string',
      caseStatus: 'string',
      statementOfFacts: 'string',
      statementOfFactsWelsh: 'string',
      isGroupMaster: false
    }
  ],
  hasSharedResults: false,
  defendantReferralReasons: [
    {
      defendantId: '674e2db0-f6f4-11e8-9a22-4569d614b7b5',
      description: 'defendantReferralReasons',
      id: '674e2db2-f6f4-11e8-9a22-4569d614b7b5'
    }
  ],
  prosecutionCounsels: [] as any[],
  defenceCounsels: mockDefenceCounsels,
  companyRepresentatives: mockCompanyRepresentatives,
  defendantAttendance: [
    {
      defendantId: 'def-1',
      attendanceDays: [
        {
          day: '2010-10-10',
          attendanceType: AttendanceTypeEnum.IN_PERSON
        }
      ]
    }
  ],
  hearingCaseNotes: [hearingCaseNoteMock],
  applicantCounsels: [
    {
      id: 'applicantCounselId',
      applicants: ['applicantId'],
      attendanceDays: ['2019-05-01'],
      firstName: 'James',
      lastName: 'Gray',
      status: '',
      title: ''
    }
  ],
  respondentCounsels: [
    {
      id: 'respondentCounselId',
      respondents: ['respondentId'],
      attendanceDays: ['2019-05-01'],
      firstName: 'Gordon',
      lastName: 'Cumming',
      status: '',
      title: ''
    }
  ],
  crackedIneffectiveTrial: {
    code: 'mock-code',
    description: 'mock-description',
    id: 'mock-trial-id',
    type: 'Vacated',
    trialType: 'Vacated',
    seqNo: 1
  },
  approvalsRequested: [] as any
};

export const mockJudicialMembers: JudicialMember[] = [
  {
    id: '2f00336e-dfc7-4042-9d49-f5ea122772ce',
    seqId: 160,
    titlePrefixWelsh: 'Mrs',
    titleSuffix: 'JP',
    surname: 'Chambers',
    forenames: 'Fiona Helen',
    judiciaryType: 'Magistrate'
  },
  {
    id: 'ce5d998b-d002-4d19-82b9-eec0ddf6626e',
    seqId: 5540,
    titlePrefixWelsh: 'Mr',
    titleSuffix: 'JP',
    surname: 'Hawthorne',
    forenames: 'Stephen',
    judiciaryType: 'Magistrate'
  }
];

export const mockSessionTimesCourt: SessionTimesCourt = {
  courtHouseId: '0dbe970f-b5b5-45a4-9358-bcbba24d0316',
  courtRoomId: 'e16ab96c-8ac9-4f67-82e8-fd2113cf957d',
  courtSessionDate: '2020-10-9',
  amCourtSession: {
    judiciaries: [
      {
        judiciaryId: mockJudicialMembers[0].id,
        benchChairman: true
      },
      {
        judiciaryName: 'Joe Smith',
        benchChairman: false
      }
    ],
    startTime: '10:00',
    endTime: '11:00',
    courtClerkId: 'd796149e-236a-41d4-b9cc-9eb4618aead7',
    courtAssociateId: 'a2d88f91-3b90-46a6-9da9-a918fe13a7ae',
    legalAdviserId: '1376c0f5-c76d-406c-9d00-7a68e845fb78'
  },
  pmCourtSession: {
    judiciaries: [
      {
        judiciaryId: mockJudicialMembers[1].id,
        benchChairman: false
      }
    ],
    startTime: '13:00',
    endTime: '18:00',
    courtClerkId: 'd997cc54-0fb8-47af-91c1-a065abdf1b63',
    courtAssociateId: '3552bc05-e448-48a5-863b-6861ee9954aa',
    legalAdviserId: '656dfc33-9287-4629-9b0a-dc8978501cea'
  }
};

export const courtClerk: UserDetails = {
  userId: mockSessionTimesCourt.amCourtSession.courtClerkId,
  firstName: 'Robert',
  lastName: 'Barnes',
  email: 'robert.barnes@hmcts.net'
};

export const courtAssociate: UserDetails = {
  userId: mockSessionTimesCourt.amCourtSession.courtAssociateId,
  firstName: 'Marion',
  lastName: 'Martin',
  email: 'marion.martin@hmcts.net'
};

export const legalAdviser: UserDetails = {
  userId: mockSessionTimesCourt.amCourtSession.legalAdviserId,
  firstName: 'Erica',
  lastName: 'Wilson',
  email: 'erica.wilson@hmcts.net'
};

export const mockHearingSlots: HearingSlot[] = [
  {
    courtScheduleId: '48e0894c-c3c3-4edf-8264-d9ded13e1dc5',
    ouCode: 'B01LY00',
    courtRoomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
    courtRoomNumber: 2330,
    courtHouseName: 'Lavender Hill Magistrates Court',
    courtRoomName: 'Courtroom 01',
    businessType: 'G1T',
    courtSession: 'AD',
    sessionDate: '2020-04-01',
    maxSlots: 0,
    maxDuration: 0,
    availableSlots: 0,
    availableDuration: 0,
    judiciaries: [
      {
        judiciaryId: mockJudicialMembers[0].id,
        courtScheduleId: '48e0894c-c3c3-4edf-8264-d9ded13e1dc5',
        courtListingProfileId: 'CS2368149',
        judiciaryType: 'MAGISTRATE',
        benchChairman: false,
        deputy: true
      },
      {
        judiciaryId: mockJudicialMembers[1].id,
        courtScheduleId: '48e0894c-c3c3-4edf-8264-d9ded13e1dc5',
        courtListingProfileId: 'CS2368149',
        judiciaryType: 'MAGISTRATE',
        benchChairman: true,
        deputy: false
      }
    ]
  } as HearingSlot
];

export const mockHearingState = {
  summaries: [mockSummary],
  current: {
    hearing: hearingMock,
    hearingState: HearingLockState.INITIALISED
  },
  amendmentReason: {
    id: 'id'
  },
  counselsCache: {
    firstNameOpts: [],
    lastNameOpts: []
  },
  selectedHearingDate: null,
  selectedOptions: {
    dateFilter: null,
    courtCentreFilter: null,
    courtRoomFilter: null,
    startTimeFilter: null,
    endTimeFilter: null
  },
  courtDocuments: null,
  available: null,
  listingNotes: [],
  isRestricted: true,
  isSelectedCaseBulk: false
} as any;

export const mockHearingEventsState: HearingEventsLogState = {
  eventDefinitions: [],
  loggedEvents: [],
  eventsLogState: ''
};

export const mockSessionTimesState: SessionTimesState = {
  currentSessionTimes: null,
  courtOfficers: null
};

export const mockCourtOrderState: CourtOrderState = {
  activeCourtOrder: {}
};

export const mockCourtOrderOne: CourtOrder = {
  id: 'id 1',
  label: 'label 1',
  startDate: '2021-01-01',
  orderingHearingId: 'hearingId',
  orderingCourt: {
    id: 'courtId 1',
    name: 'court name 1',
    welshName: 'welsh court name 1',
    courtHearingLocation: '',
    psaCode: 1234,
    roomId: 'roomId',
    roomName: 'roomName',
    welshRoomName: 'welshRoomName'
  },
  courtOrderOffences: [
    {
      prosecutionCaseId: 'prosecutionCaseId 1.1',
      prosecutionCaseIdentifier: {
        prosecutionAuthorityId: 'prosecutionAuthorityId 1.1',
        prosecutionAuthorityCode: 'prosecutionAuthorityCode 1.1',
        prosecutionAuthorityReference: 'prosecutionAuthorityReference 1.1'
      },
      offence: {}
    },
    {
      prosecutionCaseId: 'prosecutionCaseId 1.2',
      prosecutionCaseIdentifier: {
        prosecutionAuthorityId: 'prosecutionAuthorityId 1.2',
        prosecutionAuthorityCode: 'prosecutionAuthorityCode 1.2',
        caseURN: 'caseURN 1.2'
      },
      offence: {}
    }
  ]
} as CourtOrder;

export const mockCourtOrderTwo: CourtOrder = {
  id: 'id 2',
  label: 'label 2',
  startDate: '2021-01-01',
  orderingHearingId: 'orderingHearingId',
  orderingCourt: {
    id: 'courtId 2',
    name: 'court name 2',
    welshName: 'welsh court name 2',
    courtHearingLocation: '',
    psaCode: 1234,
    roomId: 'roomId',
    roomName: 'roomName',
    welshRoomName: 'welshRoomName'
  },
  courtOrderOffences: [
    {
      prosecutionCaseId: 'prosecutionCaseId 2',
      prosecutionCaseIdentifier: {
        prosecutionAuthorityId: 'prosecutionAuthorityId 2',
        prosecutionAuthorityCode: 'prosecutionAuthorityCode 2',
        prosecutionAuthorityReference: 'prosecutionAuthorityReference 2',
        caseURN: 'caseURN 2'
      },
      offence: {}
    }
  ]
} as CourtOrder;

export const mockCourtOrders: CourtOrder[] = [mockCourtOrderOne, mockCourtOrderTwo];

export const mockDefendantsTrackingStatus: ElectronicMonitoringDefendant[] = [
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

export const mockSelectedOptions: DefaultOptions = {
  dateFilter: '2022-10-25',
  courtCentreFilter: {
    id: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
    name: `Lavender Hill Magistrates' Court`
  },
  courtRoomFilter: {
    id: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
    name: 'Courtroom 01'
  },
  startTimeFilter: '09:00',
  endTimeFilter: '11:00'
};

export class TestActions extends Actions {
  constructor() {
    super(empty);
  }
  set stream(source: Observable<any>) {
    this.source = source;
  }
}

export function getActions() {
  return new TestActions();
}
