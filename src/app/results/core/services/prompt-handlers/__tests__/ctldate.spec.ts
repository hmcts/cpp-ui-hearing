import { HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { Store, provideStore, provideState } from '@ngrx/store';
import { cold } from 'jasmine-marbles';
import { reducers } from '../../../../../core';
import {
  DraftResult,
  ExtendedResolvedDraftResultLine,
  PromptChoice
} from '../../../../results.interfaces';
import { DraftResultActions, resultsReducer, ResultsState } from '../../../store';
import { createDraftResult } from '../../../testing';
import { CreateResultPromptsForOffenceOptions, PromptHandler } from '../../reusable-info.service';
import { CtlDatePromptHandler } from '../ctldate';

describe('CtlDatePromptHandler', () => {
  let cppHttp: CppHttp;
  let promptHandler: PromptHandler;
  let store: Store<ResultsState>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideState('results', resultsReducer),
        provideCppCoreHttpServices(),
        CppHttp,
        CtlDatePromptHandler
      ],
      teardown: { destroyAfterEach: false }
    });

    cppHttp = TestBed.inject(CppHttp);
    promptHandler = TestBed.inject(CtlDatePromptHandler);
    store = TestBed.inject(Store);
  });

  const installDraftResult = (draftResult: DraftResult) => {
    store.dispatch(
      DraftResultActions.setDraftResult({
        draftResult
      })
    );
  };

  it('should match based on the promptRef', () => {
    const matchingPromptChoice = {
      promptRef: 'CTLDATE'
    } as PromptChoice;
    const nonMatchingPromptChoice = {
      promptRef: 'CTLDATE2'
    } as PromptChoice;

    expect(promptHandler.isEqual(matchingPromptChoice)).toBe(true);
    expect(promptHandler.isEqual(nonMatchingPromptChoice)).toBe(false);
  });

  it('should fetch no value when no bailStatus exists on the draft result', () => {
    const draftResult = createDraftResult({ results: ['NCOSTS'] });

    installDraftResult(draftResult);

    const expected$ = cold('(v|)', { v: undefined });
    const value$ = promptHandler.getValue({
      hearingId: 'hearingId'
    } as CreateResultPromptsForOffenceOptions);

    expect(value$).toBeObservable(expected$);
  });

  it('should fetch a CTL value when a bailStatus exists on the draft result', () => {
    const draftResult = createDraftResult({ results: ['NCOSTS'] });

    (draftResult.resultLines['UUID:1'] as ExtendedResolvedDraftResultLine).bailStatusCode = 'C';

    installDraftResult(draftResult);

    const ctlvalue$ = cold('--(r|)', { r: { custodyTimeLimit: '2020-01-31' } });
    const expected$ = cold('--(v|)', { v: '2020-01-31' });
    const value$ = promptHandler.getValue({
      hearingId: 'hearingId',
      offenceId: 'offenceId',
      orderedDate: '2020-01-01'
    } as CreateResultPromptsForOffenceOptions);

    cppHttp.query = jest.fn(() => ctlvalue$);

    expect(value$).toBeObservable(expected$);
    expect(cppHttp.query).toHaveBeenCalledWith({
      requestType: 'application/vnd.hearing.custody-time-limit+json',
      url: '/hearing-query-api/query/api/rest/hearing/hearings/hearingId/2020-01-01/offences/offenceId',
      params: new HttpParams({ fromObject: { bailStatusCode: 'C' } })
    });
  });
});
