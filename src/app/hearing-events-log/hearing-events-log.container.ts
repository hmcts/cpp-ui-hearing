import { Component, Input, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, timer, Subject } from 'rxjs';
import {
  AppState,
  getCurrentHearingPersonDetails,
  getCurrentHearingDefenseCounsels,
  getCurrentHearingEventDefinitions,
  getCurrentHearingLoggedEvents,
  getCurrentEventsLogState,
  HearingPersonDetails,
  isHearingEventLogPaused,
  isHearingEventLogEnded,
  getCanStartEventLogState,
  ResetStartEventLogConfirmation,
  getSelectedHearingDate,
  EventDefinition,
  EventLog,
  getCPPDate,
  getHearingTypes,
  EventLogView,
  currentHearingIsBoxHearing,
  getHearingEventLogCount,
  EventLogCountInfo,
  getCurrentHearingWitnesses,
  addWitness
} from '../core';

import {
  LoadHearingEventDefinitionsAction,
  LogEventAction,
  UpdateEventAction,
  SetEventsLogStateAction,
  LoadCanStartEventLogAction,
  downloadTodayHearingEventLogAction,
  downloadFullHearingEventLogAction
} from '../core/actions/hearing-events-log';
import { EventLogStates } from './core/models';
import { HearingEventsLogService } from './core/services/hearing-events-log.service';
import { takeUntil } from 'rxjs/operators';
import { cloneDeep } from 'lodash-es';
import { HearingType } from '@cpp/reference-data';
import { TotalJuryDeliberationComponent } from './total-jury-deliberation/total-jury-deliberation.component';
import { AsyncPipe } from '@angular/common';
import { ConfirmStartEventComponent } from './confirm-start-event/confirm-start-event.component';
import { SuggestedEventsComponent } from './suggested-events/suggested-events.component';
import { LoggedEventsComponent } from './logged-events/logged-events.component';
import { ChangeEventDetailsComponent } from './change-event-details/change-event-details.component';
import { AddDefenceWitnessComponent } from './add-defence-witness/add-defence-witness.component';
import { ChangeHearingTypeComponent } from './change-hearing-type/change-hearing-type.component';

@Component({
  selector: 'hearing-events-log',
  templateUrl: './hearing-events-log.container.html',
  styleUrls: ['./hearing-events-log.container.scss'],
  imports: [
    TotalJuryDeliberationComponent,
    ConfirmStartEventComponent,
    SuggestedEventsComponent,
    LoggedEventsComponent,
    ChangeEventDetailsComponent,
    AddDefenceWitnessComponent,
    ChangeHearingTypeComponent,
    AsyncPipe
  ]
})
export class HearingEventsLogContainer implements OnDestroy {
  @Input() hearingId: string;
  @Input() jurisdictionType: string;

  hearingPersonDetails$: Observable<HearingPersonDetails[]>;
  hearingDefenceCounsels$: Observable<HearingPersonDetails[]>;
  isHearingEventLogPaused$: Observable<boolean>;
  isHearingEventLogEnded$: Observable<boolean>;
  hearingTypes$: Observable<HearingType[]>;
  selectedHearingDate: string;

  eventDefinitions: EventDefinition[] = [];
  witnessNames$: Observable<string[]>;
  currentEvent: EventLog;
  loggedEvents: EventLog[] = [];
  eventsLogState$: Observable<string>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  time: Date;
  showStartEventLogConfirmation = false;
  startEventToConfirm: EventLog;
  isBoxwork$: Observable<boolean>;
  hearingEventLogCount$: Observable<EventLogCountInfo>;

  private readonly HEARING_STARTED = 'hearing started';
  private readonly HEARING_RESUMED = 'hearing resumed';
  private readonly CHANGE_HEARING_TYPE = 'hearing type changed to';

  constructor(
    readonly store: Store<AppState>,
    readonly activatedRoute: ActivatedRoute,
    readonly hearingEventsLogService: HearingEventsLogService,
    readonly zone: NgZone
  ) {
    this.zone.runOutsideAngular(() => {
      timer(0, 1000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          const cppDateUtil = getCPPDate();
          this.zone.run(() => {
            this.time = cppDateUtil.localDate(cppDateUtil.getCurrentDate());
          });
        });
    });

    this.hearingId = this.activatedRoute.snapshot.paramMap.get('hearingId');
    this.hearingPersonDetails$ = this.store.select(getCurrentHearingPersonDetails);
    this.hearingDefenceCounsels$ = this.store.select(getCurrentHearingDefenseCounsels);
    this.isHearingEventLogPaused$ = this.store.select(isHearingEventLogPaused);
    this.isHearingEventLogEnded$ = this.store.select(isHearingEventLogEnded);
    this.witnessNames$ = this.store.select(getCurrentHearingWitnesses);
    this.store
      .select(getSelectedHearingDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hearingDate => {
        this.selectedHearingDate = hearingDate;
      });

    this.store.dispatch(new LoadHearingEventDefinitionsAction());
    this.store
      .select(getCurrentHearingEventDefinitions)
      .pipe(takeUntil(this.destroy$))
      .subscribe(eventDefinitions => {
        this.eventDefinitions = eventDefinitions;
      });

