import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { ActionReducerMap, Store, provideStore } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { HearingService, LoadAmendmentReasonsSuccessAction } from '..';
import {
  hearingReferencedataReducer,
  HearingReferenceDataState
} from '../reducers/hearing-reference-data';
import { LoadAmendmentReasonsGuard } from './load-amendment-reasons.guard';

describe('LoadAmendmentReasonsGuard', () => {
  let guard: LoadAmendmentReasonsGuard;
  let store: Store<HearingReferenceDataState>;

  let getAmendmentReasons: jest.Mock;
  let navigateByUrl: jest.Mock;

  beforeEach(() => {
    getAmendmentReasons = jest.fn();
    navigateByUrl = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideStore(
          {
            hearingReferenceData: hearingReferencedataReducer
          } as ActionReducerMap<{
            hearingReferenceData: HearingReferenceDataState;
          }>,
          {
            runtimeChecks: {}
          }
        ),
        provideRouter([]),
        LoadAmendmentReasonsGuard,
        {
          provide: HearingService,
          useValue: {
            getAmendmentReasons
          }
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(LoadAmendmentReasonsGuard);
    store = TestBed.inject(Store);

    jest.spyOn(store, 'dispatch');
  });

  const createSnapshot = (referenceDataErrorRedirectTo = '') => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.data = {
      referenceDataErrorRedirectTo
    };
    return snapshot;
  };

  it('should resolve to true when the amendment reasons exist in the store', () => {
    expect.assertions(1);
    const snapshot = createSnapshot();

    store.dispatch(new LoadAmendmentReasonsSuccessAction([]));

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
    });
  });

  it('should resolve to true after fetching amendment reasons from the server when not found in the store', () => {
    expect.assertions(2);
    const snapshot = createSnapshot();

    getAmendmentReasons.mockReturnValue(of([]));

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
      expect(store.dispatch).toHaveBeenCalledWith(new LoadAmendmentReasonsSuccessAction([]));
    });
  });

  it('should reject the activation when there is an error fetching the hearing types', () => {
    expect.assertions(2);
    const error = new HttpErrorResponse({ status: 500 });
    const snapshot = createSnapshot('/error-page');

    getAmendmentReasons.mockReturnValue(throwError(error));

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(false);
      expect(navigateByUrl).toHaveBeenCalledWith('/error-page');
    });
  });
});
