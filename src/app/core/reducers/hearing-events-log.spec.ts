import * as HearingActions from '../actions/hearing-events-log';
import { hearingEventsLogReducer } from './hearing-events-log';
import { mockHearingEventsState } from '../../mock-data/test-mock-data';
import { EventDefinition } from '../model/event-definition';

describe('hearingEventsReducer', () => {
  let state;
  const eventInfo = {
    hasActiveHearing: false,
    hearingId: 'someId',
    events: [
      {
        hearingEventId: '12345',
        latestHearingEventId: '12345',
        hearingEventDefinitionId: '12345',
        alterable: true,
        recordedLabel: 'test',
        eventTime: '2017-08-01',
        lastModifiedTime: '2017-08-01'
      }
    ]
  };

  it('should load hearing events', () => {
    state = mockHearingEventsState;
    const actual = hearingEventsLogReducer(
      state,
      new HearingActions.LoadHearingEventsSuccessAction(eventInfo)
    );
    expect(actual.loggedEvents).toEqual(eventInfo.events);
  });

  it('should load start hearing event', () => {
    state = mockHearingEventsState;
    const actual = hearingEventsLogReducer(
      state,
      new HearingActions.LoadCanStartEventLogSuccessAction(eventInfo)
    );
    expect(actual.canStartEventLogState).toEqual(eventInfo);
  });

  it('should reset start event confirmation', () => {
    state = mockHearingEventsState;
    const actual = hearingEventsLogReducer(
      state,
      new HearingActions.ResetStartEventLogConfirmation()
    );
    expect(actual.canStartEventLogState).toEqual(undefined);
  });

  it('should load hearing event definitions', () => {
    state = mockHearingEventsState;

    const eventsData = [
      { actionLabel: 'event1' } as EventDefinition,
      { actionLabel: 'event2' } as EventDefinition
    ];
    const actual = hearingEventsLogReducer(
      state,
      new HearingActions.LoadHearingEventDefinitionsSuccessAction(eventsData)
    );
    expect(actual.eventDefinitions).toEqual(eventsData);
  });

  it('should update the store and add a new event', () => {
    state = mockHearingEventsState;
    const updatedEventState = {
      loggedEvent: {},
      eventsLogState: 'test eventsLogState'
    };
    const actual = hearingEventsLogReducer(
      state,
      new HearingActions.LogEventSuccessAction(updatedEventState)
    );
    expect(actual.eventsLogState).toEqual(updatedEventState.eventsLogState);
  });

  it('should update event', () => {
    state = {
      ...mockHearingEventsState,
      loggedEvents: [
        {
          hearingEventId: '12345',
          latestHearingEventId: '12345',
          hearingEventDefinitionId: '234',
          alterable: false,
          recordedLabel: 'test',
          eventTime: '2017-08-01',
          lastModifiedTime: '2017-08-01'
        }
      ]
    };

    const updatedEventState = {
      updatedEvent: {
        latestHearingEventId: '12345678',
        hearingEventDefinitionId: '234',
        alterable: false,
        recordedLabel: 'test',
        eventTime: '2017-08-01',
        lastModifiedTime: '2017-08-02',
        note: 'Update note'
      },
      hearingEventId: '12345',
      eventsLogState: 'test eventsLogState'
    };

    const expectedLoggedEvent = {
      hearingEventId: '12345678',
      hearingEventDefinitionId: '234',
      alterable: false,
      recordedLabel: 'test',
      eventTime: '2017-08-01',
      lastModifiedTime: '2017-08-02',
      note: 'Update note'
    };

    const actual = hearingEventsLogReducer(
      state,
      new HearingActions.UpdateEventSuccessAction(updatedEventState)
    );
    expect(actual.eventsLogState).toEqual(updatedEventState.eventsLogState);
    expect(actual.loggedEvents).toContainEqual(expectedLoggedEvent);
  });

  it('should set events log state', () => {
    state = mockHearingEventsState;
    const updatedEventState = {
      updatedEvent: {},
      eventsLogState: 'updated event Value'
    };
    const actual = hearingEventsLogReducer(
      state,
      new HearingActions.SetEventsLogStateAction(updatedEventState.eventsLogState)
    );
    expect(actual.eventsLogState).toEqual(updatedEventState.eventsLogState);
  });
});
