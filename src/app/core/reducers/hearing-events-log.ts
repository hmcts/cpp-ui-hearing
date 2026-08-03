import * as HearingEventsLogActions from '../actions/hearing-events-log';
import { HearingEventsLogAction } from '../actions';
import { EventDefinition, EventLog, EventInfo, EventLogCountInfo } from '..';

export interface HearingEventsLogState {
  eventDefinitions: EventDefinition[];
  loggedEvents: EventLog[];
  eventsLogState: string;
  canStartEventLogState?: EventInfo;
  hearingEventLogCount?: EventLogCountInfo;
}

const initialState: HearingEventsLogState = {
  eventDefinitions: [],
  loggedEvents: [],
  eventsLogState: ''
};

export function hearingEventsLogReducer(
  state: HearingEventsLogState = initialState,
  action: HearingEventsLogAction
): HearingEventsLogState {
  switch (action.type) {
    case HearingEventsLogActions.LOAD_HEARING_EVENT_DEFINITIONS_SUCCESS:
      return {
        ...state,
        eventDefinitions: action.payload
      };

    case HearingEventsLogActions.LOAD_HEARING_EVENTS_SUCCESS:
      return {
        ...state,
        loggedEvents: action.payload.events
      };

    case HearingEventsLogActions.LOG_EVENT_SUCCESS:
      return {
        ...state,
        eventsLogState: action.payload.eventsLogState,
        loggedEvents: [...state.loggedEvents, action.payload.loggedEvent]
      };

    case HearingEventsLogActions.UPDATE_EVENT_SUCCESS:
      const { eventsLogState, updatedEvent, hearingEventId } = action.payload;
      const { latestHearingEventId, ...restEventData } = updatedEvent;
      const loggedEvents = state.loggedEvents.filter(
        event => event.hearingEventId !== hearingEventId
      );
      // Looking at the response it seems that the hearingEventId is changed according to previous requirement
      // We imitate this as we update the event front end as per current requirement : DD-17222
      const eventLog: EventLog = { ...restEventData, hearingEventId: latestHearingEventId };
      return {
        ...state,
        eventsLogState,
        loggedEvents: [...loggedEvents, eventLog]
      };

    case HearingEventsLogActions.SET_EVENT_LOG_STATE:
      return {
        ...state,
        eventsLogState: action.payload
      };

    case HearingEventsLogActions.LOAD_CAN_START_EVENT_LOG_SUCCESS:
      return {
        ...state,
        canStartEventLogState: action.payload
      };

    case HearingEventsLogActions.RESET_START_EVENT_LOG_CONFIRMATION:
      return {
        ...state,
        canStartEventLogState: undefined
      };

    case HearingEventsLogActions.loadHearingEventsLogCountSuccessAction.type:
      return {
        ...state,
        hearingEventLogCount: action.eventLogCount
      };

    default:
      return state;
  }
}
