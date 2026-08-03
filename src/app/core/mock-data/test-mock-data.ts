export const targets = [
  {
    defendantId: 'e1d32d9d-29ec-4934-a932-22a50f223966',
    draftResult:
      '{"targetId":"TARGET_ID_2","caseId":"2279b2c3-b0d3-4889-ae8e-1ecc20c39e27","defendantId":"e1d32d9d-29ec-4934-a932-22a50f223966","offenceId":"3789ab16-0bb7-4ef1-87ef-c936bf0364f9","addMoreResults":false,"results":[{"resultLineId":"RESULT_LINE_ID","dirty":true,"originalText":"FO","resultCode":"969f150c-cd05-46b0-9dd9-30891efcc766","resultLevel":"O","isCompleted":true,"parts":[{"value":"Fine","type":"RESULT","state":"RESOLVED","resultChoices":[]},{"code":"7cd1472f-2379-4f5b-9e67-98a43d86e122","label":"Amount of fine","value":"200","type":"CURR","state":"RESOLVED","resultChoices":[]}],"choices":[{"code":"7cd1472f-2379-4f5b-9e67-98a43d86e122","value":"200","label":"Amount of fine","type":"CURR","required":true}],"isEditing":false,"noResultFound":false,"orderedDate":"2018-03-03"}],"defendantFirstName":"Eric","defendantLastName":"Ormsby","orderedDate":"2018-03-03"}',
    hearingId: 'd50745bf-318b-41aa-8267-d7a66b41c4bf',
    offenceId: '2f7810cc-7bc4-4015-9469-675a337e9ee5',
    resultLines: [
      {
        delegatedPowers: {
          firstName: 'David',
          lastName: 'Bowie',
          userId: '9fc282f7-95cb-4660-8570-a204c5cf74b3'
        },
        isComplete: true,
        isModified: true,
        level: 'OFFENCE',
        orderedDate: '2018-08-30',
        prompts: [
          {
            fixedListCode: 'fixedlistcode0',
            id: '10d81ccf-4561-4a4d-936c-2baf0eeee8df',
            label: 'imprisonment term',
            value: '6 years',
            welshValue: '6 blynedd'
          }
        ],
        resultDefinitionId: '86303e9a-bd16-43f4-9437-d33e378970d1',
        resultLabel: 'imprisonment',
        resultLineId: '23cf38fe-7c8c-450d-9572-5ac58d9d674a',
        sharedDate: '2018-08-30'
      }
    ],
    targetId: '6481550b-8168-4836-8507-36064c62c9fe'
  },
  {
    defendantId: '91d32d9d-29ec-4934-a932-22a50f223964',
    draftResult:
      '{"targetId":"TARGET_ID_3","caseId":"7279b2c3-b0d3-4889-ae8e-1ecc20c39e29","defendantId":"91d32d9d-29ec-4934-a932-22a50f223964","offenceId":"5789ab16-0bb7-4ef1-87ef-c936bf0364f0","addMoreResults":false,"results":[{"resultLineId":"RESULT_LINE_ID","dirty":true,"originalText":"FO","resultCode":"969f150c-cd05-46b0-9dd9-30891efcc766","resultLevel":"O","isCompleted":true,"parts":[{"value":"Fine","type":"RESULT","state":"RESOLVED","resultChoices":[]},{"code":"7cd1472f-2379-4f5b-9e67-98a43d86e122","label":"Amount of fine","value":"400","type":"CURR","state":"RESOLVED","resultChoices":[]}],"choices":[{"code":"7cd1472f-2379-4f5b-9e67-98a43d86e122","value":"400","label":"Amount of fine","type":"CURR","required":true}],"isEditing":false,"noResultFound":false,"orderedDate":"2018-03-03"}],"defendantFirstName":"Eric","defendantLastName":"Ormsby","orderedDate":"2018-03-03"}',
    hearingId: 'd50745bf-318b-41aa-8267-d7a66b41c4bf',
    offenceId: '5789ab16-0bb7-4ef1-87ef-c936bf0364f0',
    resultLines: [
      {
        delegatedPowers: {
          firstName: 'David',
          lastName: 'Bowie',
          userId: '9fc282f7-95cb-4660-8570-a204c5cf74b3'
        },
        isComplete: true,
        isModified: true,
        level: 'OFFENCE',
        orderedDate: '2018-08-30',
        prompts: [
          {
            fixedListCode: 'fixedlistcode0',
            id: '10d81ccf-4561-4a4d-936c-2baf0eeee8df',
            label: 'imprisonment term',
            value: '6 years',
            welshValue: '6 blynedd'
          }
        ],
        resultDefinitionId: '86303e9a-bd16-43f4-9437-d33e378970d1',
        resultLabel: 'imprisonment',
        resultLineId: '23cf38fe-7c8c-450d-9572-5ac58d9d674a',
        sharedDate: '2018-08-30'
      }
    ],
    targetId: '7481550b-8168-4836-8507-36064c62c9f0'
  }
];

