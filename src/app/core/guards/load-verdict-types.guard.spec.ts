import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { ActionReducerMap, Store, provideStore } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { HearingService, LoadVerdictsTypesSuccessAction } from '..';
import {
  hearingReferencedataReducer,
  HearingReferenceDataState,
} from '../reducers/hearing-reference-data';
import { LoadVerdictTypesGuard } from './load-verdict-types.guard';

describe('LoadVerdictTypesGuard', () => {
  let guard: LoadVerdictTypesGuard;
  let store: Store<HearingReferenceDataState>;

  let getVerdictTypes: jest.Mock;
  let navigateByUrl: jest.Mock;

  beforeEach(() => {
    getVerdictTypes = jest.fn();
    navigateByUrl = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideStore(
          {
            hearingReferenceData: hearingReferencedataReducer,
          } as ActionReducerMap<{
            hearingReferenceData: HearingReferenceDataState;
          }>,
          {
            runtimeChecks: {},
          }
        ),
        provideRouter([]),
        LoadVerdictTypesGuard,
        {
          provide: HearingService,
          useValue: {
            getVerdictTypes,
          },
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl,
          },
        },
      ],
      teardown: { destroyAfterEach: false },
    });

    guard = TestBed.inject(LoadVerdictTypesGuard);
    store = TestBed.inject(Store);

    jest.spyOn(store, 'dispatch');
  });

  const createSnapshot = (referenceDataErrorRedirectTo = '') => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.data = {
      referenceDataErrorRedirectTo,
    };
    return snapshot;
  };

  it('should resolve to true when the verdict types exist in the store', () => {
    expect.assertions(1);
    const snapshot = createSnapshot();

    store.dispatch(new LoadVerdictsTypesSuccessAction([]));

    guard.canActivate(snapshot).subscribe((didResolve) => {
      expect(didResolve).toBe(true);
    });
  });

  it('should resolve to true after fetching verdict types from the server when not found in the store', () => {
    expect.assertions(2);
    const snapshot = createSnapshot();

    getVerdictTypes.mockReturnValue(of([]));

    guard.canActivate(snapshot).subscribe((didResolve) => {
      expect(didResolve).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(new LoadVerdictsTypesSuccessAction([]));
    });
  });

  it('should reject the activation when there is an error fetching the hearing types', () => {
    expect.assertions(2);
    const error = new HttpErrorResponse({ status: 500 });
    const snapshot = createSnapshot('/error-page');

    getVerdictTypes.mockReturnValue(throwError(error));

    guard.canActivate(snapshot).subscribe((didResolve) => {
      expect(didResolve).toBe(false);
      expect(navigateByUrl).toHaveBeenCalledWith('/error-page');
    });
  });
});
