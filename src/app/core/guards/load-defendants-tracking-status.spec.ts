import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { cold } from 'jasmine-marbles';
import { of, throwError } from 'rxjs';
import { mockDefendantsTrackingStatus } from '../../mock-data/test-mock-data';
import {
  LoadDefendantsTrackingStatusSuccessAction,
  LoadHearingDetailSuccessAction
} from '../actions/hearing';
import { HearingDetail, HearingLockState } from '../model';
import { AppState, reducers } from '../reducers/index';
import { hearing as mockHearing } from '../selectors/mock/mock-data';
import hearingApplication from '../selectors/mock/hearing-application.json';
import { HearingService } from '../services/Hearing/hearing.service';
import { LoadDefendantsTrackingStatusGuard } from './load-defendants-tracking-status';

describe('LoadDefendantsTrackingStatusGuard', () => {
  let guard: LoadDefendantsTrackingStatusGuard;
  let store: Store<AppState>;
  let snapshot: ActivatedRouteSnapshot;
  let hearingService: HearingService;
  const navigate = jest.fn();

  let getDefendantsTrackingStatus: jest.Mock;

  beforeEach(() => {
    getDefendantsTrackingStatus = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        LoadDefendantsTrackingStatusGuard,
        {
          provide: HearingService,
          useValue: {
            getDefendantsTrackingStatus
          }
        },
        { provide: Router, useValue: { navigate } }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(LoadDefendantsTrackingStatusGuard);
    store = TestBed.inject(Store);
    hearingService = TestBed.inject(HearingService);

    jest.spyOn(store, 'dispatch');
    jest
      .spyOn(hearingService, 'getDefendantsTrackingStatus')
      .mockReturnValue(of(mockDefendantsTrackingStatus));
  });

  beforeEach(() => {
    store.dispatch(
      new LoadHearingDetailSuccessAction({
        hearing: mockHearing as unknown as HearingDetail,
        hearingState: HearingLockState.INITIALISED
      })
    );
    snapshot = { ...new ActivatedRouteSnapshot(), params: { hearingId: 'hearing-id' } } as any;
  });

  it('should dispatch LoadDefendantsTrackingStatusAction in of defendants tracking status service call call', () => {
    jest.clearAllMocks();
    const expected$ = cold('a', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(
      new LoadDefendantsTrackingStatusSuccessAction(mockDefendantsTrackingStatus)
    );
  });

  it('should resolve to true if we are dealing with an application', () => {
    store.dispatch(
      new LoadHearingDetailSuccessAction({
        hearing: hearingApplication as unknown as HearingDetail,
        hearingState: HearingLockState.INITIALISED
      })
    );
    jest.clearAllMocks();
    const expected$ = cold('a', { a: true });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
  });

  it('should resolve to false when hearing service catch an error', () => {
    hearingService.getDefendantsTrackingStatus = jest.fn().mockReturnValue(throwError('any'));

    const expected$ = cold('(a|)', { a: false });
    const activate$ = guard.canActivate(snapshot);

    expect(activate$).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/technical-error']);
  });
});
