import * as ReferenceDataActions from '../actions/hearing-reference-data';
import { VerdictType, AmendmentReason } from '../model';
import { SentencingIndication } from '../model/sentencing-indication';
import { hearingReferencedataReducer, HearingReferenceDataState } from './hearing-reference-data';

// TODO: Need a json file to be loaded containing test data

const verdictTypes: VerdictType[] = [
  {
    id: '7e2f843e-d639-40b3-8611-8015f3a18951',
    description: 'Guilty',
    category: 'Guilty',
    categoryType: 'GUILTY',
    sequence: 1,
    validFrom: '2017-08-01',
    validTo: '2017-08-01'
  },
  {
    id: '7e2f843e-d639-40b3-8611-8015f3a18950',
    description: 'Not Guilty',
    category: 'Not Guilty',
    categoryType: 'NOT_GUILTY',
    sequence: 1,
    validFrom: '2017-08-01',
    validTo: '2017-08-01'
  }
];

const amendmentReasons: AmendmentReason[] = [
  {
    id: 'test1-id',
    seqNo: 1,
    reasonDescription: 'test-description'
  }
];

const applicationOutcomeTypeByApplicationMap = {
  'application-id': [
    {
      id: 'test1-id',
      sequence: 10,
      description: 'test-description'
    }
  ]
};

const sentencingIndications = [
  {
    id: 'test1-id',
    sentencingIndicationCode: 'LG',
    sentencingIndicationDescription: 'test description'
  }
] as SentencingIndication[];

const alcoholLevelMethods = [
  {
    id: '7950068c-900f-4b53-80e0-6f387d11e128',
    seqNo: 1,
    methodCode: 'A',
    methodDescription: 'Blood'
  },
  {
    id: 'c81e728d-9d4c-3f63-af06-7f89cc14862c',
    seqNo: 2,
    methodCode: 'B',
    methodDescription: 'Breath'
  }
];

describe('hearingReferencedataReducer', () => {
  const mockedReferenceDataState = {
    verdictTypes: [],
    amendmentReasons: [],
    courtApplicationOutcomeTypes: {},
    courtApplicationResponseTypes: {},
    motReasons: [],
    sentencingIndications: []
  } as HearingReferenceDataState;

  it('should return verdictTypes when loaded', () => {
    const state = mockedReferenceDataState;
    const actual = hearingReferencedataReducer(
      state,
      new ReferenceDataActions.LoadVerdictsTypesSuccessAction(verdictTypes)
    );
    expect(actual.verdictTypes).toEqual(verdictTypes);
  });

  it('should return alcoholLevelMethods when loaded', () => {
    const state = mockedReferenceDataState;
    const actual = hearingReferencedataReducer(
      state,
      new ReferenceDataActions.LoadAlcoholLevelMethodsSuccessAction(alcoholLevelMethods)
    );
    expect(actual.alcoholLevelMethods).toEqual(alcoholLevelMethods);
  });

  it('should return amendment reasons when loaded', () => {
    const state = mockedReferenceDataState;
    const actual = hearingReferencedataReducer(
      state,
      new ReferenceDataActions.LoadAmendmentReasonsSuccessAction(amendmentReasons)
    );
    expect(actual.amendmentReasons).toEqual(amendmentReasons);
  });

  it('should return court applicant outcome types when loaded', () => {
    const state = mockedReferenceDataState;
    const actual = hearingReferencedataReducer(
      state,
      new ReferenceDataActions.LoadCourtAplicationOutcomeTypesSuccessAction(
        applicationOutcomeTypeByApplicationMap
      )
    );
    expect(actual.courtApplicationOutcomeTypes).toEqual(applicationOutcomeTypeByApplicationMap);
  });

  it('should return court applicant response types when loaded', () => {
    const state = mockedReferenceDataState;
    const actual = hearingReferencedataReducer(
      state,
      new ReferenceDataActions.LoadCourtAplicationResponseTypesSuccessAction({})
    );
    expect(actual.courtApplicationResponseTypes).toEqual({});
  });

  it('should return sentencing indications when loaded', () => {
    const state = mockedReferenceDataState;
    // tslint:disable-next-line: max-line-length
    const actual = hearingReferencedataReducer(
      state,
      new ReferenceDataActions.LoadSentencingIndicationsSuccessAction(sentencingIndications)
    );
    expect(actual.sentencingIndications).toEqual(sentencingIndications);
  });
});
