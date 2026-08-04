import { provideStore } from '@ngrx/store';
import { reducers } from '../../core/reducers';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { getHasFutureHearings } from '../../core/selectors';
import { CheckFutureHearingsGuard } from './check-future-hearings';
import { cold } from 'jasmine-marbles';

describe('Check future hearings guard', () => {
  let guard: CheckFutureHearingsGuard;
  let routeSnapshot: ActivatedRouteSnapshot;
  let navigate: jest.Mock;
  const HEARING_ID = 'HEARING-ID';

  beforeEach(() => {
    navigate = jest.fn();
    routeSnapshot = new ActivatedRouteSnapshot();
    routeSnapshot.params = { hearingId: HEARING_ID };
    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        CheckFutureHearingsGuard,
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
      ],
      teardown: { destroyAfterEach: false },
    });
    guard = TestBed.inject(CheckFutureHearingsGuard);
  });

  describe('when there are future hearings in the store', () => {
    beforeEach(() => {
      getHasFutureHearings.setResult(true);
    });

    it('should allow access', () => {
      const result$ = guard.canActivate(routeSnapshot);
      const expected$ = cold('(a|)', { a: true });
      expect(result$).toBeObservable(expected$);
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('when there are no future hearings in the store', () => {
    beforeEach(() => {
      getHasFutureHearings.setResult(false);
    });

    it('should not allow access', () => {
      const result$ = guard.canActivate(routeSnapshot);
      const expected$ = cold('(a|)', { a: false });
      expect(result$).toBeObservable(expected$);
      expect(navigate).toHaveBeenCalledWith(['manage', HEARING_ID]);
    });
  });
});
