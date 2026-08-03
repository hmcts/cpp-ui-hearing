import { Directive, forwardRef, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator, ValidationErrors } from '@angular/forms';
import { CPPDate, EventLog } from '../../../core';

@Directive({
  selector: '[validateHearingEventLogTime]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HearingEventLogTimeValidator),
      multi: true
    }
  ]
})
export class HearingEventLogTimeValidator implements Validator {
  constructor(private cppDateUtil: CPPDate) {}

  @Input('validateHearingEventLogTime') validationParams: {
    eventLog: EventLog;
    loggedEvents: EventLog[];
  };

  validate(control: AbstractControl): ValidationErrors | null {
    if (
      !control.value ||
      !this.validationParams?.eventLog ||
      !this.validationParams?.loggedEvents
    ) {
      return null;
    }

    const controlName = this.getControlName(control);
    const { eventLog, loggedEvents } = this.validationParams;

    const eventNewDateTime = this.cppDateUtil.localDate(
      this.cppDateUtil.combineTimeToIso(eventLog.eventTime, control.value)
    );

    const updatedEventLog: EventLog = { ...eventLog, eventTime: eventNewDateTime.toISOString() };
    const currentDate = this.cppDateUtil.getCurrentDate();

    if (this.cppDateUtil.isAfter(eventNewDateTime, currentDate)) {
      return { timeInFuture: { [controlName]: true } };
    }

    const lastEvent = loggedEvents[loggedEvents.length - 1];
    if (lastEvent) {
      const compareResult = this.compareEvents(updatedEventLog, lastEvent);
      if ((compareResult === -1 || compareResult === 0) && !this.isStartEvent(updatedEventLog)) {
        return { timeBeforeStart: { [controlName]: true } };
      }
    }

    const { previous, next } = this.getPreviousAndNextEvent(updatedEventLog, loggedEvents);
    if (next && this.isEndEvent(updatedEventLog) && loggedEvents.length > 1) {
      const nextEventTime = this.cppDateUtil.localDate(next.eventTime);
      if (
        this.cppDateUtil.isBefore(eventNewDateTime, nextEventTime) ||
        this.cppDateUtil.isSame(eventNewDateTime, nextEventTime)
      ) {
        return { endEventLastEvent: { [controlName]: true } };
      }
    }

    if (previous && this.isStartEvent(updatedEventLog) && loggedEvents.length > 1) {
      const eventAfterStart = loggedEvents[loggedEvents.length - 2];
      const eventAfterStartTime = this.cppDateUtil.localDate(eventAfterStart.eventTime);
      if (this.cppDateUtil.isAfter(eventNewDateTime, eventAfterStartTime)) {
        return { startEventFirstEvent: { [controlName]: true } };
      }
    }

    if (previous && this.isPauseEvent(previous) && !this.isResumeEvent(updatedEventLog)) {
      return { pauseNotResume: { [controlName]: true } };
    }

    if (
      previous &&
      this.isEndEvent(previous) &&
      this.cppDateUtil.isAfter(eventNewDateTime, this.cppDateUtil.localDate(previous.eventTime))
    ) {
      return { afterEnd: { [controlName]: true } };
    }

    if (previous && this.isStartEvent(previous) && !this.isStartEvent(updatedEventLog)) {
      const previousEventTime = this.cppDateUtil.localDate(previous.eventTime);
      if (this.cppDateUtil.isBefore(eventNewDateTime, previousEventTime)) {
        return { timeBeforeStart: { [controlName]: true } };
      }
    }

    return null;
  }

  private getControlName(c: AbstractControl): string | null {
    const formGroup = c.parent?.controls as Record<string, AbstractControl>;
    if (!formGroup) {
      return null;
    }
    return Object.keys(formGroup).find(name => c === formGroup[name]) || null;
  }

  private isStartEvent(event: EventLog): boolean {
    return event.recordedLabel === 'Hearing started';
  }

  private isPauseEvent(event: EventLog): boolean {
    return event.recordedLabel === 'Hearing paused';
  }

  private isResumeEvent(event: EventLog): boolean {
    return event.recordedLabel === 'Hearing resumed';
  }

  private isEndEvent(event: EventLog): boolean {
    return event.recordedLabel === 'Hearing ended';
  }

  private compareEvents(eventA: EventLog, eventB: EventLog): number {
    const localDateEventA = this.cppDateUtil.localDate(eventA.eventTime);
    const localDateEventB = this.cppDateUtil.localDate(eventB.eventTime);
    if (this.cppDateUtil.isBefore(localDateEventA, localDateEventB)) {
      return -1;
    }
    if (this.cppDateUtil.isAfter(localDateEventA, localDateEventB)) {
      return 1;
    }
    return 0;
  }

  private getPreviousAndNextEvent(
    currentEvent: EventLog,
    loggedEvents: EventLog[]
  ): { previous: EventLog | null; next: EventLog | null } {
    const allEvents = [...loggedEvents];
    const existingEventIndex = allEvents.findIndex(
      e => e.hearingEventId === currentEvent.hearingEventId
    );
    if (existingEventIndex !== -1) {
      allEvents[existingEventIndex] = currentEvent;
    } else {
      allEvents.push(currentEvent);
    }

    const sorted = allEvents.sort((a, b) => (b.eventTime > a.eventTime ? 1 : -1));
    const idx = sorted.indexOf(currentEvent);

    const previous = sorted.length - 1 > idx ? sorted[idx + 1] : null;
    const next = idx > 0 ? sorted[idx - 1] : null;

    return { previous, next };
  }
}
