import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgForm } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { HearingEventLogTimeValidator } from './hearing-event-log-time.validator';
import { PdkTimeInputComponent, PdkFormComponent } from '@cpp/pdk';
import { CPPDate } from '../../../core';
import { CommonModule } from '@angular/common';

const mockCppDate: CPPDate = new CPPDate();
jest.mock('../../../core', () => ({
  ...(jest.requireActual('../../../core') as Partial<CPPDate>),
  getCPPDate: jest.fn(() => new Date('2018-08-28T20:00:00.000Z')),
  getCurrentDate: jest.fn(() => new Date('2018-08-28T20:00:00.000Z'))
}));

interface EventLog {
  hearingEventId?: string;
  recordedLabel: string;
  eventTime: string;
}

const startEvent: EventLog = {
  hearingEventId: 'start-001',
  recordedLabel: 'Hearing started',
  eventTime: '2018-08-28T10:00:00.000Z'
};

const endEvent: EventLog = {
  hearingEventId: 'end-001',
  recordedLabel: 'Hearing ended',
  eventTime: '2018-08-28T14:00:00.000Z'
};

const pauseEvent: EventLog = {
  hearingEventId: 'pause-001',
  recordedLabel: 'Hearing paused',
  eventTime: '2018-08-28T11:00:00.000Z'
};

const resumeEvent: EventLog = {
  hearingEventId: 'resume-001',
  recordedLabel: 'Hearing resumed',
  eventTime: '2018-08-28T11:30:00.000Z'
};

const anyEvent: EventLog = {
  hearingEventId: 'any-001',
  recordedLabel: 'Random label',
  eventTime: '2018-08-28T12:00:00.000Z'
};

describe('HearingEventLogTimeValidator', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let form: NgForm;
  let formElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: CPPDate,
          useValue: mockCppDate
        }
      ],
      teardown: { destroyAfterEach: false }
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    form = fixture.debugElement.children[0].injector.get(NgForm);
    formElement = fixture.debugElement.query(By.css('form'));
    jest.spyOn(mockCppDate, 'getCurrentDate').mockReturnValue(new Date('2018-08-28T20:00:00.000Z'));
    fixture.detectChanges();
  });

  const getControlErrors = () => {
    const control = form.controls['eventTime'];
    return control?.errors || null;
  };

  it('should have no error if start event is the only event (no logs)', async () => {
    component.validationParams = {
      eventLog: startEvent,
      loggedEvents: []
    };
    component.eventTime = '10:00';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeNull();
  });

  it('should return `timeInFuture` if event is set in the future', async () => {
    component.validationParams = {
      eventLog: anyEvent,
      loggedEvents: [startEvent]
    };
    component.eventTime = '22:00';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.timeInFuture).toBeDefined();
  });

  it('should return `timeBeforeStart` if event is earlier than the start event', async () => {
    component.validationParams = {
      eventLog: anyEvent,
      loggedEvents: [startEvent]
    };
    component.eventTime = '09:00';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.timeBeforeStart).toBeDefined();
  });

  it('should return `afterEnd` if an event is after an existing endEvent', async () => {
    component.validationParams = {
      eventLog: anyEvent,
      loggedEvents: [startEvent, endEvent]
    };
    component.eventTime = '16:00';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.afterEnd).toBeDefined();
  });

  it('should return `startEventFirstEvent` if it is a start event time is after anyEvent', async () => {
    component.validationParams = {
      eventLog: startEvent,
      loggedEvents: [anyEvent, startEvent]
    };
    component.eventTime = '19:50';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.startEventFirstEvent).toBeDefined();
  });

  it('should have no error if a new start event is earlier than the existing startEvent', async () => {
    component.validationParams = {
      eventLog: startEvent,
      loggedEvents: [anyEvent, startEvent]
    };
    component.eventTime = '09:30';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeNull();
  });

  it('should have no error if resumeEvent is after pauseEvent', async () => {
    component.validationParams = {
      eventLog: resumeEvent,
      loggedEvents: [pauseEvent, startEvent]
    };
    component.eventTime = '11:30';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeNull();
  });

  it('should return `pauseNotResume` if the event is after pauseEvent but is NOT a resume event', async () => {
    component.validationParams = {
      eventLog: anyEvent,
      loggedEvents: [pauseEvent, startEvent]
    };
    component.eventTime = '12:15';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.pauseNotResume).toBeDefined();
  });

  it('should return `afterEnd` if an event is after an existing endEvent', async () => {
    component.validationParams = {
      eventLog: anyEvent,
      loggedEvents: [startEvent, endEvent]
    };
    component.eventTime = '15:10';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.afterEnd).toBeDefined();
  });

  it('should return `timeBeforeStart` if we set the new event before the start event', async () => {
    component.validationParams = {
      eventLog: anyEvent,
      loggedEvents: [startEvent]
    };
    component.eventTime = '09:00';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.timeBeforeStart).toBeDefined();
  });

  it('should not error if endEvent is truly the last event in the log', async () => {
    component.validationParams = {
      eventLog: endEvent,
      loggedEvents: [startEvent]
    };
    component.eventTime = '14:30';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeNull();
  });

  it('should return `endEventLastEvent` if it is an endEvent but not actually last in time', async () => {
    component.validationParams = {
      eventLog: endEvent,
      loggedEvents: [anyEvent, startEvent]
    };
    component.eventTime = '11:30';
    fixture.detectChanges();

    formElement.triggerEventHandler('validSubmit', null);
    await fixture.whenStable();

    const errors = getControlErrors();
    expect(errors).toBeTruthy();
    expect(errors?.endEventLastEvent).toBeDefined();
  });
});

@Component({
  selector: 'test-host-component',
  template: `
    <form (validSubmit)="onSubmit()">
      <pdk-time-input
        name="eventTime"
        [(ngModel)]="eventTime"
        [validateHearingEventLogTime]="validationParams"
        required
      ></pdk-time-input>
    </form>
  `,
  imports: [
    FormsModule,
    CommonModule,
    PdkTimeInputComponent,
    PdkFormComponent,
    HearingEventLogTimeValidator
  ]
})
class TestHostComponent {
  eventTime = '09:00';
  validationParams: {
    eventLog?: EventLog;
    loggedEvents?: EventLog[];
  } = {};

  onSubmit() {}
}
