import { TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { cold } from 'jasmine-marbles';
import { of } from 'rxjs';
import { mockSummary } from '../../mock-data/test-mock-data';
import { FutureHearingsLoaded } from '../actions';
import { AppState } from '../reducers';
import { getCaseIdsForHearing } from '../selectors';
import { FutureHearingsService } from '../services';
import { LoadFutureHearingsGuard } from './load-future-hearings';

describe('Load future hearings guard', () => {
  let getFutureHearingForCases: jest.Mock;
  let guard: LoadFutureHearingsGuard;
  let store: MockStore<AppState>;

  beforeEach(() => {
    getFutureHearingForCases = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        LoadFutureHearingsGuard,
        {
          provide: FutureHearingsService,
          useValue: {
            getFutureHearingForCases
          }
        },
        provideMockStore({
          initialState: {},
          selectors: [
            {
              selector: getCaseIdsForHearing,
              value: ['case-id']
            }
          ]
        })
      ],
      teardown: { destroyAfterEach: false }
    });
    guard = TestBed.inject(LoadFutureHearingsGuard);
    store = TestBed.inject(MockStore);

    jest.spyOn(store, 'dispatch');
  });

  it('should load the summaries and allow access', () => {
    const response = [mockSummary];
    getFutureHearingForCases.mockReturnValue(of(response));
    const result$ = guard.canActivate();
    const expected$ = cold('(a|)', { a: true });
    expect(result$).toBeObservable(expected$);
    expect(getFutureHearingForCases).toHaveBeenCalled();
    expect(store.dispatch).toHaveBeenCalledWith(new FutureHearingsLoaded(response));
  });
});