    this.store
      .select(getCurrentHearingLoggedEvents)
      .pipe(takeUntil(this.destroy$))
      .subscribe(events => {
        this.loggedEvents = this.hearingEventsLogService.sortLoggedEvents(events);
      });

    this.eventsLogState$ = this.store.select(getCurrentEventsLogState);

    this.store
      .select(getCanStartEventLogState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(canStartEventInfo => {
        if (!canStartEventInfo) {
          return;
        }

        if (canStartEventInfo.hasActiveHearing) {
          this.showStartEventLogConfirmation = true;
          return;
        }

        this.store.dispatch(
          new LogEventAction({ hearingId: this.hearingId, event: this.startEventToConfirm })
        );
      });

    this.hearingTypes$ = this.store.select(getHearingTypes);
    this.hearingEventLogCount$ = this.store.select(getHearingEventLogCount);

    this.isBoxwork$ = this.store.select(currentHearingIsBoxHearing);

    this.displayEvents();
  }

  onEventSelected(event: EventLog) {
    this.showStartEventLogConfirmation = false;
    const eventLabel = event.recordedLabel.toLowerCase();

    if (eventLabel === this.CHANGE_HEARING_TYPE) {
      this.displayChangeHearingType();
      return;
    }

    this.displayChangeEvent({ ...event, isCreate: true });
  }

  onEventChanged(updateInfo: { hearingEventId: string; event: EventLog }) {
    if (!updateInfo.event) {
      this.currentEvent = null;
    } else {
      this.store.dispatch(
        new UpdateEventAction({
          hearingId: this.hearingId,
          hearingEventId: updateInfo.hearingEventId,
          event: updateInfo.event
        })
      );
    }
  }

  onEventCreated(updateInfo: { hearingEventId: string; event: EventLog }) {
    this.showStartEventLogConfirmation = false;
    const eventLabel = updateInfo.event.recordedLabel.toLowerCase();

    if (eventLabel === this.HEARING_STARTED || eventLabel === this.HEARING_RESUMED) {
      this.startEventToConfirm = {
        ...updateInfo.event,
        hearingEventId: updateInfo.hearingEventId
      };
      delete this.startEventToConfirm.latestHearingEventId;
      this.store.dispatch(
        new LoadCanStartEventLogAction({ hearingId: this.hearingId, event: updateInfo.event })
      );
      return;
    }

    if (!updateInfo.event) {
      this.currentEvent = null;
    } else {
      const newEvent = {
        hearingId: this.hearingId,
        event: { ...updateInfo.event, hearingEventId: updateInfo.hearingEventId }
      };
      delete newEvent.event.latestHearingEventId;

      this.store.dispatch(new LogEventAction(newEvent));
    }
  }

  onSuggestEvent(actionLabel: string) {
    const suggestedEventLog = this.eventDefinitions.find(ed => ed.actionLabel === actionLabel);
    this.onEventSelected(
      this.hearingEventsLogService.buildEventLog(
        suggestedEventLog,
        this.time,
        this.selectedHearingDate
      )
    );
  }

  onWitnessNameSelected(witnessName: string) {
    this.store.dispatch(addWitness({ hearingId: this.hearingId, witnessName }));
    this.displayEvents();
  }

  onHearingTypeChange({ hearingType, eventNote }: { hearingType: HearingType; eventNote: string }) {
    const changeHearingTypeED = cloneDeep(
      this.eventDefinitions.find(
        eventDef => eventDef.recordedLabel.toLowerCase() === this.CHANGE_HEARING_TYPE
      )
    );

    const eventLog: EventLog = this.hearingEventsLogService.buildEventLog(
      changeHearingTypeED,
      this.time,
      this.selectedHearingDate,
      eventNote
    );

    eventLog.recordedLabel = eventLog.recordedLabel + ' ' + hearingType.hearingDescription;

    this.onEventCreated({ hearingEventId: eventLog.hearingEventId, event: eventLog });
    this.displayEvents();
  }

  displayEvents() {
    this.store.dispatch(new SetEventsLogStateAction(EventLogStates.DISPLAY_EVENTS));
  }

  displayChangeEvent(event: EventLogView) {
    this.currentEvent = event;
    this.store.dispatch(new SetEventsLogStateAction(EventLogStates.CHANGE_EVENT));
  }

  displayAddDefenceWitness() {
    this.store.dispatch(new SetEventsLogStateAction(EventLogStates.ADD_DEFENCE_WITNESS));
  }

  displayChangeHearingType() {
    this.store.dispatch(new SetEventsLogStateAction(EventLogStates.CHANGE_HEARING_TYPE));
  }

  startEventConfirmationCancelled(): void {
    this.showStartEventLogConfirmation = false;
    this.store.dispatch(new ResetStartEventLogConfirmation());
  }

  startEventConfirmed(): void {
    this.startEventToConfirm.override = true;
    this.showStartEventLogConfirmation = false;
    this.store.dispatch(
      new LogEventAction({ hearingId: this.hearingId, event: this.startEventToConfirm })
    );
  }

  downloadTodayEventLog() {
    this.store.dispatch(downloadTodayHearingEventLogAction({ hearingId: this.hearingId }));
  }

  downloadFullEventLog() {
    this.store.dispatch(downloadFullHearingEventLogAction({ hearingId: this.hearingId }));
  }

  ngOnDestroy() {
    this.store.dispatch(new ResetStartEventLogConfirmation());
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
