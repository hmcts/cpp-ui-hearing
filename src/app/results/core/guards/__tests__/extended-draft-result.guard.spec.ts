import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { Store, provideStore, provideState } from '@ngrx/store';
import { cold } from 'jasmine-marbles';
import { ApiError, reducers, SetSelectedHearingDateAction } from '../../../../core';
import { ResultsService } from '../../services/results.service';
import {
  DraftResultActions,
  resultsReducer,
  ResultsState,
  ResultsValidationActions
} from '../../store';
import { createDraftResult } from '../../testing';
import { ExtendedDraftResultGuard } from '../extended-draft-result.guard';

describe('ExtendedDraftResultGuard', () => {
  let guard: ExtendedDraftResultGuard;
  let store: Store<ResultsState>;
  let fetchExtendedDraftResult: jest.Mock;
  let navigate: jest.Mock;
  let getCurrentNavigation: jest.Mock;

  beforeEach(() => {
    fetchExtendedDraftResult = jest.fn();
    navigate = jest.fn();
    getCurrentNavigation = jest.fn().mockReturnValue(null);

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideState('results', resultsReducer),
        ExtendedDraftResultGuard,
        {
          provide: ResultsService,
          useValue: {
            fetchExtendedDraftResult
          }
        },
        {
          provide: Router,
          useValue: {
            navigate,
            getCurrentNavigation
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(ExtendedDraftResultGuard);
    store = TestBed.inject(Store);
    store.dispatch(new SetSelectedHearingDateAction('2020-01-01'));

    jest.spyOn(store, 'dispatch');
  });

  const createSnapshot = (hearingId: string) => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.params = { hearingId };
    return snapshot;
  };

  const draftResult = createDraftResult({ hearingId: 'hearingId', hearingDay: '2020-01-01' });

  it('should resolve to true when the draft result exists in the store', () => {
    store.dispatch(DraftResultActions.setDraftResult({ draftResult }));
    const snapshot = createSnapshot('hearingId');
    const expected$ = cold('(e|)', { e: true });

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
  });

  it('should re-validate results when the draft result already exists in the store', () => {
    store.dispatch(DraftResultActions.setDraftResult({ draftResult }));
    (store.dispatch as jest.Mock).mockClear();
    const snapshot = createSnapshot('hearingId');
    const expected$ = cold('(e|)', { e: true });

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(store.dispatch).toHaveBeenCalledWith(
      ResultsValidationActions.validateResults({ navigateOnSuccess: false })
    );
  });

  it('should not re-validate results when the navigation came from an already-validated save', () => {
    store.dispatch(DraftResultActions.setDraftResult({ draftResult }));
    (store.dispatch as jest.Mock).mockClear();
    getCurrentNavigation.mockReturnValue({
      extras: { state: { skipResultsValidation: true } }
    });
    const snapshot = createSnapshot('hearingId');
    const expected$ = cold('(e|)', { e: true });

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(store.dispatch).not.toHaveBeenCalledWith(
      ResultsValidationActions.validateResults({ navigateOnSuccess: false })
    );
  });

  it('should resolve to true after fetching the draft result for the current hearing day', () => {
    const snapshot = createSnapshot('hearingId');
    const response$ = cold('--(r|)', { r: draftResult });
    const expected$ = cold('--(e|)', { e: true });

    fetchExtendedDraftResult.mockReturnValue(response$);

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(fetchExtendedDraftResult).toHaveBeenCalledWith(
      'hearingId',
      '2020-01-01',
      false,
      undefined
    );
    expect(store.dispatch).toHaveBeenCalledWith(DraftResultActions.setDraftResult({ draftResult }));
  });

  it('should reject the activation when there is an error fetching the draft result', () => {
    const error = new HttpErrorResponse({ status: 500 });
    const snapshot = createSnapshot('hearingId');
    const response$ = cold('--#', undefined, error);
    const expected$ = cold('--(e|)', { e: false });

    fetchExtendedDraftResult.mockReturnValue(response$);

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(store.dispatch).toHaveBeenCalledWith(new ApiError(error));
    expect(navigate).not.toHaveBeenCalled();
  });
});
