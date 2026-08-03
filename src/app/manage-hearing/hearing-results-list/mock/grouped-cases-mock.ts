import moment from 'moment';

export const groupedCasesMockDob = moment('2001-10-27').format('YYYY-MM-DD');

export const groupedCasesMock = [
  {
    associatedPersons: [],
    results: [],
    courtProceedingsInitiated: '2020-03-21T10:45:52.482Z',
    id: '95fb6e57-49f9-4bf8-b93d-12a95d92846d',
    isYouth: false,
    masterDefendantId: '95fb6e57-49f9-4bf8-b93d-12a95d92846d',
    personDefendant: {
      bailStatus: {
        code: 'B',
        description: 'Conditional Bail',
        id: 'dd4073b6-22be-3875-9d63-5da286bb3ece'
      },
      personDetails: {
        additionalNationalityCode: 'POL',
        additionalNationalityId: 'e3baf6cc-1711-43cd-8aad-80ca6e89c946',
        address: {
          address1: '11 St Andrews',
          postCode: 'E1W 2TD'
        },
        dateOfBirth: groupedCasesMockDob,
        documentationLanguageNeeds: 'ENGLISH',
        firstName: 'Adam',
        gender: 'NOT_SPECIFIED',
        lastName: 'Smith',
        nationalityCode: 'GBR',
        nationalityDescription: 'British',
        nationalityId: '49433158-3542-49c8-a9af-581a0e746152',
        title: 'MR'
      },
      driverNumber: 'CHREE232128302894'
    },
    prosecutionAuthorityReference: '82GD2173520',
    prosecutionCaseId: '0e448414-62ec-4f92-9c61-44d608079353',
    prosecutionCases: [
      {
        caseMarkers: [],
        id: '0e448414-62ec-4f92-9c61-44d608079353',
        initiationCode: 'C',
        originatingOrganisation: 'GAEAA01',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'TVL',
          prosecutionAuthorityId: '6b7b9adc-ccee-4b13-b2c7-499c28e98962',
          caseURN: '86GD2660720'
        },
        offences: [
          {
            arrestDate: '2018-12-17',
            chargeDate: '2018-12-17',
            convictionDate: '2019-01-07',
            count: 1,
            endDate: '2018-09-17',
            id: '294c821c-3f11-4e7b-aa51-3091c71342d9',
            modeOfTrial: 'SIMP',
            notifiedPlea: {
              notifiedPleaDate: '2018-12-28',
              notifiedPleaValue: 'NOTIFIED_GUILTY',
              offenceId: '294c821c-3f11-4e7b-aa51-3091c71342d9'
            },
            offenceCode: 'RT88007',
            offenceDefinitionId: '323b0db0-995e-3ff0-9a01-a28c6a601120',
            offenceFacts: {
              alcoholReadingAmount: '6wljeYQGRM',
              alcoholReadingMethod: 'aDEuKLdgVC',
              vehicleRegistration: '20K0GVptxy'
            },
            offenceLegislation:
              'Contrarytosection5(1)(a)oftheRoadTrafficAct1988andSchedule2totheRoadTrafficOffendersAct1988.',
            offenceLegislationWelsh:
              'Yngroesiadran5(1)(a)DeddfTraffigFfyrdd1988acAtodlen2DeddfTroseddwyrTraffigFfyrdd1988.',
            offenceTitle: 'Drivemotorvehiclewhenalcohollevelabovelimit',
            offenceTitleWelsh: 'Gyrrucerbydmodurpanoeddylefelalcoholynuwchnarterfyn',
            orderIndex: 1,
            startDate: '2018-03-17',
            wording: 'Wound/inflictgrievousbodilyharmwithoutintent',
            wordingWelsh: 'NoTravelCardInWelsh',
            plea: {
              offenceId: '294c821c-3f11-4e7b-aa51-3091c71342d9',
              pleaDate: null,
              pleaValue: null
            },
            allocationDecision: {
              allocationDecisionDate: '2018-07-25',
              motReasonDescription: 'No mode of Trial - Either way offence',
              courtIndicatedSentence: {
                courtIndicatedSentenceDescription: 'Test Sentence Indication'
              }
            },
            verdict: {
              offenceId: '294c821c-3f11-4e7b-aa51-3091c71342d9',
              verdictDate: null,
              verdictType: {
                id: null,
                code: '',
                description: '',
                category: '',
                categoryType: ''
              },
              originatingHearingId: 'dedafe52-0c47-4a59-8a22-12c618c663e8',
              lesserOrAlternativeOffence: null,
              jurors: {
                numberOfJurors: 12,
                numberOfSplitJurors: 0,
                unanimous: true
              }
            },
            results: [],
            incompleteResults: []
          }
        ],
        results: []
      }
    ],
    courtApplications: []
  }
] as any;
