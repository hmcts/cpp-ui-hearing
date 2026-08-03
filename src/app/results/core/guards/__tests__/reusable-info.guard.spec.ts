import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { cold } from 'jasmine-marbles';
import { reducers, SetSelectedHearingDateAction } from '../../../../core';
import { ReusableInfoRemoteCacheService } from '../../services/reusable-info-remote-cache.service';
import { DraftResultActions, ResultsState } from '../../store';
import { ReusableInfoGuard } from '../reusable-info.guard';
import { PromptEntry } from 'src/app/results/results.interfaces';

describe('ReusableInfoGuard', () => {
  let guard: ReusableInfoGuard;
  let fetchReusableInfo: jest.Mock;
  let fetchResuableInfoDefinitions: jest.Mock;
  let navigate: jest.Mock;
  let store: Store<ResultsState>;
  const mockReuseableResults: PromptEntry[] = [
    {
      type: 'NAMEADDRESS',
      cacheDataPath:
        'respondents[0].prosecutingAuthority.name; applicant.prosecutingAuthority.name',
      cacheable: 2,
      applicationId: '256624f5-b70e-4211-8907-085a1a3e08d6',
      promptRef: 'prosecutortobenotified',
      value: {
        prosecutortobenotifiedOrganisationName: 'Derbyshire Police',
        prosecutortobenotifiedAddress1: 'Criminal Justice Department',
        prosecutortobenotifiedAddress2: 'Derbyshire Constabulary',
        prosecutortobenotifiedAddress3: 'Butterley Hall',
        prosecutortobenotifiedAddress4: 'Ripley',
        prosecutortobenotifiedAddress5: 'Derby',
        prosecutortobenotifiedPostCode: 'DE5 3RS',
        prosecutortobenotifiedEmailAddress1: 'criminaldataderbyshire@derbyshire.police.uk'
      }
    }
  ];

  beforeEach(() => {
    fetchReusableInfo = jest.fn();
    fetchResuableInfoDefinitions = jest.fn();
    navigate = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, {
          runtimeChecks: {}
        }),
        provideRouter([]),
        ReusableInfoGuard,
        {
          provide: ReusableInfoRemoteCacheService,
          useValue: {
            fetchReusableInfo,
            fetchResuableInfoDefinitions
          }
        },
        {
          provide: Router,
          useValue: {
            navigate
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    guard = TestBed.inject(ReusableInfoGuard);
    store = TestBed.inject(Store);
    store.dispatch(new SetSelectedHearingDateAction('2020-01-01'));
  });

  const createSnapshot = (hearingId: string) => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.params = { hearingId };
    Object.defineProperty(snapshot, 'parent', {
      value: null,
      writable: true
    });
    return snapshot;
  };

  it('should resolve to true after fetching the reusable info for the current hearing', () => {
    const snapshot = createSnapshot('hearingId');
    const response$ = cold('--(r|)');
    const expected$ = cold('--(e|)', { e: true });

    fetchReusableInfo.mockReturnValue(response$);
    fetchResuableInfoDefinitions.mockReturnValue(response$);

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(fetchReusableInfo).toHaveBeenCalledWith('hearingId');
    expect(fetchResuableInfoDefinitions).toHaveBeenCalledWith('2020-01-01');
    store.dispatch(
      DraftResultActions.setReusableInfoSuccess({ reusableResults: mockReuseableResults })
    );
  });

  it('should reject the activation when there is an error fetching the reusable info result', () => {
    const error = new HttpErrorResponse({ status: 500 });
    const snapshot = createSnapshot('hearingId');
    const response$ = cold('---(r|)');
    const error$ = cold('   --#    ', undefined, error);
    const expected$ = cold('--(e|) ', { e: false });

    fetchReusableInfo.mockReturnValue(response$);
    fetchResuableInfoDefinitions.mockReturnValue(error$);

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/technical-error']);
  });
});
