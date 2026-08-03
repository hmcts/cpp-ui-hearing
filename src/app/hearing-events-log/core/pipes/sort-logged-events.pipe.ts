import { Pipe, PipeTransform } from '@angular/core';
import { HearingEventsLogService } from '../services/hearing-events-log.service';
import { EventLogView } from '../../../core';

@Pipe({ name: 'sortLoggedEvents' })
export class SortLoggedEventsPipe implements PipeTransform {
  constructor(private hearingEventsLogService: HearingEventsLogService) {}

  transform(events: EventLogView[]): EventLogView[] {
    return this.hearingEventsLogService.sortLoggedEvents(events) as EventLogView[];
  }
}
