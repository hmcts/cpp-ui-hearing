import { HearingSummary } from '../interfaces/magistrates-hearing.interface';
import { OrganisationUnit } from '@cpp/reference-data';

export const applicationMock: HearingSummary[] = [
  {
    courtApplicationSummaries: [
      {
        applicant: {
          firstName: 'first-name-test',
          id: 'applicant-id-test',
          lastName: 'last-name-test'
        },
        subject: {
          firstName: 'first-name-test',
          id: 'applicant-id-test',
          lastName: 'last-name-test'
        },
        applicationReference: 'application-reference-test',
        id: 'application-id-test',
        respondents: [],
        type: {
          legislation: 'application-legislation-test',
          type: 'application-type-test'
        }
      }
    ],
    courtCentreId: 'court-centre-id-test',
    hearingDays: [
      {
        listedDurationMinutes: 1,
        listingSequence: 0,
        sittingDay: '2019-12-03T18:32:00.000Z'
      }
    ],
    id: 'hearing-id-test',
    prosecutionCaseSummaries: [],
    roomId: 'room1-id-test',
    type: {
      description: 'First Hearing',
      id: 'type-id-test'
    }
  }
];

export const childParentApplicationsMock: HearingSummary[] = [
  {
    courtApplicationSummaries: [
      {
        applicant: {
          firstName: 'first-name-test',
          id: 'applicant-id-test',
          lastName: 'last-name-test'
        },
        subject: {
          firstName: 'first-name-test',
          id: 'applicant-id-test',
          lastName: 'last-name-test'
        },
        applicationReference: 'application-reference-test',
        id: 'application-id-test',
        respondents: [],
        type: {
          legislation: 'application-legislation-test',
          type: 'application-type-test'
        }
      },
      {
        applicant: {
          firstName: 'first-name2-test',
          id: 'applicant-id2-test',
          lastName: 'last-name2-test'
        },
        subject: {
          firstName: 'first-name-test',
          id: 'applicant-id-test',
          lastName: 'last-name-test'
        },
        applicationReference: 'application-reference2-test',
        id: 'application-id2-test',
        parentApplicationId: 'application-id-test',
        respondents: [],
        type: {
          legislation: 'application-legislation2-test',
          type: 'application-type2-test'
        }
      }
    ],
    courtCentreId: 'court-centre-id-test',
    hearingDays: [
      {
        listedDurationMinutes: 1,
        listingSequence: 0,
        sittingDay: '2019-12-03T18:32:00.000Z'
      }
    ],
    id: 'hearing-id-test',
    prosecutionCaseSummaries: [],
    roomId: 'room1-id-test',
    type: {
      description: 'First Hearing',
      id: 'type-id-test'
    }
  }
];

export const hearingSummaryMock: HearingSummary[] = [
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
                id: 'offence1-id-test',
                offenceTitle: 'Section 18 - attempt    wounding with intent',
                wording: 'Wound / inflict grievous bodily harm without intent',
                wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH'
              },
              {
                id: 'offence2-id-test',
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
                id: 'offence3-id-test',
                offenceTitle: 'Section 18 - attempt    wounding with intent',
                wording: 'Wound / inflict grievous bodily harm without intent',
                wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH'
              },
              {
                id: 'offence4-id-test',
                offenceTitle: 'Section 18 - attempt    wounding with intent',
                wording: 'Wound / inflict grievous bodily harm without intent',
                wordingWelsh: 'Wound / inflict grievous bodily harm without intent_WELSH'
              }
            ]
          }
        ],
        id: 'prosecution-case1-id-test',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'B01BH',
          prosecutionAuthorityId: 'prosecution-authority1-id-test',
          caseURN: '57GD1981019',
          prosecutionAuthorityReference: 'test reference'
        }
      }
    ],
    totalCases: 1,
    roomId: 'room1-id-test',
    type: {
      description: 'First Hearing',
      id: 'type-id-test'
    }
  }
];

export const organisationUnitsMock: OrganisationUnit[] = [
  {
    id: 'court-centre-id-test',
    oucode: 'B01LY00',
    oucodeL1Code: 'B',
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

export const applicationMockData: HearingSummary[] = [
  {
    courtApplicationSummaries: [
      {
        applicant: {
          firstName: 'first-name-test',
          id: 'applicant-id-test',
          lastName: 'last-name-test'
        },
        subject: {
          firstName: 'first-name-test',
          id: 'applicant-id-test',
          lastName: 'last-name-test'
        },
        applicationReference: 'application-reference-test',
        id: 'application-id-test',
        respondents: [
          {
            firstName: 'James',
            id: 'f7b5d563-6505-4736-9357-db78652cfdc8',
            lastName: 'Bond'
          },
          {
            firstName: 'Tom',
            id: 'q3b5d563-6505-4736-9357-af78652cfdc8',
            lastName: 'Cruise'
          }
        ],
        type: {
          legislation: 'application-legislation-test',
          type: 'application-type-test'
        }
      }
    ],
    courtCentreId: 'court-centre-id-test',
    hearingDays: [
      {
        listedDurationMinutes: 1,
        listingSequence: 0,
        sittingDay: '2019-12-03T18:32:00.000Z'
      }
    ],
    id: 'hearing-id-test',
    prosecutionCaseSummaries: [],
    roomId: 'room1-id-test',
    type: {
      description: 'First Hearing',
      id: 'type-id-test'
    }
  }
];
