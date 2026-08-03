import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EventLog } from '../../core';
import { SimpleChange } from '@angular/core';
import moment from 'moment';
import { provideTranslateService } from '@ngx-translate/core';

import { TotalJuryDeliberationComponent } from './total-jury-deliberation.component';

const juryRetiredEvent: EventLog = {
  hearingEventId: '7c524ce0-751a-4e12-8488-3b25c4f5bc5d',
  hearingEventDefinitionId: '928f8290-5e82-49fd-bd45-b12c24786eda',
  recordedLabel: 'Jury retired',
  eventTime: '2020-01-03T10:56:50.407Z',
  lastModifiedTime: '2020-01-09T10:56:50.580Z',
  alterable: true
};

const juryReturnedEvent: EventLog = {
  hearingEventId: '742707dd-ec0e-4df6-b0b0-ec3f0767b85e',
  hearingEventDefinitionId: '14b7620b-360f-466a-b7ab-9939a30e2eef',
  recordedLabel: 'Jury returned',
  eventTime: '2020-01-03T11:30:00.000Z',
  lastModifiedTime: '2020-01-13T13:50:44.976Z',
  alterable: true
};

const juryDischargedEvent: EventLog = {
  hearingEventId: 'd485a0b9-3672-4c64-bade-19ce55245ce1',
  hearingEventDefinitionId: '23c18a6e-3ed4-4421-80c5-8513e32f9634',
  recordedLabel: 'Jury discharged',
  eventTime: '2020-01-03T15:43:28.327Z',
  lastModifiedTime: '2020-01-13T15:43:29.134Z',
  alterable: true
};

const hearingEndedEvent: EventLog = {
  hearingEventId: '28d3dcc2-94b4-46ff-8bdc-af295b7bce70',
  hearingEventDefinitionId: '0df93f18-0a21-40f5-9fb3-da4749cd70fe',
  recordedLabel: 'Hearing ended',
  eventTime: '2020-01-03T15:56:54.943Z',
  lastModifiedTime: '2020-01-13T15:56:55.317Z',
  alterable: false
};

const hearingPausedEvent: EventLog = {
  hearingEventId: '99bb0822-0c24-46a0-b138-4296355b41cb',
  hearingEventDefinitionId: '160ecb51-29ee-4954-bbbf-daab18a24fbb',
  recordedLabel: 'Hearing paused',
  eventTime: '2020-01-03T12:06:43.566Z',
  lastModifiedTime: '2020-01-09T15:06:44.570Z',
  alterable: false
};

const hearingResumedEvent: EventLog = {
  hearingEventId: '7a824339-d4e4-41c6-8ddd-ba7a5f4f1da8',
  hearingEventDefinitionId: '64476e43-2138-46d5-b58b-848582cf9b07',
  recordedLabel: 'Hearing resumed',
  eventTime: '2020-01-03T12:16:42.557Z',
  lastModifiedTime: '2020-01-09T15:06:43.325Z',
  alterable: false
};

describe('TotalJuryDeliberationComponent', () => {
  let component: TotalJuryDeliberationComponent;
  let fixture: ComponentFixture<TotalJuryDeliberationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
      imports: [TotalJuryDeliberationComponent],
      teardown: { destroyAfterEach: false }
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalJuryDeliberationComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the expected template', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should start counting when jury retires', () => {
    const loggedEvents: EventLog[] = [juryRetiredEvent];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    expect(component.deliberationTimerInMinutes !== 0).toBeTruthy();
  });

  it('should stop counting when jury returns', () => {
    const loggedEvents: EventLog[] = [juryReturnedEvent, juryRetiredEvent];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    const expectedDifferenceInMinutes =
      moment(loggedEvents[0].eventTime)
        .endOf('minutes')
        .diff(loggedEvents[1].eventTime, 'minutes') + 1;

    expect(component.deliberationTimerInMinutes).toBe(expectedDifferenceInMinutes);
  });

  it('should reset counting when jury discharged in any case', () => {
    const loggedEvents: EventLog[] = [juryDischargedEvent, juryRetiredEvent];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    expect(component.deliberationTimerInMinutes).toBe(0);
  });

  it('should stop counting when hearing ended', () => {
    const loggedEvents: EventLog[] = [hearingEndedEvent, juryRetiredEvent];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    const expectedDifferenceInMinutes =
      moment(loggedEvents[0].eventTime).diff(loggedEvents[1].eventTime, 'minutes') + 1;

    expect(component.deliberationTimerInMinutes).toBe(expectedDifferenceInMinutes);
  });

  it('should continue counting elapsed jury deliberation time after pausing or freezing', () => {
    const loggedEvents: EventLog[] = [
      { ...juryReturnedEvent, eventTime: '2020-01-03T16:58:50.407Z' },
      { ...juryRetiredEvent, eventTime: '2020-01-03T16:56:50.407Z' },
      juryReturnedEvent,
      juryRetiredEvent
    ];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    const expectedDifferenceInMinutes =
      moment(loggedEvents[2].eventTime).diff(loggedEvents[3].eventTime, 'minutes') + 1;

    expect(component.deliberationTimerInMinutes > expectedDifferenceInMinutes).toBeTruthy();
  });

  it('should remain timer same when jury returned event triggered while timer is not running', () => {
    const loggedEvents: EventLog[] = [
      { ...juryReturnedEvent, eventTime: '2020-01-03T16:56:50.407Z' },
      juryReturnedEvent,
      juryRetiredEvent
    ];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    const expectedDifferenceInMinutes =
      moment(loggedEvents[1].eventTime)
        .endOf('minutes')
        .diff(loggedEvents[2].eventTime, 'minutes') + 1;

    expect(component.deliberationTimerInMinutes).toBe(expectedDifferenceInMinutes);
  });

  it('should remain timer running when hearing paused and un-paused event triggered while timer is running', () => {
    const loggedEvents: EventLog[] = [
      { ...juryReturnedEvent, eventTime: '2020-01-03T16:56:50.407Z' },
      hearingResumedEvent,
      hearingPausedEvent,
      juryRetiredEvent
    ];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    const expectedDifferenceInMinutes =
      moment(loggedEvents[0].eventTime).diff(loggedEvents[3].eventTime, 'minutes') + 1;

    expect(component.deliberationTimerInMinutes).toBe(expectedDifferenceInMinutes);
  });

  it('should recalculate timer if one of the events is updated', () => {
    const loggedEvents: EventLog[] = [juryReturnedEvent, juryRetiredEvent];

    component.loggedEvents = loggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, loggedEvents, true)
    });
    fixture.detectChanges();

    const firstCalculatedDeliberationTimer = component.deliberationTimerInMinutes;

    const newLoggedEvents: EventLog[] = [
      { ...juryReturnedEvent, eventTime: '2020-01-03T16:58:50.407Z' },
      { ...juryRetiredEvent, eventTime: '2020-01-03T16:56:50.407Z' },
      hearingEndedEvent,
      juryRetiredEvent
    ];

    component.loggedEvents = newLoggedEvents;
    component.ngOnChanges({
      loggedEvents: new SimpleChange(null, newLoggedEvents, true)
    });
    fixture.detectChanges();

    const updatedCalculatedDeliberationTimer = component.deliberationTimerInMinutes;

    expect(firstCalculatedDeliberationTimer).not.toBe(updatedCalculatedDeliberationTimer);
  });
});
