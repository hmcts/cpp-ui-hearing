import { Action } from '@ngrx/store';
import {
  loadHearingSlotsSuccess,
  loadListingNotes,
  SchedulingService,
  SearchHearingSlotsParams
} from '@cpp/scheduling';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export const searchHearingSlotsToActions = (
  schedulingService: SchedulingService,
  params: SearchHearingSlotsParams
): Observable<Action[]> =>
  schedulingService
    .searchHearingSlots(params)
    .pipe(
      map(({ hearingSlots, totalResults, notes }) => [
        loadHearingSlotsSuccess({ params, hearingSlots, totalResults }),
        loadListingNotes({ notes })
      ])
    );
