import { TestBed } from '@angular/core/testing';
import { HearingEventsLogService } from './hearing-events-log.service';
import { CPPDate, EventDefinition } from '../../../core';
import { EventLog } from '../../../core';

const mockCppDate: CPPDate = new CPPDate();
jest.mock('../../../core', () => ({
  ...(jest.requireActual('../../../core') as Partial<CPPDate>),
  getCPPDate: jest.fn(() => mockCppDate)
}));

describe('HearingEventsLogService', () => {
  const eventDefA: EventDefinition = {
    id: '111111',
    actionLabel: 'Start hearing',
    alterable: false,
    recordedLabel: 'Hearing started',
    caseAttributes: [],
    actionSequence: null,
    groupSequence: null,
    groupLabel: 'group'
  };

  const startEvent: EventLog = {
    hearingEventId: 'hearingEventId1',
    eventTime: '2018-08-28T11:00:00.000Z',
    recordedLabel: 'Hearing started'
  };

  const anyEvent: EventLog = {
    hearingEventId: 'hearingEventId2',
    eventTime: '2018-08-28T11:30:00.000Z',
    recordedLabel: 'Proceedings in chambers'
  };

  const pauseEvent: EventLog = {
    hearingEventId: 'hearingEventId3',
    eventTime: '2018-08-28T12:00:00.000Z',
    recordedLabel: 'Hearing paused'
  };

  const resumeEvent: EventLog = {
    hearingEventId: 'hearingEventId4',
    eventTime: '2018-08-28T12:30:00.000Z',
    recordedLabel: 'Hearing resumed'
  };

  const endEvent: EventLog = {
    hearingEventId: 'hearingEventId5',
    eventTime: '2018-08-28T13:00:00.000Z',
    recordedLabel: 'Hearing ended'
  };

  let service: HearingEventsLogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HearingEventsLogService],
      teardown: { destroyAfterEach: false }
    });
    service = TestBed.inject(HearingEventsLogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('buildEventLog - should create eventLog from eventDef and time', () => {
    const now = '2018-08-28T10:00:00.000Z';
    const selectedHearing = '2018-08-28T10:00:00.000Z';
    const newEventLog = service.buildEventLog(eventDefA, new Date(now), selectedHearing);
    expect(newEventLog.hearingEventId.length).toBeGreaterThan(4);
    expect(newEventLog.hearingEventDefinitionId).toBe(eventDefA.id);
    expect(newEventLog.alterable).toBe(eventDefA.alterable);
    expect(newEventLog.recordedLabel).toBe(eventDefA.recordedLabel);
    expect(newEventLog.eventTime).toBe(now);
    expect(newEventLog.lastModifiedTime).toBeDefined();
  });

  it('sortLoggedEvents - should sort events by eventTime', () => {
    const expected = [startEvent, endEvent, anyEvent, resumeEvent, pauseEvent];
    const received = [endEvent, resumeEvent, pauseEvent, anyEvent, startEvent];
    expect(service.sortLoggedEvents(expected)).toEqual(received);
  });
});
