import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { FutureHearingsService } from '../services';
import { RemoveFutureHearingsConfirmed, ApiError, RemoveFutureHearingsSuccess } from '../actions';
import { cold } from 'jasmine-marbles';
import { RemoveFutureHearingEffects } from './remove-future-hearing';
import { Observable, of, throwError } from 'rxjs';
import { getHearingId } from '../selectors';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { HttpErrorResponse } from '@angular/common/http';

describe('Remove future hearing effects', () => {
  let actions$: Observable<any>;
  let effects: RemoveFutureHearingEffects;
  let removeFutureHearing: jest.Mock;
  let navigate: jest.Mock;

  beforeEach(() => {
    navigate = jest.fn(() => of(true));
    removeFutureHearing = jest.fn(() => of(true));
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideRouter([]),
        RemoveFutureHearingEffects,
        MockStore,
        provideMockStore({ initialState: {} }),
        provideMockActions(() => actions$),
        {
          provide: FutureHearingsService,
          useValue: {
            removeFutureHearing
          }
        },
        { provide: Router, useValue: { navigate } }
      ],
      teardown: { destroyAfterEach: false }
    });
    getHearingId.setResult('new-hearing-id');
    effects = TestBed.inject<RemoveFutureHearingEffects>(RemoveFutureHearingEffects);
  });

  it('should remove future hearings and reset', () => {
    actions$ = of(new RemoveFutureHearingsConfirmed([{ hearingId: 'hearing-id' }]));

    const expectedAction = new RemoveFutureHearingsSuccess();
    const expected$ = cold('(a|)', { a: expectedAction });
    expect(effects.removeFutureHearing$).toBeObservable(expected$);
    expect(removeFutureHearing).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/manage/new-hearing-id']);
  });

  it('should remove future hearings and reset', () => {
    actions$ = of(new RemoveFutureHearingsConfirmed([{ hearingId: 'new-hearing-id' }]));

    const expectedAction = new RemoveFutureHearingsSuccess();
    const expected$ = cold('(a|)', { a: expectedAction });
    expect(effects.removeFutureHearing$).toBeObservable(expected$);
    expect(removeFutureHearing).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('should throw ApiError', () => {
    const error = new HttpErrorResponse({ status: 403 });
    removeFutureHearing.mockReturnValue(throwError(error));
    actions$ = of(new RemoveFutureHearingsConfirmed([{ hearingId: 'hearing-id' }]));
    const expectedAction = new ApiError(error);
    const expected$ = cold('(a|)', { a: expectedAction });
    expect(effects.removeFutureHearing$).toBeObservable(expected$);
  });
});
