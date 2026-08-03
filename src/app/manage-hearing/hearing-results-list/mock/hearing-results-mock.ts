export const hearingResultsMock = {
  defendants: [
    {
      defendantId: '95fb6e57-49f9-4bf8-b93d-12a95d92846d',
      masterDefendantId: '95fb6e57-49f9-4bf8-b93d-12a95d92846d',
      attendanceType: {
        attendanceDays: [
          {
            attendanceType: 'IN_PERSON',
            day: '2020-02-13'
          }
        ]
      },
      cases: [
        {
          caseId: '0e448414-62ec-4f92-9c61-44d608079353',
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
              incompleteResults: [],
              index: 0
            }
          ],
          results: []
        }
      ]
    }
  ]
} as any;
