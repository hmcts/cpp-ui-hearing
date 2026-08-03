import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { AppState, HearingNotLockedByOtherUserGuard, reducers } from '..';

describe('LoadVerdictTypesGuard', () => {
  let guard: HearingNotLockedByOtherUserGuard;
  let store: Store<AppState>;

  let getIsHearingLockedBySomeoneElse: jest.Mock;
  let navigateByUrl: jest.Mock;

  beforeEach(() => {
    getIsHearingLockedBySomeoneElse = jest.fn();
    navigateByUrl = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        HearingNotLockedByOtherUserGuard,
        {
          provide: Router,
          useValue: {
            navigateByUrl
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.get(HearingNotLockedByOtherUserGuard);
    store = TestBed.get(Store);

    jest.spyOn(store, 'dispatch');
  });

  const createSnapshot = (referenceDataErrorRedirectTo = '') => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.data = {
      referenceDataErrorRedirectTo
    };
    return snapshot;
  };

  it('should resolve to true if hearing is not locked by someone else', () => {
    expect.assertions(0);
    const snapshot = createSnapshot();

    getIsHearingLockedBySomeoneElse.mockReturnValue(of(false));

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(true);
    });
  });

  it('should resolve to false if hearing is locked by someone else', () => {
    expect.assertions(0);
    const snapshot = createSnapshot('/unauthorised-access');

    getIsHearingLockedBySomeoneElse.mockReturnValue(of(true));

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(false);
      expect(navigateByUrl).toHaveBeenCalledWith('/unauthorised-access');
    });
  });

  it('should reject the activation when there is an error', () => {
    expect.assertions(0);
    const error = new HttpErrorResponse({ status: 500 });
    const snapshot = createSnapshot('/technical-error');

    getIsHearingLockedBySomeoneElse.mockReturnValue(throwError(error));

    guard.canActivate(snapshot).subscribe(didResolve => {
      expect(didResolve).toBe(false);
      expect(navigateByUrl).toHaveBeenCalledWith('/technical-error');
    });
  });
});
