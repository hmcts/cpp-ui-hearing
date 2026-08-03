import { Action, createAction, props } from '@ngrx/store';
import { EventDefinition } from '../model/event-definition';
import { EventInfo, EventLog, EventLogCountInfo } from '../model/event-log';
export const LOAD_HEARING_EVENT_DEFINITIONS = 'LOAD_HEARING_EVENT_DEFINITIONS';
export const LOAD_HEARING_EVENT_DEFINITIONS_SUCCESS = 'LOAD_HEARING_EVENT_DEFINITIONS_SUCCESS';

export const LOAD_HEARING_EVENTS = 'LOAD_HEARING_EVENTS';
export const LOAD_HEARING_EVENTS_SUCCESS = 'LOAD_HEARING_EVENTS_SUCCESS';

export const LOG_EVENT = 'LOG_EVENT';
export const LOG_EVENT_SUCCESS = 'LOG_EVENT_SUCCESS';

export const UPDATE_EVENT = 'UPDATE_EVENT';
export const UPDATE_EVENT_SUCCESS = 'UPDATE_EVENT_SUCCESS';

export const SET_EVENT_LOG_STATE = 'SET_EVENT_LOG_STATE';
export const LOAD_CAN_START_EVENT_LOG = 'LOAD_CAN_START_EVENT_LOG';
export const LOAD_CAN_START_EVENT_LOG_SUCCESS = 'LOAD_CAN_START_EVENT_LOG_SUCCESS';
export const RESET_START_EVENT_LOG_CONFIRMATION = 'RESET_START_EVENT_LOG_CONFIRMATION';

export class LoadHearingEventDefinitionsAction implements Action {
  readonly type = LOAD_HEARING_EVENT_DEFINITIONS;

  constructor() {}
}

export class LoadHearingEventDefinitionsSuccessAction implements Action {
  readonly type = LOAD_HEARING_EVENT_DEFINITIONS_SUCCESS;

  constructor(public readonly payload: EventDefinition[]) {}
}

export class LoadHearingEventsAction implements Action {
  readonly type = LOAD_HEARING_EVENTS;

  constructor(
    public readonly payload: {
      hearingId: string;
    }
  ) {}
}

export class LoadHearingEventsSuccessAction implements Action {
  readonly type = LOAD_HEARING_EVENTS_SUCCESS;

  constructor(public readonly payload: EventInfo) {}
}

export class LoadCanStartEventLogAction implements Action {
  readonly type = LOAD_CAN_START_EVENT_LOG;

  constructor(
    public readonly payload: {
      event: EventLog;
      hearingId: string;
    }
  ) {}
}

export class LoadCanStartEventLogSuccessAction implements Action {
  readonly type = LOAD_CAN_START_EVENT_LOG_SUCCESS;
  constructor(public readonly payload: EventInfo) {}
}

export class ResetStartEventLogConfirmation implements Action {
  readonly type = RESET_START_EVENT_LOG_CONFIRMATION;
}

export class LogEventAction implements Action {
  readonly type = LOG_EVENT;

  constructor(
    public readonly payload: {
      event: EventLog;
      hearingId: string;
    }
  ) {}
}
export class LogEventSuccessAction implements Action {
  readonly type = LOG_EVENT_SUCCESS;

  constructor(
    public readonly payload: {
      eventsLogState: string;
      loggedEvent: EventLog;
    }
  ) {}
}

export class UpdateEventAction implements Action {
  readonly type = UPDATE_EVENT;

  constructor(
    public readonly payload: {
      event: Omit<EventLog, 'hearingEventId'>;
      hearingId: string;
      hearingEventId: string;
    }
  ) {}
}
export class UpdateEventSuccessAction implements Action {
  readonly type = UPDATE_EVENT_SUCCESS;

  constructor(
    public readonly payload: {
      eventsLogState: string;
      updatedEvent: Omit<EventLog, 'hearingEventId'>;
      hearingEventId: string;
    }
  ) {}
}

export class SetEventsLogStateAction implements Action {
  readonly type = SET_EVENT_LOG_STATE;

  constructor(public readonly payload: string) {}
}

export const addWitness = createAction(
  'HEARING_ADD_WITNESS',
  props<{ witnessName: string; hearingId: string }>()
);

export const downloadTodayHearingEventLogAction = createAction(
  'DOWNLOAD_TODAY_HEARING_EVENT_LOG',
  props<{ hearingId: string }>()
);

export const downloadFullHearingEventLogAction = createAction(
  'DOWNLOAD_FULL_HEARING_EVENT_LOG',
  props<{ hearingId: string }>()
);

export const loadHearingEventLogCountAction = createAction(
  'LOAD_HEARING_EVENT_LOG_COUNT',
  props<{ hearingId: string }>()
);

export const loadHearingEventsLogCountSuccessAction = createAction(
  'LOAD_HEARING_EVENT_LOG_COUNT_SUCCESS',
  props<{ eventLogCount: EventLogCountInfo }>()
);

export type HearingEventsLogAction =
  | LoadHearingEventDefinitionsAction
  | LoadHearingEventDefinitionsSuccessAction
  | LoadHearingEventsAction
  | LoadHearingEventsSuccessAction
  | LogEventAction
  | LogEventSuccessAction
  | UpdateEventAction
  | UpdateEventSuccessAction
  | SetEventsLogStateAction
  | LoadCanStartEventLogAction
  | LoadCanStartEventLogSuccessAction
  | ResetStartEventLogConfirmation
  | ReturnType<typeof loadHearingEventLogCountAction>
  | ReturnType<typeof loadHearingEventsLogCountSuccessAction>
  | ReturnType<typeof downloadTodayHearingEventLogAction>
  | ReturnType<typeof downloadFullHearingEventLogAction>
  | ReturnType<typeof addWitness>;
