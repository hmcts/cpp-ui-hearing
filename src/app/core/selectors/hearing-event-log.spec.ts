import { TestBed } from '@angular/core/testing';
import { Store, provideStore } from '@ngrx/store';
import { AppState, reducers } from '../reducers';
import {
  LoadHearingEventDefinitionsSuccessAction,
  LoadHearingEventsSuccessAction,
  SetEventsLogStateAction
} from '../actions';
import {
  getCurrentHearingEventDefinitions,
  getCurrentHearingLoggedEvents,
  getCurrentEventsLogState,
  isHearingEventLogPaused,
  isHearingEventLogEnded
} from './hearing-events-log';

import * as mockData from './mock/hearing.json';
import { EventDefinition, EventLog } from '..';

let store: Store<AppState>;

const mockEventDefinitions = (mockData as any).eventDefinitions as EventDefinition[];
const mockLoggedEvents = (mockData as any).loggedEvents as EventLog[];

describe('Hearing event log selectors', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStore(reducers, { runtimeChecks: {} })],
      teardown: { destroyAfterEach: false }
    });
    store = TestBed.inject(Store);
  });

  it('should return the current hearing event definitions', () => {
    let eventDefinitions: EventDefinition[] = [];
    store.select(getCurrentHearingEventDefinitions).subscribe(value => (eventDefinitions = value));
    expect(eventDefinitions).toEqual([]);
    store.dispatch(new LoadHearingEventDefinitionsSuccessAction(mockEventDefinitions));
    expect(eventDefinitions).toEqual(mockEventDefinitions);
  });

  it('should return the current hearing logged events', () => {
    let loggedEvents: EventLog[] = [];
    store.select(getCurrentHearingLoggedEvents).subscribe(value => (loggedEvents = value));
    expect(loggedEvents).toEqual([]);

    const eventInfo = {
      hearingId: 'someId',
      events: mockLoggedEvents,
      hasActiveHearing: false
    };
    store.dispatch(new LoadHearingEventsSuccessAction(eventInfo));
    expect(eventInfo.events).toEqual(mockLoggedEvents);
  });

  it('should return the current events log state', () => {
    let eventLogState;
    store.select(getCurrentEventsLogState).subscribe(value => (eventLogState = value));
    expect(eventLogState).toEqual(null);
    store.dispatch(new SetEventsLogStateAction('DISPLAY_EVENTS'));
    expect(eventLogState).toEqual('DISPLAY_EVENTS');
  });

  it('should return false if the last hearing event log is not paused', () => {
    let isEventLogPaused;
    const eventInfo = {
      hearingId: 'someId',
      events: mockLoggedEvents,
      hasActiveHearing: false
    };
    store.select(isHearingEventLogPaused).subscribe(value => (isEventLogPaused = value));
    expect(isEventLogPaused).toEqual(null);
    store.dispatch(new LoadHearingEventsSuccessAction(eventInfo));
    expect(isEventLogPaused).toEqual(false);
  });

  it('should return true if the last hearing event log has been paused', () => {
    let isEventLogPaused;
    const eventInfo = {
      hearingId: 'someId',
      events: [
        ...mockLoggedEvents,
        {
          hearingEventId: '83706782-2d11-42af-9ed2-dabe73f7ff82',
          hearingEventDefinitionId: '160ecb51-29ee-4954-bbbf-daab18a24fbb',
          recordedLabel: 'Hearing paused',
          eventTime: '2019-08-08T19:22:10.085Z',
          lastModifiedTime: '2019-08-08T19:22:10.707Z',
          alterable: false
        }
      ],
      hasActiveHearing: false
    };
    store.select(isHearingEventLogPaused).subscribe(value => (isEventLogPaused = value));
    expect(isEventLogPaused).toEqual(null);
    store.dispatch(new LoadHearingEventsSuccessAction(eventInfo));
    expect(isEventLogPaused).toEqual(true);
  });

  it('should return false if the hearing event log has been ended', () => {
    let isEventLogEnded;

    const eventInfo = {
      hearingId: 'someId',
      events: mockLoggedEvents,
      hasActiveHearing: false
    };
    store.select(isHearingEventLogEnded).subscribe(value => (isEventLogEnded = value));
    expect(isEventLogEnded).toEqual(null);
    store.dispatch(new LoadHearingEventsSuccessAction(eventInfo));
    expect(isEventLogEnded).toEqual(false);
  });

  it('should return true if the hearing event log has been ended', () => {
    let isEventLogEnded;

    const eventInfo = {
      hearingId: 'someId',
      events: [
        ...mockLoggedEvents,
        {
          hearingEventId: '83706782-2d11-42af-9ed2-dabe73f7ff82',
          hearingEventDefinitionId: '160ecb51-29ee-4954-bbbf-daab18a24fbb',
          recordedLabel: 'Hearing ended',
          eventTime: '2019-08-08T19:22:10.085Z',
          lastModifiedTime: '2019-08-08T19:22:10.707Z',
          alterable: false
        }
      ],
      hasActiveHearing: false
    };
    store.select(isHearingEventLogEnded).subscribe(value => (isEventLogEnded = value));
    expect(isEventLogEnded).toEqual(null);
    store.dispatch(new LoadHearingEventsSuccessAction(eventInfo));
    expect(isEventLogEnded).toEqual(true);
  });
});
