import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, provideRouter } from '@angular/router';
import { Store, provideStore } from '@ngrx/store';
import { cold } from 'jasmine-marbles';
import { reducers, AppState } from '../../../../core';
import { HearingSlot, ListingNote, loadListingNotes, SchedulingService } from '@cpp/scheduling';
import { AllocationGuard, AllocationSnapshot } from './allocation.guard';
import {
  loadHearingSlotsSuccess,
  resetHearingSlots,
  SearchHearingSlotsParams,
} from '@cpp/scheduling';

describe('AllocationGuard', () => {
  let guard: AllocationGuard;
  let store: Store<AppState>;
  let navigate: jest.Mock;
  let searchHearingSlots: jest.Mock;

  beforeEach(() => {
    navigate = jest.fn();
    searchHearingSlots = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        AllocationGuard,
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        {
          provide: SchedulingService,
          useValue: {
            searchHearingSlots,
          },
        },
        {
          provide: Router,
          useValue: {
            navigate,
          },
        },
      ],
      teardown: { destroyAfterEach: false },
    });
    guard = TestBed.inject<AllocationGuard>(AllocationGuard);
    store = TestBed.inject<Store<AppState>>(Store);

    jest.spyOn(store, 'dispatch');
  });

  const defaultSearchParams: SearchHearingSlotsParams = {
    oucodeL2Code: 'oucodeL2Code',
    oucodeL3Code: 'oucodeL3Code',
    courtRoomId: 'courtRoomId',
    sessionStartDate: '2019-01-01',
    sessionEndDate: '2019-31-01',
    courtSession: 'AM',
    panel: 'ADULT',
    businessType: 'businessTypeCode',
    availableDurationMins: 30,
    pageNumber: 2,
  };

  const createActivatedRouteSnapshot = (
    params: { jurisdictionType: string },
    searchParams?: Partial<SearchHearingSlotsParams>
  ) => {
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.params = params;
    snapshot.queryParams = searchParams ? { mf: JSON.stringify(searchParams) } : {};
    return snapshot as AllocationSnapshot;
  };

  it('should activate when there is no search parameter', () => {
    const snapshot = createActivatedRouteSnapshot({ jurisdictionType: 'MAGISTRATE' });
    const expected$ = cold('(o|)', { o: true });

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(store.dispatch).toHaveBeenCalledWith(resetHearingSlots());
  });

  it('should activate after searching the hearing slots remotely', () => {
    const snapshot = createActivatedRouteSnapshot(
      { jurisdictionType: 'MAGISTRATE' },
      defaultSearchParams
    );
    const searchResult = {
      totalResults: 1,
      hearingSlots: [{ courtScheduleId: '*' } as HearingSlot],
      notes: [{ id: 'note-id' } as ListingNote],
    };
    const search$ = cold('  --(r|)', { r: searchResult });
    const expected$ = cold('--(o|)', { o: true });

    searchHearingSlots.mockReturnValue(search$);

    const params: SearchHearingSlotsParams = {
      ...defaultSearchParams,
      pageSize: 10,
    };

    const { hearingSlots, totalResults, notes } = searchResult;
    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(searchHearingSlots).toHaveBeenCalledWith(params);
    expect(store.dispatch).toHaveBeenCalledWith(
      loadHearingSlotsSuccess({ hearingSlots, totalResults, params })
    );
    expect(store.dispatch).toHaveBeenCalledWith(loadListingNotes({ notes }));
  });

  it('should reject the activation when the `jurisdictionType` is not magistrates', () => {
    const snapshot = createActivatedRouteSnapshot(
      { jurisdictionType: 'CROWN' },
      defaultSearchParams
    );
    const expected$ = cold('(o|)', { o: false });

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/technical-error']);
    expect(store.dispatch).toHaveBeenCalledWith(resetHearingSlots());
  });

  it('should reject the activation when there is a search error', () => {
    const search$ = cold('  --#   ', null, new Error());
    const expected$ = cold('--(o|)', { o: false });
    const snapshot = createActivatedRouteSnapshot(
      { jurisdictionType: 'MAGISTRATE' },
      defaultSearchParams
    );
    searchHearingSlots.mockReturnValue(search$);

    expect(guard.canActivate(snapshot)).toBeObservable(expected$);
    expect(navigate).toHaveBeenCalledWith(['/technical-error']);
    expect(store.dispatch).toHaveBeenCalledWith(resetHearingSlots());
  });
});
