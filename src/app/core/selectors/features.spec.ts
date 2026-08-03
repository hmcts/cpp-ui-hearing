import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngrx/store';
import { AppState, reducers } from '../reducers';
import { getFeatures } from './features';
import { UserService, UserServiceFeature, UsersGroupsActions } from '@cpp/users-groups';

let store: Store<AppState>, result: string[];

describe('Features selectors', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStore(reducers, { runtimeChecks: {} })],
      teardown: { destroyAfterEach: false }
    });
    store = TestBed.inject(Store);
  });

  it('should return null if features not in store', done => {
    store.select(getFeatures).subscribe(value => {
      result = value;
      expect(result).toEqual(null);
      done();
    });
  });

  it('should return features in store if features exists', done => {
    const featuresValues: UserServiceFeature[] = [
      {
        key: 'feature-a',
        title: 'feature-a',
        type: 'LINK'
      }
    ];
    const userServiceValues = [
      { name: '1', containsSearch: true, features: featuresValues }
    ] as UserService[];

    store.dispatch(UsersGroupsActions.setUserServices({ userServices: userServiceValues }));

    store.select(getFeatures).subscribe(value => {
      result = value;
      expect(result).toEqual(['feature-a']);
      done();
    });
  });
});
