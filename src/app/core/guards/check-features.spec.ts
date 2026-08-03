import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { TestBed } from '@angular/core/testing';
import { cold } from 'jasmine-marbles';
import { CheckFeaturesGuard } from './check-features';
import { AppState, reducers } from '../reducers';
import { UserService } from '@cpp/users-groups';
import { UsersGroupsActions } from '@cpp/users-groups';

describe('CheckFeaturesGuard', () => {
  let guard: CheckFeaturesGuard;
  let store: Store<AppState>;
  let navigate: jest.Mock;
  let snapshot: ActivatedRouteSnapshot;
  const features = [{ key: 'feature-a' }, { key: 'feature-b' }];
  const userServices: UserService[] = [<UserService>{ name: 'service-a', features }];

  beforeEach(() => {
    navigate = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        CheckFeaturesGuard,
        {
          provide: Router,
          useValue: {
            navigate
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(CheckFeaturesGuard);
    store = TestBed.inject(Store);
    jest.spyOn(store, 'dispatch');
  });

  beforeEach(() => (snapshot = new ActivatedRouteSnapshot()));

  describe('when features are present in the state', () => {
    beforeEach(() => {
      store.dispatch(UsersGroupsActions.setUserServices({ userServices }));
    });

    it('should resolve to true when at least one of the expected features is allowed', () => {
      snapshot.data = {
        allowedFeatures: ['feature-a', 'feature-c']
      };
      const expected$ = cold('(a|)', { a: true });
      const activate$ = guard.canActivate(snapshot);

      expect(activate$).toBeObservable(expected$);
    });

    it('should resolve to false and redirect when the expected features are not allowed', () => {
      snapshot.data = {
        allowedFeatures: ['feature-c']
      };
      const expected$ = cold('(a|)', { a: false });
      expect(navigate).not.toHaveBeenCalled();
      const activate$ = guard.canActivate(snapshot);
      expect(activate$).toBeObservable(expected$);
      expect(navigate).toHaveBeenCalledWith(['/unauthorised-access']);
    });
  });

  describe('when features are not present in the state', () => {
    it('should resolve to false and redirect even when the expected features are allowed', () => {
      snapshot.data = {
        allowedFeatures: ['feature-b']
      };
      const expected$ = cold('(b|)', { b: false });

      const activate$ = guard.canActivate(snapshot);
      expect(activate$).toBeObservable(expected$);
      expect(navigate).toHaveBeenCalledWith(['/unauthorised-access']);
    });

    it('should resolve to false and redirect when the expected features are not allowed', () => {
      snapshot.data = {
        allowedFeatures: ['feature-c']
      };
      const expected$ = cold('(b|)', { b: false });

      const activate$ = guard.canActivate(snapshot);
      expect(activate$).toBeObservable(expected$);
      expect(navigate).toHaveBeenCalledWith(['/unauthorised-access']);
    });

    it('should resolve to false and redirect when fetching features fails', () => {
      snapshot.data = {
        allowedFeatures: []
      };

      const expected$ = cold('(b|)', { b: false });
      const activate$ = guard.canActivate(snapshot);
      expect(activate$).toBeObservable(expected$);
      expect(navigate).toHaveBeenCalledWith(['/unauthorised-access']);
    });
  });
});
