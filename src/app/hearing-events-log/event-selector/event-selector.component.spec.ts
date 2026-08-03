import { Component, EventEmitter } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed, fakeAsync, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EventSelectorComponent } from './event-selector.component';
import { PopulateEventDefinitionsPipe } from '../core/pipes';
import { DefenceCounsel, Defendant, EventDefinition } from '../../core';

let currentSelectedEvent = null as any;

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

const eventDefinitions: EventDefinition[] = [eventDef1, eventDef2];

describe('EventSelectorComponent', () => {
  let component: EventSelectorComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideTranslateService(), PopulateEventDefinitionsPipe],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.debugElement.children[0].componentInstance;
    component.eventDefinitions = eventDefinitions;

    fixture.detectChanges();

    // pdk-typeahead input element uses a randomly generated name attribute.
    // Need to make this a fixed name so Jest tests pass between test runs.
    const eventSelectorAutoSuggestEl = fixture.debugElement.query(By.css('pdk-autosuggest input'));
    eventSelectorAutoSuggestEl.nativeElement.name = 'stubbed-name';
  });

  describe('without a default event selected', () => {
    it('should have the expected template', () => {
      expect(fixture).toMatchSnapshot();
    });
  });

  describe('with a default event selected', () => {
    beforeAll(waitForAsync(() => {
      currentSelectedEvent = {
        recordedLabel: 'start'
      };
    }));

    it('should have the expected template', () => {
      expect(fixture).toMatchSnapshot();
    });

    it('should fire an event when selecting an event', fakeAsync(() => {
      component.selectEventDefinition(eventDef1);

      expect(fixture.componentInstance.selectEventDefinition).toHaveBeenCalledTimes(1);
    }));
  });

  it('should not emit event if eventDefinition is null', fakeAsync(() => {
    const spy = jest.spyOn(component.eventSelected, 'emit');
    component.selectEventDefinition(null);
    expect(spy).not.toHaveBeenCalled();
  }));

  it('should set first parameter as true for each first child on grouped events', () => {
    const events = [eventDef1, eventDef2];

    const eventsInSections = component.groupEventsIntoSections(events);

    expect(Object.keys(eventsInSections[0])).toContain('first');
    expect(Object.keys(eventsInSections[1])).toContain('first');
  });

  it('should limit the number of filtered events', () => {
    //Arrange
    const events = [eventDef1, eventDef2];
    for (let i = 0; i < component.FILTERED_EVENT_MAX_COUNT; i++) {
      events.push({
        id: (i + 1).toString(),
        actionLabel: 'Arraign defendant',
        alterable: false,
        recordedLabel: 'arraign',
        caseAttributes: [],
        actionSequence: i + 1,
        groupSequence: i + 1,
        groupLabel: `defendant${i + 1}`
      });
    }

    component.events = events;
    const groupEventsIntoSectionsSpy = jest.spyOn(component, 'groupEventsIntoSections');

    //Act
    component.handleInputText('defendant');

    //Assert
    const filteredEventsArg = groupEventsIntoSectionsSpy.mock.calls[
      groupEventsIntoSectionsSpy.mock.calls.length - 1
    ][0] as EventDefinition[];
    expect(events.length).toBeGreaterThan(component.FILTERED_EVENT_MAX_COUNT);
    expect(filteredEventsArg.length).toEqual(component.FILTERED_EVENT_MAX_COUNT);
  });
});

@Component({
  template: `
    <event-selector
      [event]="event"
      [eventDefinitions]="eventDefinitions"
      [hearingDefendants]="hearingDefendants"
      [hearingDefenceCounsels]="hearingDefenceCounsels"
      [witnessNames]="witnessName"
      (eventSelected)="selectEventDefinition($event)"
    ></event-selector>
  `,
  imports: [EventSelectorComponent]
})
class TestHostComponent {
  event = currentSelectedEvent;
  eventDefinitions: EventDefinition[];
  hearingDefendants = [] as Defendant[];
  hearingDefenceCounsels = [] as DefenceCounsel[];
  eventSelected: EventEmitter<EventDefinition> = new EventEmitter();

  selectEventDefinition = jest.fn();
}
