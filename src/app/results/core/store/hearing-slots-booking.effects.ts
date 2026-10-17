import { Injectable } from '@angular/core';
import { CommandError } from '@cpp/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { from, of } from 'rxjs';
import { catchError, mergeMap, switchMap, take } from 'rxjs/operators';
import { ApiError, HEARING_SLOTS_BOOKING_REFUSED_PUBLIC_EVENT } from '../../../core';
import { ProvisionalBookingService } from '../../hearing-details/allocation/services/provisionalBooking.service';
import {
  HEARING_SLOTS_BOOKING_ERROR_MESSAGES,
  HearingSlotsBookingErrorType,
  HearingSlotsBookingPublicEventError
} from '../../hearing-details/allocation/types/allocation';
import { ExtendedResolvedDraftResultLine } from '../../results.interfaces';
import {
  createDraftResultPromptsFromValueMap,
  createNameAddressResultPromptForCourtCentre,
  isNameAddressPromptChoice
} from '../helpers';
import { DraftResultActions } from './draft-result.actions';
import { HearingSlotsBookingActions } from './hearing-slots-booking.actions';
import { getDraftResultLineById, ResultsState } from './index';

@Injectable()
export class HearingSlotsBookingEffects {
  constructor(
    private actions$: Actions,
    private provisionalBookingService: ProvisionalBookingService,
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
              catchError((error: CommandError | Error) => {
                if (
                  'originalEvent' in error &&
                  error.originalEvent?._metadata?.name ===
                    HEARING_SLOTS_BOOKING_REFUSED_PUBLIC_EVENT
                ) {
                  const hearingSlotsBookingError =
                    error.originalEvent as HearingSlotsBookingPublicEventError;
                  if (
                    hearingSlotsBookingError.error?.type ===
                      HearingSlotsBookingErrorType.BUSINESS &&
                    HEARING_SLOTS_BOOKING_ERROR_MESSAGES[hearingSlotsBookingError.error.code]
                  ) {
                    return of(
                      HearingSlotsBookingActions.setHearingSlotsBookingError({
                        hearingSlotsBookingError
                      })
                    );
                  }
                }

                return of(new ApiError(error));
              })
            )
      )
    )
  );
}
