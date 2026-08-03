import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import * as FileSaver from 'file-saver';
import * as HearingEventsLogActions from '../actions/hearing-events-log';
import {
  ApiError,
  LoadCanStartEventLogAction,
  LoadCanStartEventLogSuccessAction,
  LoadHearingEventDefinitionsSuccessAction,
  LoadHearingEventsAction,
  LoadHearingEventsSuccessAction,
  LogEventAction,
  LogEventSuccessAction,
  UpdateEventAction,
  UpdateEventSuccessAction,
  loadHearingEventLogCountAction,
  loadHearingEventsLogCountSuccessAction,
  downloadTodayHearingEventLogAction,
  downloadFullHearingEventLogAction
} from '../actions';
import { AppState } from '../reducers';
import { EventLogStates } from '../../hearing-events-log/core/models';
import { getCurrentHearingDays, getSelectedHearingDate } from '../selectors';
import { switchMap, map, catchError, withLatestFrom, tap, ignoreElements } from 'rxjs/operators';
import { HearingService } from '../services/Hearing/hearing.service';
import { HearingDay } from '../model/shared/hearing-day';
import { EventDefinition } from '../model/event-definition';
import { getCPPDate } from '../utils/cpp-date';

@Injectable()
export class HearingEventsLogEffects {
  getHearingEventDefinitions$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingEventsLogActions.LOAD_HEARING_EVENT_DEFINITIONS),
      switchMap(() => {
        return this.hearingService.getHearingEventDefinitions().pipe(
          map(
            (eventDefinitions: EventDefinition[]) =>
              new LoadHearingEventDefinitionsSuccessAction(eventDefinitions)
          ),
          catchError(error => of(new ApiError(error)))
        );
      })
    )
  );

  getHearingEvents$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingEventsLogActions.LOAD_HEARING_EVENTS),
      withLatestFrom(
        this.store.select(getSelectedHearingDate),
        this.store.select(getCurrentHearingDays)
      ),
      switchMap(
        ([action, selectedDate, hearingDays]: [LoadHearingEventsAction, string, HearingDay[]]) => {
          const cppDateUtil = getCPPDate();
          const currentDate =
            hearingDays && hearingDays.length === 1
              ? cppDateUtil.format(hearingDays[0].sittingDay, 'YYYY-MM-DD')
              : selectedDate;
          return this.hearingService
            .getHearingEventsLogged(action.payload.hearingId, currentDate)
            .pipe(
              map(eventInfo => new LoadHearingEventsSuccessAction(eventInfo)),
              catchError(error => of(new ApiError(error)))
            );
        }
      )
    )
  );

  getCanStartEvent$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingEventsLogActions.LOAD_CAN_START_EVENT_LOG),
      withLatestFrom(
        this.store.select(getSelectedHearingDate),
        this.store.select(getCurrentHearingDays)
      ),
      switchMap(
        ([action, selectedDate, hearingDays]: [
          LoadCanStartEventLogAction,
          string,
          HearingDay[]
        ]) => {
          const cppDateUtil = getCPPDate();
          const currentDate =
            hearingDays && hearingDays.length === 1
              ? cppDateUtil.format(hearingDays[0].sittingDay, 'YYYY-MM-DD')
              : selectedDate;
          return this.hearingService
            .getHearingEventsLogged(action.payload.hearingId, currentDate)
            .pipe(
              map(eventInfo => new LoadCanStartEventLogSuccessAction(eventInfo)),
              catchError(error => of(new ApiError(error)))
            );
        }
      )
    )
  );

  logEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingEventsLogActions.LOG_EVENT),
      switchMap((action: LogEventAction) => {
        return this.hearingService
          .logEventForHearing(
            action.payload.hearingId,
            Object.assign({}, action.payload.event, { alterable: undefined })
          )
          .pipe(
            map(
              () =>
                new LogEventSuccessAction({
                  eventsLogState: EventLogStates.DISPLAY_EVENTS,
                  loggedEvent: action.payload.event
                })
            ),
            tap(() =>
              this.store.dispatch(
                loadHearingEventLogCountAction({ hearingId: action.payload.hearingId })
              )
            ),
            catchError(error => of(new ApiError(error)))
          );
      })
    )
  );

  updateEvent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(HearingEventsLogActions.UPDATE_EVENT),
      switchMap((action: UpdateEventAction) => {
        const { hearingId, hearingEventId, event } = action.payload;
        return this.hearingService
          .correctEventForHearing(
            hearingId,
            hearingEventId,
            Object.assign({}, event, { alterable: undefined })
          )
          .pipe(
            map(
              () =>
                new UpdateEventSuccessAction({
                  eventsLogState: EventLogStates.DISPLAY_EVENTS,
                  updatedEvent: event,
                  hearingEventId
                })
            ),
            catchError(error => of(new ApiError(error)))
          );
      })
    )
  );

  getHearingEventsCountLog$: Observable<Action> = createEffect(() =>
    this.actions$.pipe(
      ofType(loadHearingEventLogCountAction),
      withLatestFrom(
        this.store.select(getSelectedHearingDate),
        this.store.select(getCurrentHearingDays)
      ),
      switchMap(
        ([action, selectedDate, hearingDays]: [
          ReturnType<typeof loadHearingEventLogCountAction>,
          string,
          HearingDay[]
        ]) => {
          const cppDateUtil = getCPPDate();
          const currentDate =
            hearingDays && hearingDays.length === 1
              ? cppDateUtil.format(hearingDays[0].sittingDay, 'YYYY-MM-DD')
              : selectedDate;
          return this.hearingService.getHearingEventsLogCount(action.hearingId, currentDate).pipe(
            map(eventLogCount => loadHearingEventsLogCountSuccessAction({ eventLogCount })),
            catchError(error => of(new ApiError(error)))
          );
        }
      )
    )
  );

  downloadTodayEventLog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(downloadTodayHearingEventLogAction),
      withLatestFrom(
        this.store.select(getSelectedHearingDate),
        this.store.select(getCurrentHearingDays)
      ),
      switchMap(
        ([action, selectedDate, hearingDays]: [
          ReturnType<typeof downloadTodayHearingEventLogAction>,
          string,
          HearingDay[]
        ]) => {
          const cppDateUtil = getCPPDate();
          const currentDate =
            hearingDays && hearingDays.length === 1
              ? cppDateUtil.format(hearingDays[0].sittingDay, 'YYYY-MM-DD')
              : selectedDate;
          const hearingDate =
            hearingDays && hearingDays.length === 1
              ? cppDateUtil.format(hearingDays[0].sittingDay, 'YYYYMMDD')
              : selectedDate;
          return this.hearingService.getDownloadTodayEventLog(action.hearingId, currentDate).pipe(
            tap((document: Blob) =>
              FileSaver.saveAs(document, 'HearingEventLog_' + hearingDate + '.pdf')
            ),
            ignoreElements(),
            catchError(error => of(new ApiError(error)))
          );
        }
      )
    )
  );

  downloadFullEventLog$ = createEffect(() =>
    this.actions$.pipe(
      ofType(downloadFullHearingEventLogAction),
      withLatestFrom(
        this.store.select(getSelectedHearingDate),
        this.store.select(getCurrentHearingDays)
      ),
      switchMap(
        ([action, selectedDate, hearingDays]: [
          ReturnType<typeof downloadFullHearingEventLogAction>,
          string,
          HearingDay[]
        ]) => {
          const cppDateUtil = getCPPDate();
          const hearingDate =
            hearingDays && hearingDays.length === 1
              ? cppDateUtil.format(hearingDays[0].sittingDay, 'YYYYMMDD')
              : selectedDate;
          return this.hearingService.getDownloadFullEventLog(action.hearingId).pipe(
            tap((document: Blob) =>
              FileSaver.saveAs(document, 'HearingEventLog_' + hearingDate + '.pdf')
            ),
            ignoreElements(),
            catchError(error => of(new ApiError(error)))
          );
        }
      )
    )
  );

  constructor(
    private actions$: Actions,
    private hearingService: HearingService,
    private store: Store<AppState>
  ) {}
}
