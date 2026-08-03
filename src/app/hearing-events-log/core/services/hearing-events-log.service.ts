import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { CPPDate, getCPPDate, EventLog, EventDefinition } from '../../../core';

@Injectable({
  providedIn: 'root'
})
export class HearingEventsLogService {
  private cppDateUtil: CPPDate;

  constructor() {
    this.cppDateUtil = getCPPDate();
  }

  buildEventLog(
    eventDefinition: EventDefinition,
    time: Date,
    selectedHearingDate: string,
    note?: string
  ): EventLog {
    const currentDate = this.cppDateUtil.getCurrentDate();
    return {
      hearingEventId: uuid(),
      hearingEventDefinitionId: eventDefinition.id,
      alterable: eventDefinition.alterable,
      recordedLabel: eventDefinition.recordedLabel,
      eventTime: this.cppDateUtil.toUtcISO(
        this.cppDateUtil.combine(new Date(selectedHearingDate), time)
      ),
      lastModifiedTime: this.cppDateUtil.toUtcISO(currentDate),
      note
    };
  }

  transformEventForUpdate(
    hearingEventDefinitionId: string,
    recordedLabel: string,
    time: string,
    note?: string
  ): EventLog {
    const currentDate = this.cppDateUtil.getCurrentDate();
    const localDate = this.cppDateUtil.localDate(currentDate);
    return {
      latestHearingEventId: uuid(),
      eventTime: time,
      hearingEventDefinitionId,
      lastModifiedTime: this.cppDateUtil.toUtcISO(localDate),
      recordedLabel,
      note
    };
  }

  sortLoggedEvents(events: EventLog[]): EventLog[] {
    const clonedEvents = [...events];
    return clonedEvents.sort((a, b) => (b.eventTime > a.eventTime ? 1 : -1));
  }
}
