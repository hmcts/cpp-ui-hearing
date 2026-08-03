import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import {} from '@angular/router/testing';
import { provideStore } from '@ngrx/store';
import { cold, hot } from 'jasmine-marbles';
import { of } from 'rxjs';
import { Actions } from '@ngrx/effects';
import { HearingEventsLogEffects } from './hearing-events-log';
import { reducers } from '../reducers';

import {
  LoadHearingEventDefinitionsAction,
  LoadHearingEventDefinitionsSuccessAction,
  LogEventAction,
  LogEventSuccessAction,
  LoadHearingEventsAction,
  LoadHearingEventsSuccessAction,
  ApiError,
  LoadCanStartEventLogAction,
  LoadCanStartEventLogSuccessAction,
  loadHearingEventLogCountAction,
  loadHearingEventsLogCountSuccessAction
} from '../actions';
import { getActions, TestActions } from '../../mock-data/test-mock-data';
import { HearingService } from '../services/Hearing/hearing.service';
import { CppHttp, provideCppCoreHttpServices } from '@cpp/core';
import { EventDefinition, EventInfo } from '../model';

describe('Hearing event log effects', () => {
  let actions$: TestActions;
  let effects: HearingEventsLogEffects;
  const updatePleas = jest.fn();
  const getHearingEventDefinitions = jest.fn();
  const getHearingEventsLogged = jest.fn();
  const logEventForHearing = jest.fn();
  const correctEventForHearing = jest.fn();
  const updateVerdicts = jest.fn();
  const addProsecutionCounsel = jest.fn();
  const updateProsecutionCounsel = jest.fn();
  const removeProsecutionCounsel = jest.fn();
  const addDefenceCounsel = jest.fn();
  const updateDefenceCounsel = jest.fn();
  const removeDefenceCounsel = jest.fn();
  const updateDefendantAttendance = jest.fn();
  const getDownloadFullEventLog = jest.fn();
  const getHearingEventsLogCount = jest.fn();

  const saveNewNote = jest.fn();
  const navigateSpy = jest.fn().mockReturnValue(
    new Promise<void>((resolve, reject) => {
      resolve();
    })
  );
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideCppCoreHttpServices(),
        HearingEventsLogEffects,
        {
          provide: HearingService,
          useValue: {
            saveNewNote,
            updatePleas,
            addProsecutionCounsel,
            updateProsecutionCounsel,
            removeProsecutionCounsel,
            addDefenceCounsel,
            updateDefenceCounsel,
            removeDefenceCounsel,
            updateVerdicts,
            updateDefendantAttendance,
            getHearingEventDefinitions,
            getHearingEventsLogged,
            logEventForHearing,
            correctEventForHearing,
            getHearingEventsLogCount,
            getDownloadFullEventLog
          }
        },
        {
          provide: CppHttp,
          useValue: {
            query: jest.fn(),
            commandSync: jest.fn()
          }
        },
        { provide: Actions, useFactory: getActions },
        { provide: Router, useValue: { navigate: navigateSpy } }
      ],
      teardown: { destroyAfterEach: false }
    });
    actions$ = TestBed.inject(Actions) as TestActions;
    effects = TestBed.inject(HearingEventsLogEffects);
  });

  describe('getHearingEventDefinitions$', () => {
    it('should get hearing event definitions', () => {
      const definitions = [
        <EventDefinition>{
          value: 'GUILTY'
        }
      ];
      const inputAction = new LoadHearingEventDefinitionsAction();

      const outputAction = new LoadHearingEventDefinitionsSuccessAction(definitions);

      actions$.stream = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      getHearingEventDefinitions.mockReturnValue(of(definitions));
      expect(effects.getHearingEventDefinitions$).toBeObservable(expected$);
    });
  });

  describe('logEvent$', () => {
    it('should log event', () => {
      const event = {
        hearingEventId: '12345',
        latestHearingEventId: '12345',
        hearingEventDefinitionId: '12345',
        alterable: true,
        recordedLabel: 'test',
        eventTime: '2017-08-01',
        lastModifiedTime: '2017-08-01'
      };
      const inputAction = new LogEventAction({ event, hearingId: '123' });

      const result = { eventsLogState: 'DISPLAY_EVENTS', loggedEvent: event };
      const outputAction = new LogEventSuccessAction(result);

      actions$.stream = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });
      logEventForHearing.mockReturnValue(of(result));
      expect(effects.logEvent$).toBeObservable(expected$);
    });
  });

  describe('getHearingEvents$ @effect', () => {
    const payload = {
      hearingId: 'test-hearingid'
    };

    it('should getHearingEvents$ : success expect dispatch Action LoadHearingEventsSuccessAction', () => {
      const triggerAction: LoadHearingEventsAction = new LoadHearingEventsAction(payload);
      const eventInfo = <EventInfo>{};
      const expectedAction: LoadHearingEventsSuccessAction = new LoadHearingEventsSuccessAction(
        eventInfo
      );
      actions$.stream = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });
      getHearingEventsLogged.mockReturnValue(of({}));
      expect(effects.getHearingEvents$).toBeObservable(expected);
    });
    it('should getHearingEvents$ : error expect throw ApiError', () => {
      const triggerAction: LoadHearingEventsAction = new LoadHearingEventsAction(payload);
      const expectedAction: ApiError = new ApiError('error');
      actions$.stream = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      getHearingEventsLogged.mockReturnValue(error$);
      expect(effects.getHearingEvents$).toBeObservable(expected);
    });
  });

  describe('getCanStartEvent$ @effect', () => {
    const event = {
      hearingEventId: '12345',
      latestHearingEventId: '12345',
      hearingEventDefinitionId: '12345',
      alterable: true,
      recordedLabel: 'test',
      eventTime: '2017-08-01',
      lastModifiedTime: '2017-08-01'
    };

    const payload = {
      hearingId: 'test-hearingid',
      event
    };

    it('should getCanStartEvent$ : success expect dispatch Action LoadCanStartEventLogAction', () => {
      const triggerAction: LoadCanStartEventLogAction = new LoadCanStartEventLogAction(payload);
      const eventInfo = <EventInfo>{};
      const expectedAction: LoadCanStartEventLogSuccessAction =
        new LoadCanStartEventLogSuccessAction(eventInfo);
      actions$.stream = hot('-a---', { a: triggerAction });
      const expected = cold('-b', { b: expectedAction });
      getHearingEventsLogged.mockReturnValue(of({}));
      expect(effects.getCanStartEvent$).toBeObservable(expected);
    });

    it('should getCanStartEvent$ : error expect throw ApiError', () => {
      const triggerAction: LoadCanStartEventLogAction = new LoadCanStartEventLogAction(payload);
      const expectedAction: ApiError = new ApiError('error');
      actions$.stream = hot('-a', { a: triggerAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      getHearingEventsLogged.mockReturnValue(error$);
      expect(effects.getCanStartEvent$).toBeObservable(expected);
    });
  });

  describe('getHearingEventsCountLog$', () => {
    it('should get hearing event log count', () => {
      const hearingId = '9c7ef362-5bd8-43de-bdda-5b8d06ca61f2';
      const eventLogCount = { eventLogCountByHearingIdAndDate: 1, eventLogCountByHearingId: 1 };
      const inputAction = loadHearingEventLogCountAction({ hearingId });
      const outputAction = loadHearingEventsLogCountSuccessAction({ eventLogCount });

      actions$.stream = hot('-a---', { a: inputAction });
      const expected$ = cold('-b', { b: outputAction });

      getHearingEventsLogCount.mockReturnValue(of(eventLogCount));
      expect(effects.getHearingEventsCountLog$).toBeObservable(expected$);
    });

    it('should getHearingEventsCountLog$ : error expect throw ApiError', () => {
      const hearingId = 'hearingId';
      const inputAction = loadHearingEventLogCountAction({ hearingId });
      const expectedAction: ApiError = new ApiError('error');
      actions$.stream = hot('-a', { a: inputAction });
      const error$ = cold('#');
      const expected = cold('-b', { b: expectedAction });
      getHearingEventsLogCount.mockReturnValue(error$);
      expect(effects.getHearingEventsCountLog$).toBeObservable(expected);
    });
  });
});
