import { cold } from 'jasmine-marbles';
import {
  HearingSlot,
  ListingNote,
  loadHearingSlotsSuccess,
  loadListingNotes,
  SchedulingService,
  SearchHearingSlotsParams
} from '@cpp/scheduling';
import { searchHearingSlotsToActions } from './search-hearing-slots-to-actions';

describe('searchHearingSlotsToActions', () => {
  const params: SearchHearingSlotsParams = {
    ouCode: 'OUCODEL32',
    sessionStartDate: '2019-01-01',
    jurisdiction: 'MAGISTRATES',
    pageNumber: 2,
    pageSize: 10
  };

  it('should search the hearing slots and return the actions to store the results', () => {
    const searchResult = {
      totalResults: 1,
      hearingSlots: [{ courtScheduleId: '*' } as HearingSlot],
      notes: [{ id: 'note-id' } as ListingNote]
    };
    const schedulingService = {
      searchHearingSlots: jest.fn(() => cold('--(r|)', { r: searchResult }))
    } as unknown as SchedulingService;

    const { hearingSlots, totalResults, notes } = searchResult;
    const expected$ = cold('--(a|)', {
      a: [
        loadHearingSlotsSuccess({ params, hearingSlots, totalResults }),
        loadListingNotes({ notes })
      ]
    });

    expect(searchHearingSlotsToActions(schedulingService, params)).toBeObservable(expected$);
    expect(schedulingService.searchHearingSlots).toHaveBeenCalledWith(params);
  });

  it('should pass on a search error', () => {
    const error = new Error('search failed');
    const schedulingService = {
      searchHearingSlots: jest.fn(() => cold('--#', undefined, error))
    } as unknown as SchedulingService;

    expect(searchHearingSlotsToActions(schedulingService, params)).toBeObservable(
      cold('--#', undefined, error)
    );
  });
});
