import { HearingDetailResponse, HearingSummary } from '../../model';

const bulkCaseDetails = {
  isGroupMaster: 'true'
};

const bulkCaseHearingDetails = {
  isGroupMaster: 'true',
  totalCases: 1000,
  numberOfDefendants: '1000',
  numberOfOffences: '1000',
  groupDescription: 'Council tax liability',
  isCivil: true
};

const bulkHearingDetails = {
  totalCases: 1000
};

export const mockHearings = [
  {
    ...bulkHearingDetails,
    courtApplicationSummaries: [],
    courtCentre: {
      id: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
      name: `Lavender Hill Magistrates' Court`,
      roomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
      roomName: 'Courtroom 01'
    },
    hasSharedResults: false,
    hearingDays: [
      {
        courtCentreId: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
        courtRoomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
        hasSharedResults: false,
        isCancelled: false,
        listedDurationMinutes: 20,
        listingSequence: 0,
        sittingDay: '2021-06-25T09:00:00.000Z'
      }
    ],
    hearingLanguage: 'ENGLISH',
    id: '70195305-87ff-4757-89a9-ee32fd132a26',
    jurisdictionType: 'MAGISTRATES',
    prosecutionCaseSummaries: [
      {
        ...bulkCaseDetails,
        defendants: [
          {
            courtProceedingsInitiated: '2021-06-14T13:24:50.621Z',
            firstName: 'Jason',
            id: 'bbe405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
            lastName: 'Wilson',
            masterDefendantId: 'bbe405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
            offences: [
              {
                id: '1f7ff08e-3ccb-4c8c-b8cd-0fc9d167928d',
                offenceTitle:
                  'Possess /    control TV set with intent another use install without a licence',
                reportingRestrictions: [],
                wording: 'second offence'
              },
              {
                id: '6eff958b-5891-4d74-9d56-0d7048367d2d',
                offenceTitle:
                  'Fail / refuse give assistance to person executing Communications Act search warrant',
                reportingRestrictions: [],
                wording: 'third offence'
              }
            ],
            synonym: 'is this from aliases ?'
          }
        ],
        id: '2d39cfd1-7d0d-457f-a8bb-bc29e18557ca',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'SURRPF',
          prosecutionAuthorityId: '764bff92-a135-34cb-b858-8bb6b4b66301',
          caseURN: '66SS789170'
        }
      },
      {
        defendants: [
          {
            courtProceedingsInitiated: '2021-06-14T13:24:50.621Z',
            firstName: 'Jason',
            id: 'bbe405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
            lastName: 'Wilson',
            masterDefendantId: 'bbe405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
            offences: [
              {
                id: '1f7ff08e-3ccb-4c8c-b8cd-0fc9d167928d',
                offenceTitle:
                  'Possess /    control TV set with intent another use install without a licence',
                reportingRestrictions: [],
                wording: 'second offence'
              },
              {
                id: '6eff958b-5891-4d74-9d56-0d7048367d2d',
                offenceTitle:
                  'Fail / refuse give assistance to person executing Communications Act search warrant',
                reportingRestrictions: [],
                wording: 'third offence'
              }
            ],
            synonym: 'is this from aliases ?'
          }
        ],
        id: '2d39cfd1-7d0d-457f-a8bb-bc29e18557ca',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'SURRPF',
          prosecutionAuthorityId: '764bff92-a135-34cb-b858-8bb6b4b66301',
          caseURN: '66SS789170'
        }
      }
    ],
    type: {
      description: 'Further Plea & Trial Preparation',
      id: '9cc41e45-b594-4ba6-906e-1a4626b08fed'
    }
  },
  {
    courtApplicationSummaries: [
      {
        applicant: { id: '2103a00e-15f5-4938-a7dd-bb226c606c82' },
        applicationReference: '66SS789166',
        caseSummaries: [
          {
            id: 'f794c254-dc62-4bfa-abf4-f8bf5958e91c',
            prosecutionCaseIdentifier: {
              prosecutionAuthorityCode: 'SURRPF',
              prosecutionAuthorityId: '764bff92-a135-34cb-b858-8bb6b4b66301',
              caseURN: '66SS789166'
            }
          }
        ],
        id: '75d9c355-ab8e-43ff-9b6a-2bfb7401a7ee',
        respondents: [],
        subject: {
          firstName: 'Vicky',
          id: '2103a00e-15f5-4938-a7dd-bb226c606c82',
          lastName: 'Stewart',
          masterDefendantId: 'f6fe7ead-b34b-4759-8031-8b5211b4396a'
        },
        type: {
          legislation: 'In accordance with section 39 of the Road Traffic Offenders Act 1988.',
          type: 'Application to suspend disqualification pending appeal'
        }
      }
    ],
    courtCentre: {
      id: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
      name: `Lavender Hill Magistrates' Court`,
      roomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
      roomName: 'Courtroom 01'
    },
    hasSharedResults: false,
    hearingDays: [
      {
        courtCentreId: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
        courtRoomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
        hasSharedResults: false,
        isCancelled: false,
        listedDurationMinutes: 1,
        listingSequence: 0,
        sittingDay: '2021-06-25T09:00:00.000Z'
      }
    ],
    hearingLanguage: 'ENGLISH',
    id: '14a57b93-6f9a-44a8-96f0-fd34f1c1e058',
    jurisdictionType: 'MAGISTRATES',
    prosecutionCaseSummaries: [
      {
        defendants: [
          {
            courtProceedingsInitiated: '2021-06-11T16:02:58.626Z',
            firstName: 'Vicky',
            id: 'f6fe7ead-b34b-4759-8031-8b5211b4396a',
            lastName: 'Stewart',
            masterDefendantId: 'f6fe7ead-b34b-4759-8031-8b5211b4396a',
            offences: [
              {
                id: '864adb05-9b61-4e23-846e-28d7d4707120',
                offenceTitle:
                  'Fail / refuse give assistance to person executing Communications Act search warrant',
                reportingRestrictions: [],
                wording: 'third offence'
              },
              {
                id: '291098fb-e22f-41f3-9cf8-65ccd71df984',
                offenceTitle:
                  'Possess /    control TV set with intent another use install without a licence',
                reportingRestrictions: [],
                wording: 'second offence'
              }
            ],
            synonym: 'is this from aliases ?'
          }
        ],
        id: 'f794c254-dc62-4bfa-abf4-f8bf5958e91c',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'SURRPF',
          prosecutionAuthorityId: '764bff92-a135-34cb-b858-8bb6b4b66301',
          caseURN: '66SS789166'
        }
      }
    ],
    type: { description: 'Application', id: '3449743b-95d6-4836-8941-57f588b52068' }
  }
] as unknown as HearingSummary[];