export const targetData = [
  {
    targetId: targets[0].targetId,
    caseId: '2279b2c3-b0d3-4889-ae8e-1ecc20c39e27',
    defendantId: targets[0].defendantId,
    offenceId: targets[0].offenceId,
    defendantFirstName: 'John',
    defendantLastName: 'Doe',
    originalText: 'Original Text Test Data',
    addMoreResults: [],
    delegatedPowers: [],
    amendmentReason: []
  },
  {
    targetId: targets[1].targetId,
    caseId: '2279b2c3-b0d3-4889-ae8e-1ecc20c39e29',
    defendantId: targets[1].defendantId,
    offenceId: targets[1].offenceId,
    defendantFirstName: 'Joanne',
    defendantLastName: 'Doe',
    originalText: 'Original Text Test Data',
    addMoreResults: [],
    delegatedPowers: [],
    amendmentReason: []
  }
] as any[];

export const targetApplicationData = [
  {
    targetId: targets[0].targetId,
    applicationId: '2279b2c3-b0d3-4889-ae8e-1ecc20c39e29',
    applicantFirstName: 'John',
    applicantLastName: 'Doe',
    applicationOutcome: null,
    hearingId: '1',
    typeId: '1',
    originalText: 'test text',
    addMoreResults: false,
    results: [],
    delegatedPowers: false,
    amendmentReason: null,
    amendmentDate: '2018-08-30'
  },
  {
    targetId: targets[1].targetId,
    applicationId: '2279b2c3-b0d3-4889-ae8e-1ecc20c39e39',
    applicantFirstName: 'Joanne',
    applicantLastName: 'Doe',
    applicationOutcome: null,
    hearingId: '1',
    typeId: '1',
    originalText: 'test text',
    addMoreResults: false,
    results: [],
    delegatedPowers: false,
    amendmentReason: null,
    amendmentDate: '2018-08-30'
  },
  {
    targetId: targets[1].targetId,
    applicationId: '2279b2c3-b0d3-4889-ae8e-1ecc20c39e39',
    applicantFirstName: 'Joanne',
    applicantLastName: 'Doe',
    applicationOutcome: null,
    hearingId: '1',
    typeId: '1',
    originalText:
      '\n":"FO","resultCode":"969f150c-cd05-46b0-9dd9-30891efcc766","resultLevel":"O","isCompleted":true,"parts":[{"value":"Fine","type":"RESULT","state":"RESOLVED","resultChoices":[]},{"code":"7cd1472f-2379-4f5b-9e67-98a43d86e122","label":"Amount of fine","value":"200","type":"CURR","state":"RESOLVED","resultChoices":[]}],"choices":[{"code":"7cd1472f-2379-4f5b-9e67-98a43d86e122","value":"200","label":"Amount of fine","type":"CURR","required":true}],"isEditing":false,"noResultFound":false,"orderedDate":"2018-03-03"}],"defendantFirstName":"Eric","defendantLastName":"Ormsby","orderedDate":"2018-03-03"}',
    addMoreResults: false,
    results: [],
    delegatedPowers: false,
    amendmentReason: null,
    amendmentDate: '2018-08-30'
  }
] as any[];
