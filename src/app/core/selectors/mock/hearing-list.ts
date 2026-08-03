const mock = [
  {
    courtApplicationSummaries: [
      {
        applicant: {
          firstName: 'Bryce',
          id: '3adf7c90-7fc4-4c42-a79c-748c1e64f982',
          lastName: 'Hammes',
          middleName: 'Test',
          organisationName: 'Testing Organisation Name',
          synonym: 'Attendees'
        },
        applicationReference: '48CU888909',
        id: '9fc0a60e-44d0-45bd-a71b-dfc0953a6635',
        respondents: [
          {
            firstName: 'America',
            id: '421b0a0a-a7f1-46f9-b142-f85d5d3e95a2',
            lastName: 'Ryan',
            organisationName: 'Responding Organisation Name'
          }
        ]
      }
    ],
    hasSharedResults: true,
    hearingDays: [
      {
        listedDurationMinutes: 40,
        listingSequence: 1,
        sittingDay: '2019-07-24T10:24:21.386Z'
      },
      {
        listedDurationMinutes: 40,
        listingSequence: 1,
        sittingDay: '2019-07-25T10:24:21.385Z'
      }
    ],
    hearingLanguage: 'ENGLISH',
    id: '337fb791-adfd-11e9-9ea8-73f777213b3e',
    jurisdictionType: 'CROWN',
    prosecutionCaseSummaries: [
      {
        defendants: [
          {
            id: '337fb790-adfd-11e9-9ea8-73f777213b3e',
            organisationName: 'TestNameLei',
            synonym: 'is this from aliases ?'
          }
        ],
        id: '337fdea2-adfd-11e9-9ea8-73f777213b3e',
        prosecutionCaseIdentifier: {
          prosecutionAuthorityCode: 'TFL',
          prosecutionAuthorityId: '33802cc0-adfd-11e9-9ea8-73f777213b3e',
          prosecutionAuthorityReference: '',
          caseURN: '20XG265184'
        }
      }
    ],
    reportingRestrictionReason:
      'Automatic anonymity under the Sexual Offences (Amendment) Act 1992',
    type: {
      description: '20XG265184',
      id: 'bf8155e1-90b9-4080-b133-bfbad895d6e4'
    }
  }
];

export default mock;
