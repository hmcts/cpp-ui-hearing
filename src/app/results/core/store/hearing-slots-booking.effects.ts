import { Injectable } from '@angular/core';
import { getSchedulingState, SchedulingService } from '@cpp/scheduling';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { from, of } from 'rxjs';
import { catchError, mergeMap, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { ApiError } from '../../../core';
import { searchHearingSlotsToActions } from '../../hearing-details/allocation/helpers/search-hearing-slots-to-actions';
import { ProvisionalBookingService } from '../../hearing-details/allocation/services/provisionalBooking.service';
import { ExtendedResolvedDraftResultLine } from '../../results.interfaces';
import {
  createDraftResultPromptsFromValueMap,
  createNameAddressResultPromptForCourtCentre,
  isNameAddressPromptChoice
} from '../helpers';
import { DraftResultActions } from './draft-result.actions';
import { HearingSlotsBookingActions } from './hearing-slots-booking.actions';
import { getDraftResultLineById, ResultsState } from './index';
import { CommandError } from '@cpp/core';

@Injectable()
export class HearingSlotsBookingEffects {
  constructor(
    private actions$: Actions,
    private provisionalBookingService: ProvisionalBookingService,
    private schedulingService: SchedulingService,
    private store: Store<ResultsState>
  ) {}

  bookHearingSlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingSlotsBookingActions.bookHearingSlots),
      switchMap(
        ({
          hearingId,
          resultLineId,
          courtScheduleBookings,
          promptRefToValueMap,
          courtCentre,
          redirectTo
        }) =>
          this.provisionalBookingService
            .bookProvisionalHearingSlots({ hearingId, courtScheduleBookings })
            .pipe(
              switchMap(({ bookingId }) =>
                this.store.pipe(
                  select(getDraftResultLineById(resultLineId)),
                  take(1),
                  mergeMap(resultLine => {
                    const { promptChoices } = resultLine as ExtendedResolvedDraftResultLine;

                    return from([
                      HearingSlotsBookingActions.bookHearingSlotsSuccess(),
                      DraftResultActions.updateResultPromptsForDraftResultLine({
                        resultLineId,
                        redirectTo,
                        resultPrompts: [
                          ...createDraftResultPromptsFromValueMap(promptChoices, {
                            ...promptRefToValueMap,
                            bookingReference: bookingId
                          }),
                          createNameAddressResultPromptForCourtCentre(
                            promptChoices.find(isNameAddressPromptChoice),
                            courtCentre
                          )
                        ]
                      })
                    ]);
                  })
                )
              ),
              catchError((error: CommandError<{ error: { status: number } }> | Error) => {
                if ('originalEvent' in error) {
                  return error.data?.error?.status === 422
                    ? of(HearingSlotsBookingActions.setHearingSlotsBookingError())
                    : of(new ApiError(error.data?.error));
                }
                return of(new ApiError(error));
              })
            )
      )
    )
  );

  refreshHearingSlotsOnBookingRefused$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingSlotsBookingActions.setHearingSlotsBookingError),
      withLatestFrom(this.store.pipe(select(getSchedulingState))),
      switchMap(([, { params }]) =>
        searchHearingSlotsToActions(this.schedulingService, params).pipe(
          switchMap(actions => from(actions)),
          catchError(error => of(new ApiError(error)))
        )
      )
    )
  );
}
