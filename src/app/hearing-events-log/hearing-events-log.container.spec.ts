import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  AppState,
  getCurrentHearingPersonDetails,
  getCurrentHearingEventDefinitions,
  getCurrentHearingLoggedEvents,
  getCurrentEventsLogState,
  getHearingTypes,
  currentHearingIsBoxHearing,
  EventDefinition,
  HearingDetail,
  HearingDetailRedux,
  HearingState
} from '../core';
import {
  LoadHearingEventDefinitionsAction,
  LogEventAction,
  SetEventsLogStateAction
} from '../core/actions/hearing-events-log';
import { HearingEventsLogContainer } from './hearing-events-log.container';
import { EventLogStates } from './core/models';
import { PopulateEventDefinitionsPipe } from './core/pipes/populate-event-definitions.pipe';
import { SortLoggedEventsPipe } from './core/pipes/sort-logged-events.pipe';
import { HearingEventsLogService } from './core/services/hearing-events-log.service';

describe('HearingEventsLogContainer', () => {
  let component: HearingEventsLogContainer;
  let fixture: ComponentFixture<HearingEventsLogContainer>;

  let selectSpy: any;
  let navigateSpy;
  let scrollSpy;
  let state: AppState;
  let dispatchSpy: any;
  const store: Store<AppState> = null;
  const paramMap = { get: () => 'id1' };
  const CHANGE_HEARING_TYPE = 'hearing type changed to';

  beforeEach(waitForAsync(() => {
    state = {
      hearings: {
        current: {
          hearing: {
            isBoxHearing: false
          } as HearingDetail
        } as HearingDetailRedux,
        selectedHearingDate: '2019-09-10'
      } as HearingState,
      hearingEventsLog: {
        eventDefinitions: [
          {
            recordedLabel: 'Hearing type changed to'
          }
        ] as EventDefinition[],
        loggedEvents: [],
        eventsLogState: 'DISPLAY_EVENTS'
      },
      referenceData: {
        hearingTypes: []
      }
    } as AppState;
    dispatchSpy = jest.fn();

    selectSpy = jest.fn().mockImplementation(selectorFunc => {
      return of(selectorFunc.call(store, state));
    });

    navigateSpy = jest.fn().mockReturnValue(
      new Promise<void>((resolve, reject) => {
        resolve();
      })
    );
    scrollSpy = jest.fn();

    TestBed.configureTestingModule({
      imports: [HearingEventsLogContainer],
      providers: [
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: paramMap
            }
          }
        },
        { provide: Store, useValue: { select: selectSpy, dispatch: dispatchSpy } },
        { provide: 'Window', useValue: { scroll: scrollSpy } },
        { provide: Router, useValue: { navigate: navigateSpy } },
        PopulateEventDefinitionsPipe,
        SortLoggedEventsPipe,
        HearingEventsLogService
      ],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingEventsLogContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should dispatch LoadHearingEventDefinitionsAction', () => {
    expect(dispatchSpy).toHaveBeenCalledWith(new LoadHearingEventDefinitionsAction());
  });

  it('should select getCurrentHearingPersonDetails in the contructor', () => {
    expect(selectSpy).toHaveBeenCalledWith(getCurrentHearingPersonDetails);
  });

  it('should select getCurrentHearingEventDefinitions in the contructor', () => {
    expect(selectSpy).toHaveBeenCalledWith(getCurrentHearingEventDefinitions);
  });

  it('should select getCurrentHearingLoggedEvents in the contructor', () => {
    expect(selectSpy).toHaveBeenCalledWith(getCurrentHearingLoggedEvents);
  });

  it('should select getCurrentEventsLogState in the contructor', () => {
    expect(selectSpy).toHaveBeenCalledWith(getCurrentEventsLogState);
  });

  it('should select getHearingTypes in the contructor', () => {
    expect(selectSpy).toHaveBeenCalledWith(getHearingTypes);
  });

  it('should not dispatch LogEventAction when event label is "hearing type changed to"', () => {
    const spyOnDisplayChangeHearingType = jest.spyOn(component, 'displayChangeHearingType');
    const eventToLog = {
      alterable: true,
      eventTime: '2019-08-13T14:23:04.673Z',
      hearingEventDefinitionId: 'b71e7d2a-d3b3-4a55-a393-6d451767fc05',
      hearingEventId: 'acb17b6c-46b0-47fd-9b85-1972d1575e89',
      lastModifiedTime: '2019-08-13T14:23:07.435Z',
      recordedLabel: CHANGE_HEARING_TYPE
    };
    component.onEventSelected(eventToLog);
    expect(dispatchSpy).not.toHaveBeenCalledWith(
      new LogEventAction({ hearingId: 'id1', event: eventToLog })
    );
    expect(spyOnDisplayChangeHearingType).toHaveBeenCalled();
  });

  it('should dispatch SetEventsLogStateAction when displayEvents is called', () => {
    component.displayEvents();
    expect(dispatchSpy).toHaveBeenCalledWith(
      new SetEventsLogStateAction(EventLogStates.DISPLAY_EVENTS)
    );
  });

  it('should dispatch SetEventsLogStateAction when displayAddDefenceWitness is called', () => {
    component.displayAddDefenceWitness();
    expect(dispatchSpy).toHaveBeenCalledWith(
      new SetEventsLogStateAction(EventLogStates.ADD_DEFENCE_WITNESS)
    );
  });

  it('should dispatch SetEventsLogStateAction when displayChangeEvent is called', () => {
    component.displayChangeEvent({});
    expect(dispatchSpy).toHaveBeenCalledWith(
      new SetEventsLogStateAction(EventLogStates.CHANGE_EVENT)
    );
  });

  it('should dispatch SetEventsLogStateAction when onWitnessNameSelected is called', () => {
    component.onWitnessNameSelected('test-witness-name');
    expect(dispatchSpy).toHaveBeenCalledWith(
      new SetEventsLogStateAction(EventLogStates.DISPLAY_EVENTS)
    );
  });

  it('should dispatch SetEventsLogStateAction when displayChangeHearingType is called', () => {
    component.displayChangeHearingType();
    expect(dispatchSpy).toHaveBeenCalledWith(
      new SetEventsLogStateAction(EventLogStates.CHANGE_HEARING_TYPE)
    );
  });

  describe('Boxwork hearing', () => {
    beforeAll(() => {
      state = {
        hearings: {
          current: {
            hearing: {
              isBoxHearing: true
            }
          }
        }
      } as AppState;
    });

    it('should have the expected template', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should select isBoxwork in the constructor', () => {
      expect(selectSpy).toHaveBeenCalledWith(currentHearingIsBoxHearing);
    });
  });
});