export const mockHearingDetail = {
  ...bulkHearingDetails,
  hearing: {
    applicantCounsels: [],
    approvalsRequested: [],
    companyRepresentatives: [],
    courtCentre: {
      id: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
      name: `Lavender Hill Magistrates' Court`,
      roomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
      roomName: 'Courtroom 01'
    },
    defenceCounsels: [],
    defendantAttendance: [
      {
        attendanceDays: [{ attendanceType: 'IN_PERSON', day: '2021-06-15' }],
        defendantId: 'bbe405d8-6fa6-4dfa-b3c9-dbe2ff2b7235'
      }
    ],
    defendantReferralReasons: [],
    hasSharedResults: false,
    hearingCaseNotes: [
      {
        courtClerk: {
          firstName: 'Erica',
          lastName: 'Wilson',
          userId: 'a085e359-6069-4694-8820-7810e7dfe762'
        },
        note: '',
        noteDateTime: '2021-06-14T13:30:04.000Z',
        noteType: 'HMCTS',
        originatingHearingId: '70195305-87ff-4757-89a9-ee32fd132a26',
        prosecutionCases: ['2d39cfd1-7d0d-457f-a8bb-bc29e18557ca']
      }
    ],
    hearingDays: [
      {
        courtCentreId: 'f8254db1-1683-483e-afb3-b87fde5a0a26',
        courtRoomId: '9e4932f7-97b2-3010-b942-ddd2624e4dd8',
        hasSharedResults: false,
        isCancelled: false,
        listedDurationMinutes: 20,
        listingSequence: 0,
        sittingDay: '2021-06-25T09:00:00.000Z'
      }
    ],
    hearingLanguage: 'ENGLISH',
    id: '70195305-87ff-4757-89a9-ee32fd132a26',
    intermediaries: [],
    isVacatedTrial: false,
    judiciary: [],
    jurisdictionType: 'MAGISTRATES',
    prosecutionCases: [
      {
        ...bulkCaseHearingDetails,
        caseMarkers: [],
        caseStatus: 'INACTIVE',
        defendants: [
          {
            associatedPersons: [],
            courtProceedingsInitiated: '2021-06-14T13:24:50.621Z',
            id: 'cce405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
            isYouth: false,
            bulkDefendant: true,
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
                  pleaValue: 'NOT_GUILTY'
                },
                proceedingsConcluded: false,
                reportingRestrictions: [],
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
                offenceLegislation:
                  'Contrary to section 366(8)(b) and (9) of the Communications Act 2003.',
                offenceTitle:
                  'Fail / refuse give assistance to person executing Communications Act search warrant',
                orderIndex: 2,
                plea: {
                  offenceId: '6eff958b-5891-4d74-9d56-0d7048367d2d',
                  originatingHearingId: 'a8ebb8b6-4e7c-4af8-a40d-a53a97128053',
                  pleaDate: '2021-06-14',
                  pleaValue: 'NOT_GUILTY'
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
          }
        ],
        id: '2d39cfd1-7d0d-457f-a8bb-bc29e18557ca',
        initiationCode: 'C',
        originatingOrganisation: '0450000',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'SURRPF',
          prosecutionAuthorityId: '764bff92-a135-34cb-b858-8bb6b4b66301',
          caseURN: '66SS789170'
        }
      },
      {
        caseMarkers: [],
        caseStatus: 'INACTIVE',
        defendants: [
          {
            associatedPersons: [],
            courtProceedingsInitiated: '2021-06-14T13:24:50.621Z',
            id: 'cbe405d8-6fa6-4dfa-b3c9-dbe2ff2b7234',
            isYouth: false,
            masterDefendantId: 'bbe405d8-6fa6-4dfa-b3c9-dbe2ff2b7235',
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
                reportingRestrictions: [],
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
                offenceLegislation:
                  'Contrary to section 366(8)(b) and (9) of the Communications Act 2003.',
                offenceTitle:
                  'Fail / refuse give assistance to person executing Communications Act search warrant',
                orderIndex: 2,
                plea: {
                  offenceId: '6eff958b-5891-4d74-9d56-0d7048367d2d',
                  originatingHearingId: 'a8ebb8b6-4e7c-4af8-a40d-a53a97128053',
                  pleaDate: '2021-06-14',
                  pleaValue: 'NOT_GUILTY'
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
                firstName: 'Kelly',
                gender: 'FEMALE',
                lastName: 'WILSON',
                occupation: 'Accountant',
                occupationCode: '2201',
                title: 'MRS'
              }
            },
            proceedingsConcluded: true,
            prosecutionAuthorityReference: 'DVLA',
            prosecutionCaseId: '2d39cfd1-7d0d-457f-a8bb-bc29e18557ca'
          }
        ],
        id: '3f39cfd1-7d0d-457f-a8bb-bc29e18557ca',
        initiationCode: 'C',
        originatingOrganisation: '0450000',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'SURRPF',
          prosecutionAuthorityId: '764bff92-a135-34cb-b858-8bb6b4b66301',
          caseURN: '66SS789160'
        }
      }
    ],
    prosecutionCounsels: [],
    respondentCounsels: [],
    type: {
      description: 'Further Plea & Trial Preparation',
      id: '9cc41e45-b594-4ba6-906e-1a4626b08fed'
    },
    youthCourtDefendantIds: []
  },
  hearingState: 'SHARED',
  amendedByUserId: 'a085e359-6069-4694-8820-7810e7dfe762'
} as unknown as HearingDetailResponse;
