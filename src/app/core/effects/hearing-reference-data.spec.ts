import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { cold, hot } from 'jasmine-marbles';
import { Observable, of } from 'rxjs';
import { VerdictType, AmendmentReason } from '..';
import {
  LoadVerdictsTypesAction,
  LoadVerdictsTypesSuccessAction,
  LoadAmendmentReasonsAction,
  LoadAmendmentReasonsSuccessAction
} from '../actions/hearing-reference-data';
import { HearingReferenceDataEffects } from './hearing-reference-data';
import { ApiError } from '../actions';
import { HearingService } from '../services/Hearing/hearing.service';

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

const mockAmendmentreasons: AmendmentReason[] = [
  {
    id: '0afc2f80-da83-47f8-94b1-545f332c12d4',
    seqNo: 10,
    reasonDescription: 'Admin error on shared result (a result recorded incorrectly)',
    validFrom: '2019-01-01'
  },
  {
    id: '9f2f159f-c7ea-420c-a53b-e70b1c0f0b06',
    seqNo: 20,
    reasonDescription:
      'Error or Omission in result announced in court (Amendment under the Slip rule)',
    validFrom: '2019-01-01'
  }
];

describe('Hearing ReferenceData effects', () => {
  let actions$: Observable<any>;
  let effects: HearingReferenceDataEffects;
  let getVerdictTypes: any;
  let getCourtCentres: any;
  let getAmendmentReasons: any;
  let getTrialTypes: any;

  const initialState = {
    hearingReferenceData: {
      verdictTypes: [] as VerdictType[],
      amendmentReasons: [] as AmendmentReason[]
    }
  };

  beforeEach(() => {
    getVerdictTypes = jest.fn();
    getCourtCentres = jest.fn();
    getAmendmentReasons = jest.fn();
    getTrialTypes = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        HearingReferenceDataEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState }),
        {
          provide: HearingService,
          useValue: {
            getVerdictTypes,
            getCourtCentres,
            getTrialTypes,
            getAmendmentReasons
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    effects = TestBed.inject(HearingReferenceDataEffects);
  });

  describe('getVerdictTypes$', () => {
    it('should get the verdictTypes calling referenceData service', () => {
      getVerdictTypes.mockReturnValue(of(verdictTypes));
      const inputAction = new LoadVerdictsTypesAction();
      const outputAction = new LoadVerdictsTypesSuccessAction(verdictTypes);

      actions$ = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      expect(effects.getVerdictsTypes$).toBeObservable(expected$);
      expect(getVerdictTypes).toHaveBeenCalled();
    });

    it('should verdictTypes$ : error expect throw ApiError', () => {
      const triggerAction: LoadVerdictsTypesAction = new LoadVerdictsTypesAction();
      const expectedAction: ApiError = new ApiError('error');
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });

      getVerdictTypes.mockReturnValue(error$);
      actions$ = hot('-a', { a: triggerAction });

      expect(effects.getVerdictsTypes$).toBeObservable(expected);
    });
  });

  describe('loadAmendmentReasons$', () => {
    it('should return the amendment reasons from reference-data', () => {
      const inputAction = new LoadAmendmentReasonsAction();
      const outputAction = new LoadAmendmentReasonsSuccessAction(mockAmendmentreasons);

      getAmendmentReasons.mockReturnValue(of(mockAmendmentreasons));
      actions$ = cold('-a', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      expect(effects.loadAmendmentReasons$).toBeObservable(expected$);
    });

    it('should loadAmendmentReasons$ : error expect throw ApiError', () => {
      const triggerAction: LoadAmendmentReasonsAction = new LoadAmendmentReasonsAction();
      const expectedAction: ApiError = new ApiError('error');
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });

      getAmendmentReasons.mockReturnValue(error$);
      actions$ = hot('-a', { a: triggerAction });

      expect(effects.loadAmendmentReasons$).toBeObservable(expected);
    });
  });
});
