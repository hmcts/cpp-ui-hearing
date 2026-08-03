import { AppState } from '../reducers';
import { createSelector } from '@ngrx/store';
import { EventLog } from '..';

const isLastEventPause = (loggedEvents: EventLog[]) => {
  if (!loggedEvents || loggedEvents.length === 0) {
    return null;
  }

  const events = [...loggedEvents].sort((a, b) => (b.eventTime > a.eventTime ? 1 : -1));

  return events[0].recordedLabel === 'Hearing paused';
};

const isLastEventEnd = (loggedEvents: EventLog[]) => {
  if (!loggedEvents || loggedEvents.length === 0) {
    return null;
  }

  let hasEndedHearing = false;

  loggedEvents.forEach(l => {
    if (l.recordedLabel === 'Hearing ended') {
      hasEndedHearing = true;
    }
  });

  return hasEndedHearing;
};

export const getCurrentHearingLoggedEvents = (state: AppState) => {
  if (!state.hearingEventsLog.loggedEvents) {
    return null;
  }
  return state.hearingEventsLog.loggedEvents;
};

export const getCurrentEventsLogState = (state: AppState) => {
  if (!state.hearingEventsLog.eventsLogState) {
    return null;
  }
  return state.hearingEventsLog.eventsLogState;
};

export const getCurrentHearingEventDefinitions = (state: AppState) => {
  if (!state.hearingEventsLog.eventDefinitions) {
    return null;
  }
  return state.hearingEventsLog.eventDefinitions;
};

export const isHearingEventLogPaused = createSelector(
  getCurrentHearingLoggedEvents,
  (loggedEvents: EventLog[]) => isLastEventPause(loggedEvents)
);

export const isHearingEventLogEnded = createSelector(
  getCurrentHearingLoggedEvents,
  (loggedEvents: EventLog[]) => isLastEventEnd(loggedEvents)
);
export const getCanStartEventLogState = (state: AppState) => {
  if (!state.hearingEventsLog.canStartEventLogState) {
    return null;
  }
  return state.hearingEventsLog.canStartEventLogState;
};
export const getHearingEventLogCount = (state: AppState) => {
  if (!state.hearingEventsLog.hearingEventLogCount) {
    return null;
  }
  return state.hearingEventsLog.hearingEventLogCount;
};
