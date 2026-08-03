import { CourtApplication } from '../../../core';

export const casesAndApplicationsGroupedByDefendant = [
  {
    aliases: [
      {
        firstName: 'johnny robber'
      },
      {
        firstName: 'jack the knife'
      }
    ],
    associatedPersons: [
      {
        person: {
          additionalNationalityCode: 'USA',
          additionalNationalityDescription: 'United States of America',
          additionalNationalityId: '9aa0ffba-67a4-4137-b392-3c01951eb9c2',
          address: {
            address1: '22',
            address2: 'Acacia Avenue',
            address3: 'Acacia Town',
            address4: 'Acacia City',
            address5: 'Acacia Country',
            postcode: 'GIR 0AA'
          },
          contact: {
            fax: '3425678',
            home: '123456',
            mobile: '45678910',
            primaryEmail: 'harry.kane@spurs.co.uk',
            secondaryEmail: 'harry.kane@hotmail.com',
            work: '7891011'
          },
          dateOfBirth: '1995-01-01',
          disabilityStatus: 'a',
          documentationLanguageNeeds: 'WELSH',
          ethnicityCode: 'IC1',
          ethnicityDescription: 'IC1 Description',
          ethnicityId: 'd36d2ba2-6862-4114-b9f9-0c620e1e903c',
          firstName: 'Harry',
          gender: 'MALE',
          interpreterLanguageNeeds: 'Hindi',
          lastName: 'Kane',
          middleName: 'Jack',
          nationalInsuranceNumber: 'NH222222B',
          nationalityCode: 'GBR',
          nationalityDescription: 'United Kingdom',
          nationalityId: '0f36a570-46ef-41d1-b290-9037a64fa1a4',
          occupation: 'Footballer',
          occupationCode: 'F',
          title: 'MR'
        },
        role: 'parent'
      }
    ],
    courtApplications: [] as CourtApplication[],
    id: 'e1d32d9d-29ec-4934-a932-22a50f223966',
    mitigation: 'I was not there',
    mitigationWelsh: 'I was not there in Welsh',
    numberOfPreviousConvictionsCited: 5,
    personDefendant: {
      arrestSummonsNumber: 'arrest123',
      bailStatus: 'inCustody',
      custodyTimeLimit: '2018-01-01',
      driverNumber: 'AACC12345',
      employerOrganisation: {
        address: {
          address1: 'Disney Road',
          address2: 'Disney Town',
          address3: 'Disney District',
          address4: 'Paris',
          address5: 'France',
          postcode: 'DI5 9EY'
        },
        contact: {
          fax: 'a',
          primaryEmail: 'person@hotmail.com',
          secondaryEmail: 'associate@hotmail.com',
          work: '0207 654 3246 extn 1234'
        },
        id: '8625b50c-afc4-4d63-add2-68b9bf01b1fd',
        incorporationNumber: 'Mickeymouse1',
        name: 'Disneyland Paris'
      },
      employerPayrollReference: 'payyou1234',
      observedEthnicityCode: 'IC1',
      observedEthnicityId: 'd36d2ba2-6862-4114-b9f9-0c620e1e903c',
      perceivedBirthYear: 2015,
      personDetails: {
        additionalNationalityCode: 'USA',
        additionalNationalityDescription: 'United States of America',
        additionalNationalityId: '9aa0ffba-67a4-4137-b392-3c01951eb9c2',
        address: {
          address1: '22',
          address2: 'Acacia Avenue',
          address3: 'Acacia Town',
          address4: 'Acacia City',
          address5: 'Acacia Country',
          postcode: 'GIR 0AA'
        },
        contact: {
          fax: '3425678',
          home: '123456',
          mobile: '45678910',
          primaryEmail: 'harry.kanejunior@spurs.co.uk',
          secondaryEmail: 'harry.kanejunior@hotmail.com',
          work: '7891011'
        },
        dateOfBirth: '2010-01-01',
        disabilityStatus: 'a',
        documentationLanguageNeeds: 'WELSH',
        ethnicityCode: 'IC1',
        ethnicityDescription: 'IC1 Description',
        ethnicityId: 'd36d2ba2-6862-4114-b9f9-0c620e1e903c',
        firstName: 'Harry',
        gender: 'MALE',
        interpreterLanguageNeeds: 'Welsh',
        lastName: 'Kane Junior',
        middleName: 'Jack',
        nationalInsuranceNumber: 'NH323232B',
        nationalityCode: 'GBR',
        nationalityDescription: 'United Kingdom',
        nationalityId: '0f36a570-46ef-41d1-b290-9037a64fa1a4',
        occupation: 'Kid',
        occupationCode: 'F',
        specificRequirements: 'Screen',
        title: 'MR'
      },
      pncId: '1234567',
      selfDefinedEthnicityCode: 'IC1',
      selfDefinedEthnicityId: 'd36d2ba2-6862-4114-b9f9-0c620e1e903c'
    },
    prosecutionAuthorityReference: 'TFL12345-ABC',
    prosecutionCaseId: '2279b2c3-b0d3-4889-ae8e-1ecc20c39e27',
    prosecutionCases: [
      {
        caseStatus: 'SJP Referral',
        id: '2279b2c3-b0d3-4889-ae8e-1ecc20c39e27',
        initiationCode: 'J',
        offences: [
          {
            allocationDecision: {
              courtIndicatedSentence: {},
              motReasonCode: '02',
              motReasonDescription: ':motReasonDescription',
              motReasonId: ':motReasonId',
              offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
              originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8'
            },
            arrestDate: '2018-01-01',
            chargeDate: '2018-01-01',
            convictionDate: '2018-05-01',
            count: 0,
            index: 0,
            endDate: '2018-01-01',
            id: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
            indicatedPlea: {
              indicatedPleaDate: '2018-05-01',
              indicatedPleaValue: 'INDICATED_GUILTY',
              offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
              originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8'
            },
            notifiedPlea: {
              notifiedPleaDate: '2018-04-01',
              notifiedPleaValue: 'NOTIFIED_GUILTY',
              offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1'
            },
            offenceCode: 'AAA',
            offenceDefinitionId: '490dce00-8591-49af-b2d0-1e161e7d0c36',
            offenceFacts: {
              alcoholReadingAmount: '111',
              alcoholReadingMethod: '2222',
              vehicleRegistration: 'AA12345'
            },
            offenceLegislation: 'legislation',
            offenceLegislationWelsh: 'legislation in Welsh',
            offenceTitle: 'a title',
            offenceTitleWelsh: 'a title in Welsh',
            orderIndex: 1,
            plea: {
              offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
              originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8',
              pleaDate: '2018-05-01',
              pleaValue: 'NOT_GUILTY'
            },
            startDate: '2018-01-01',
            verdict: {
              jurors: {
                numberOfJurors: 12,
                numberOfSplitJurors: 0,
                unanimous: true
              },
              lesserOrAlternativeOffence: {
                offenceCode: 'FDSE',
                offenceDefinitionId: 'b4d7921a-3ebc-432e-a20f-7f265b4554e8',
                offenceLegislation: 'Legislation for this offence',
                offenceLegislationWelsh: 'Legislation for this offence in Welsh',
                offenceTitle: 'A lesser offence',
                offenceTitleWelsh: 'A lesser offence in Welsh'
              },
              offenceId: '3789ab16-0bb7-4ef1-87ef-c936bf0364f1',
              originatingHearingId: 'bed2d8e5-9fe2-4003-a40b-cee8d1f235d8',
              verdictDate: '2018-05-01',
              verdictType: {
                category: 'Guilty',
                categoryType: 'GUILTY',
                code: '',
                description: 'Found Not Guilty, Guilty of a lesser or alternative offernce',
                jurisdiction: '',
                id: 'a7431310-cfb9-4970-8051-fa878cf2047d',
                sequence: 1
              }
            },
            wording: 'No Travel Card',
            wordingWelsh: 'No Travel Card In Welsh'
          }
        ],
        originatingOrganisation: 'G01FT01AB',
        prosecutionCaseIdentifier: {
          caseURN: '8C720B32E45B',
          prosecutionAuthorityCode: 'TFL',
          prosecutionAuthorityId: 'cf73207f-3ced-488a-82a0-3fba79c2ce85',
          prosecutionAuthorityReference: 'TFL12345'
        },
        statementOfFacts: 'You did it',
        statementOfFactsWelsh: 'You did it in Welsh'
      }
    ],
    witnessStatement: 'he did not do it',
    witnessStatementWelsh: 'he did not do it in Welsh'
  } as any
];
