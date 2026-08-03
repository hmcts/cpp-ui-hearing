import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { LoggedEventsComponent } from './logged-events.component';
import { HearingEventsLogService } from '../core/services/hearing-events-log.service';
import { SimpleChange } from '@angular/core';
import { EventDefinition, EventLog, EventLogCountInfo, HearingPersonDetails } from '../../core';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { EventSelectorComponent } from '../event-selector/event-selector.component';
import { JsonPipe } from '@angular/common';

const eventDef1: EventDefinition = {
  id: '111111',
  actionLabel: 'Start hearing',
  alterable: false,
  recordedLabel: 'start',
  caseAttributes: [],
  actionSequence: 1,
  groupSequence: 1,
  groupLabel: 'start'
};

const eventDef2: EventDefinition = {
  id: '2222222',
  actionLabel: 'Arraign defendant',
  alterable: false,
  recordedLabel: 'arraign',
  caseAttributes: [],
  actionSequence: 1,
  groupSequence: 1,
  groupLabel: 'defendant'
};

const eventA: EventLog = {
  hearingEventId: '1111111',
  eventTime: '2018-12-28T11:00:00.000Z',
  recordedLabel: 'start'
};

const eventB: EventLog = {
  hearingEventId: '2222222',
  eventTime: '2018-12-28T11:30:00.000Z',
  recordedLabel: 'arraign'
};

const eventDefinitions: EventDefinition[] = [eventDef1, eventDef2];
const loggedEvents: EventLog[] = [eventA, eventB];
const eventLogCount: EventLogCountInfo = {
  eventLogCountByHearingIdAndDate: 0,
  eventLogCountByHearingId: 0
};

describe('LoggedEventsComponent', () => {
  let component: LoggedEventsComponent;
  let fixture: ComponentFixture<LoggedEventsComponent>;
  let hearingEventTypeAhead;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoggedEventsComponent],
      providers: [provideTranslateService(), HearingEventsLogService],
      teardown: { destroyAfterEach: true }
    })
      .overrideComponent(LoggedEventsComponent, {
        remove: { imports: [EventSelectorComponent] },
        add: { imports: [MockEventSelectorComponent] }
      })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoggedEventsComponent);
    component = fixture.componentInstance;
    component.eventDefinitions = eventDefinitions;
    component.loggedEvents = loggedEvents;
    component.time = new Date('23 Dec 2019');
    component.hearingDefendants = [];
    component.hearingDefenceCounsels = [];
    component.witnessNames = ['Tom Riddle'];
    component.selectedHearingDate = '24 Dec 2019';
    component.isHearingEventLogPaused = false;
    component.jurisdictionType = 'CROWN';
    component.hearingEventLogCount = eventLogCount;

    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });

    jest.spyOn(component.changeEvent, 'emit');
    jest.spyOn(component.addDefenceWitness, 'emit');
  });

  it('should have the expected template', () => {
    fixture.detectChanges();
    expect(fixture).toMatchSnapshot();
  });

  describe('event selector', () => {
    it('should show', () => {
      component.jurisdictionType = 'CROWN';

      fixture.detectChanges();
      hearingEventTypeAhead = fixture.debugElement.query(By.css('.event-selector'));
      expect(hearingEventTypeAhead).toBeTruthy();
    });

    describe('should not show', () => {
      it('if judiciary is magistrates', () => {
        component.jurisdictionType = 'MAGISTRATES';
        fixture.detectChanges();

        hearingEventTypeAhead = fixture.debugElement.query(By.css('.event-selector'));
        expect(hearingEventTypeAhead).toBe(null);
      });
    });
  });

  it('should emit changeEventTime when onChangeEventTime', () => {
    component.onChangeEvent({} as EventLog);
    expect(component.changeEvent.emit).toHaveBeenCalled();
  });

  it('should emit addDefenceWitness when onAddDefenceWitness', () => {
    component.onAddDefenceWitness();
    expect(component.addDefenceWitness.emit).toHaveBeenCalled();
  });

  @Component({
    selector: 'event-selector',
    template: `
      event: {{ event | json }} <br />
      eventDefinitions: {{ eventDefinitions | json }} <br />
      hearingDefendants: {{ hearingDefendants | json }} <br />
      hearingDefenceCounsels: {{ hearingDefenceCounsels | json }} <br />
      witnessNames: {{ witnessNames | json }} <br />
      resetAfterSelect: {{ resetAfterSelect | json }} <br />
      isHearingEventLogPaused: {{ isHearingEventLogPaused | json }} <br />
    `,
    imports: [JsonPipe]
  })
  class MockEventSelectorComponent {
    @Input() event: EventLog;
    @Input() eventDefinitions: EventDefinition[];
    @Input() hearingDefendants: HearingPersonDetails[];
    @Input() hearingDefenceCounsels: HearingPersonDetails[];
    @Input() witnessNames: string[];
    @Input() resetAfterSelect = false;
    @Input() isHearingEventLogPaused: boolean;
    @Output() onEventSelected = new EventEmitter<EventDefinition>();
  }
});
