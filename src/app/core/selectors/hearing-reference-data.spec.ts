import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngrx/store';
import * as fromActions from '../actions/hearing-reference-data';
import { VerdictType } from '../model';
import { MotReason } from '../model/mot-reason';
import { SentencingIndication } from '../model/sentencing-indication';
import * as fromRoot from '../reducers';
import * as fromSelectors from './hearing-reference-data';

let store: Store<fromRoot.AppState>;

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

const amendmentReasons = [
  {
    id: 'test1-id',
    seqNo: 1,
    reasonDescription: 'test description'
  }
];

const motReasons = [
  {
    id: 'test1-id',
    description: 'test description'
  }
] as MotReason[];

const sentencingIndications = [
  {
    id: 'test1-id',
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

describe('hearingReferenceData selectors', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStore(fromRoot.reducers, { runtimeChecks: {} })],
      teardown: { destroyAfterEach: false }
    });

    store = TestBed.inject(Store);
  });

  it('should return the verdictTypes stored in the store', () => {
    let result;

    store.select(fromSelectors.getVerdictTypes).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(new fromActions.LoadVerdictsTypesSuccessAction(verdictTypes));
    expect(result).toEqual(verdictTypes);
  });

  it('should return the alcoholLevelMethods stored in the store', () => {
    let result;

    store.select(fromSelectors.getAlcoholLevelMethods).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(new fromActions.LoadAlcoholLevelMethodsSuccessAction(alcoholLevelMethods));
    expect(result).toEqual(alcoholLevelMethods);
  });

  it('should return the amendment reasons stored in the store', () => {
    let result;

    store.select(fromSelectors.getAmendmentReasons).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(new fromActions.LoadAmendmentReasonsSuccessAction(amendmentReasons));
    expect(result).toEqual(amendmentReasons);
  });

  it('should return the mot reasons stored in the store', () => {
    let result;

    store.select(fromSelectors.getMotReasons).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(new fromActions.LoadMotReasonSuccessAction(motReasons));
    expect(result).toEqual(motReasons);
  });

  it('should return the sentencing indications stored in the store', () => {
    let result;

    store.select(fromSelectors.getSentencingIndicatations).subscribe(value => (result = value));

    expect(result).toEqual([]);

    store.dispatch(new fromActions.LoadSentencingIndicationsSuccessAction(sentencingIndications));
    expect(result).toEqual(sentencingIndications);
  });
});
