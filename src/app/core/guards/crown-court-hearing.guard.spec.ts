import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { CrownCourtHearingGuard } from './crown-court-hearing.guard';
import { isTierAndListTypeApplicable } from '../selectors';

describe('CrownCourtHearingGuard', () => {
  let guard: CrownCourtHearingGuard;
  let store: MockStore;

  const navigate = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CrownCourtHearingGuard,
        provideMockStore({
          selectors: [{ selector: isTierAndListTypeApplicable, value: true }]
        }),
        { provide: Router, useValue: { navigate } }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(CrownCourtHearingGuard);
    store = TestBed.inject(MockStore);
  });

  afterEach(() => navigate.mockClear());

  it('activates for a Crown Court hearing', done => {
    guard.canActivate().subscribe(canActivate => {
      expect(canActivate).toBe(true);
      expect(navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('treats the route as missing for a hearing outside the Crown Court', done => {
    store.overrideSelector(isTierAndListTypeApplicable, false);
    store.refreshState();

    guard.canActivate().subscribe(canActivate => {
      expect(canActivate).toBe(false);
      expect(navigate).toHaveBeenCalledWith(['/page-not-found']);
      done();
    });
  });
});
