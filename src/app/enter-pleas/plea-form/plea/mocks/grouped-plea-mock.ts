import {
  AssociatedPerson,
  GroupedPlea,
  LesserOrAlternativeOffence,
  ReportingRestriction
} from '../../../../core';

export const GROUPED_PLEA_MOCK = {
  caseURN: '28DI8217799',
  withCount: [] as Pick<GroupedPlea, 'withCount'>[],
  withoutCount: [
    {
      associatedPersons: [] as AssociatedPerson[],
      courtProceedingsInitiated: '2023-12-21T22:07:03.270Z',
      id: '534160ce-8a74-4d28-bd1a-709eff434c5d',
      isYouth: false,
      masterDefendantId: 'af0fb3e1-33eb-4883-acd2-7eba9a2ded47',
      offences: [
        {
          id: '50e4c309-33b7-4e04-aeb8-0e35c8f1f062',
          introducedAfterInitialProceedings: false,
          isDiscontinued: false,
          modeOfTrial: 'Summary',
          offenceCode: 'RT88007B',
          offenceDefinitionId: '6b354d5f-98cd-3f41-b819-e8a91c499251',
          offenceFacts: {
            alcoholReadingAmount: 13,
            alcoholReadingMethodCode: 'B'
          },
          offenceLegislation:
            'Contrary to section 5(1)(a) of the Road Traffic Act 1988, Schedule 2 to the Road Traffic Offenders Act 1988 and section 44 of the Magistrates Courts Act 1980.',
          offenceTitle:
            'Aid / abet driving of a motor vehicle on a road / public place when alcohol level above the prescribed limit',
          orderIndex: 2,
          proceedingsConcluded: false,
          reportingRestrictions: [] as ReportingRestriction[],
          startDate: '2023-12-01',
          wording:
            'Before 01 Dec 2023 at sv aided, abetted, counselled and procured, df, to drive a motor vehicle, namely wsef on a road, namely qawdf, after consuming so much alcohol that the proportion of it in their breath, namely 12  microgrammes of alcohol in 100 millilitres of breath, exceeded the prescribed limit..',
          plea: {
            offenceId: '50e4c309-33b7-4e04-aeb8-0e35c8f1f062',
            originatingHearingId: '97bda63d-12fa-48cf-bd7a-1cf733c042b8',
            pleaDate: null as string,
            pleaValue: null as string
          },
          allocationDecision: {
            offenceId: '50e4c309-33b7-4e04-aeb8-0e35c8f1f062',
            originatingHearingId: '97bda63d-12fa-48cf-bd7a-1cf733c042b8',
            motReasonCode: null as string,
            motReasonDescription: null as string,
            motReasonId: null as string,
            courtIndicatedSentence: {}
          },
          verdict: {
            offenceId: '50e4c309-33b7-4e04-aeb8-0e35c8f1f062',
            verdictDate: null as string,
            verdictType: {
              id: null as string,
              code: '',
              description: '',
              category: '',
              categoryType: '',
              jurisdiction: ''
            },
            originatingHearingId: '97bda63d-12fa-48cf-bd7a-1cf733c042b8',
            lesserOrAlternativeOffence: null as LesserOrAlternativeOffence,
            jurors: {
              numberOfJurors: 12,
              numberOfSplitJurors: 0,
              unanimous: true
            }
          }
        },
        {
          id: '8230ab77-72b7-434a-8b40-369a7f91957e',
          introducedAfterInitialProceedings: false,
          isDiscontinued: false,
          modeOfTrial: 'Summary',
          offenceCode: 'RT88584',
          offenceDefinitionId: '9c627aba-18ac-30c0-b076-6aebe0633ba2',
          offenceFacts: {
            alcoholReadingAmount: 13,
            alcoholReadingMethodCode: 'L'
          },
          offenceLegislation:
            'Contrary to section 5A(1)(a) and (2) of the Road Traffic Act 1988 and Schedule 2 to the Road Traffic Offenders Act 1988.',
          offenceTitle:
            'Drive motor vehicle with a proportion of a specified controlled drug above the specified limit',
          orderIndex: 3,
          proceedingsConcluded: false,
          reportingRestrictions: [],
          startDate: '2023-12-16',
          wording:
            'Before 16 Dec 2023 at sd drove a motor vehicle, namely hgy, on a road, namely rftgy, when the proportion of a controlled drug, namely test, in your blood, namely 12, exceeded the specified limit.',
          plea: {
            offenceId: '8230ab77-72b7-434a-8b40-369a7f91957e',
            originatingHearingId: '97bda63d-12fa-48cf-bd7a-1cf733c042b8',
            pleaDate: null,
            pleaValue: null
          },
          allocationDecision: {
            offenceId: '8230ab77-72b7-434a-8b40-369a7f91957e',
            originatingHearingId: '97bda63d-12fa-48cf-bd7a-1cf733c042b8',
            motReasonCode: null,
            motReasonDescription: null,
            motReasonId: null,
            courtIndicatedSentence: {}
          },
          verdict: {
            offenceId: '8230ab77-72b7-434a-8b40-369a7f91957e',
            verdictDate: null,
            verdictType: {
              id: null,
              code: '',
              description: '',
              category: '',
              categoryType: '',
              jurisdiction: ''
            },
            originatingHearingId: '97bda63d-12fa-48cf-bd7a-1cf733c042b8',
            lesserOrAlternativeOffence: null,
            jurors: {
              numberOfJurors: 12,
              numberOfSplitJurors: 0,
              unanimous: true
            }
          }
        }
      ],
      personDefendant: {
        arrestSummonsNumber: 'D28GC01128217799',
        bailStatus: {
          code: 'C',
          description: 'Custody',
          id: '12e69486-4d01-3403-a50a-7419ca040635'
        },
        driverNumber: 'VANFL002222OW9PH',
        personDetails: {
          address: {
            address1: '9999A9999AAAA',
            address2: 'Woodlane',
            address3: 'addressline 3',
            address4: 'Bristol',
            address5: 'Avon',
            postcode: 'BS1 1JQ'
          },
          contact: {
            home: '0208217799',
            mobile: '07778217799',
            primaryEmail: 'REDDY.TEST018217799@gmail.com'
          },
          dateOfBirth: '2000-11-11',
          documentationLanguageNeeds: 'ENGLISH',
          ethnicity: {
            observedEthnicityCode: '1',
            observedEthnicityDescription: 'White',
            observedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b',
            selfDefinedEthnicityCode: 'W1',
            selfDefinedEthnicityDescription: 'British',
            selfDefinedEthnicityId: 'c4ca4238-a0b9-3382-8dcc-509a6f75849b'
          },
          firstName: 'ab',
          gender: 'MALE',
          lastName: 'miknsiej',
          title: 'Mr'
        }
      },
      proceedingsConcluded: false,
      prosecutionAuthorityReference: 'D28GC01128217799',
      prosecutionCaseId: '9b39a40c-9a42-4295-8ff1-e989392a5cb7'
    }
  ]
};
