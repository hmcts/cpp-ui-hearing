import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { ChangeEventDetailsComponent } from './change-event-details.component';
import { EventDefinition } from '../../core';

const hearingDefendant = {
  firstName: 'Jack',
  lastName: 'Hummel',
  defendantId: 'id'
};

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

const eventDef3: EventDefinition = {
  id: '4444',
  actionLabel: 'In chambers',
  alterable: true,
  recordedLabel: 'In chambers',
  caseAttributes: [],
  actionSequence: 1,
  groupSequence: 1,
  groupLabel: 'defendant'
};

const eventDefinitions: EventDefinition[] = [eventDef1, eventDef2, eventDef3];

const hearingTypes = [
  {
    id: '1',
    seqId: 1,
    hearingCode: '1',
    hearingDescription: 'Plea',
    welshHearingDescription: 'a',
    defaultDurationMin: 1
  },
  {
    id: '2',
    seqId: 2,
    hearingCode: '2',
    hearingDescription: 'First hearing',
    welshHearingDescription: 'a',
    defaultDurationMin: 1
  }
];

const mockEvent = {
  hearingEventId: '4444',
  eventTime: new Date().toISOString(),
  recordedLabel: 'In chambers',
  alterable: true
};

const mockEventChangeHearingType = {
  hearingEventId: '4444',
  eventTime: new Date().toISOString(),
  recordedLabel: 'Hearing type changed to Plea'
};

const mockedEvents = [
  {
    hearingEventId: '1111',
    recordedLabel: 'Event A',
    eventTime: '2018-07-15T10:00:00.000Z',
    alterable: false
  },
  {
    hearingEventId: '2222',
    recordedLabel: 'Event B',
    eventTime: '2018-07-15T10:20:00.000Z',
    alterable: false
  },
  {
    hearingEventId: '3333',
    recordedLabel: 'Event C',
    eventTime: '2018-07-15T10:40:00.000Z',
    alterable: false
  }
];

describe('ChangeEventDetailsComponent', () => {
  let component: ChangeEventDetailsComponent;
  let testHostComponent: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let onSaveEmit: any;
  let onCancelEmit: any;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TestHostComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    testHostComponent = fixture.componentInstance;
    component = fixture.debugElement.children[0].componentInstance;

    component.jurisdictionType = 'CROWN';
  });

  afterAll(() => {
    onSaveEmit.unsubscribe();
    onCancelEmit.unsubscribe();
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('time should be the same as in mockEvent', () => {
    fixture.detectChanges();

    expect(component.time).toBe(mockEvent.eventTime);
  });

  it('should emit eventChanged with event on onSave() ', () => {
    fixture.detectChanges();

    onSaveEmit = component.eventChanged.subscribe(r => {
      expect(r.hearingEventId).toBe(mockEvent.hearingEventId);
    });
    component.onSave();
  });

  it('should emit eventCreated with event on onSave() if event isCreate is true ', () => {
    testHostComponent.event = { ...mockEvent, isCreate: true } as any;

    fixture.detectChanges();

    component.eventSelector.selectedEvent = {
      recordedLabel: mockEvent.recordedLabel,
      actionLabel: mockEvent.recordedLabel
    } as EventDefinition;

    const eventCreated = jest.spyOn(component.eventCreated, 'emit');

    onSaveEmit = component.eventCreated.subscribe(r => {
      expect(r.hearingEventId).toBe(mockEvent.hearingEventId);
    });
    component.onSave();

    expect(eventCreated).toHaveBeenCalledWith({
      event: expect.objectContaining({ alterable: true }),
      hearingEventId: mockEvent.hearingEventId
    });
  });

  it('should emit eventChanged with null on onCancel() ', () => {
    fixture.detectChanges();

    onCancelEmit = component.eventChanged.subscribe(r => {
      expect(r).toBe(null);
    });
    component.onCancel();
  });

  it('should not emit eventChanged or eventCreated with event on onSave() when event note has overlong text', () => {
    testHostComponent.event = { ...mockEvent, note: new Array(5000).join('a') } as any;

    fixture.detectChanges();

    const eventChanged = jest.spyOn(component.eventChanged, 'emit');
    const eventCreated = jest.spyOn(component.eventCreated, 'emit');

    component.onSave();

    expect(eventChanged).not.toHaveBeenCalled();
    expect(eventCreated).not.toHaveBeenCalled();
  });

  it('should enable the time auto shift when focused', () => {
    component.eventTimeFocused();
    fixture.detectChanges();

    expect(component.eventTimeAutoShift).toBeTruthy();
  });

  it('should have find a selectedHearingType when event label is "Hearing type changed to"', () => {
    testHostComponent.event = mockEventChangeHearingType as any;

    fixture.detectChanges();

    expect(component.selectedHearingType).toEqual({
      id: '1',
      seqId: 1,
      hearingCode: '1',
      hearingDescription: 'Plea',
      welshHearingDescription: 'a',
      defaultDurationMin: 1
    });
  });
});

@Component({
  template: `
    <change-event-details
      [event]="event"
      [loggedEvents]="loggedEvents"
      [eventDefinitions]="eventDefinitions"
      [hearingDefendants]="hearingDefendants"
      [hearingDefenceCounsels]="hearingDefenceCounsels"
      [witnessNames]="witnessNames"
      [currentDate]="currentDate"
      [hearingTypes]="hearingTypes"
    ></change-event-details>
  `,
  imports: [ChangeEventDetailsComponent]
})
class TestHostComponent {
  event = mockEvent;
  loggedEvents = mockedEvents;
  eventDefinitions = eventDefinitions;
  hearingDefendants = [hearingDefendant];
  hearingDefenceCounsels = [hearingDefendant];
  witnessName = 'witness';
  currentDate = new Date().toISOString();
  hearingTypes = hearingTypes;
  witnessNames = ['witness'];
}
