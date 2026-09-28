import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CrownCourtOnlyGuard } from './crown-court-only.guard';
import { isCrownCourt } from '../selectors';

describe('CrownCourtOnlyGuard', () => {
  let guard: CrownCourtOnlyGuard;
  let store: MockStore;
  const navigate = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CrownCourtOnlyGuard,
        provideMockStore({}),
        { provide: Router, useValue: { navigate } }
      ]
    });

    guard = TestBed.inject(CrownCourtOnlyGuard);
    store = TestBed.inject(MockStore);
    navigate.mockClear();
  });

  const createSnapshot = () => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.params = { hearingId: 'hearing-1' };
    return snapshot;
  };

  it('should allow activation for a Crown Court hearing', done => {
    store.overrideSelector(isCrownCourt, true);

    guard.canActivate(createSnapshot()).subscribe(canActivate => {
      expect(canActivate).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('should block activation and return to the hearing for a non Crown Court hearing', done => {
    store.overrideSelector(isCrownCourt, false);

    guard.canActivate(createSnapshot()).subscribe(canActivate => {
      expect(canActivate).toBe(false);
      expect(navigate).toHaveBeenCalledWith(['/manage', 'hearing-1']);
      done();
    });
  });
});
