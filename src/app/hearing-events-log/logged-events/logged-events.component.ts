import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {
  HearingPersonDetails,
  EventDefinition,
  EventLog,
  EventLogView,
  EventLogCountInfo
} from '../../core';
import { HearingEventsLogService } from '../core/services/hearing-events-log.service';
import {
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkLinkDirective,
  PdkBorderColorDirective,
  PdkPaddingDirective,
  PdkFormComponent,
  PdkTextColorDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkFoldableTextComponent
} from '@cpp/pdk';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventSelectorComponent } from '../event-selector/event-selector.component';
import { TranslatePipe } from '@ngx-translate/core';
import { SortLoggedEventsPipe } from '../core/pipes/sort-logged-events.pipe';

@Component({
  selector: 'logged-events',
  templateUrl: './logged-events.component.html',
  styleUrls: ['./logged-events.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkLinkDirective,
    PdkBorderColorDirective,
    PdkPaddingDirective,
    FormsModule,
    PdkFormComponent,
    EventSelectorComponent,
    PdkTextColorDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkFoldableTextComponent,
    DatePipe,
    TranslatePipe,
    SortLoggedEventsPipe
  ]
})
export class LoggedEventsComponent implements OnChanges {
  @Input() time: Date;
  @Input() eventDefinitions: EventDefinition[];
  @Input() loggedEvents: EventLog[];
  @Input() hearingDefendants: HearingPersonDetails[];
  @Input() hearingDefenceCounsels: HearingPersonDetails[];
  @Input() witnessNames: string[];
  @Input() selectedHearingDate: string;
  @Input() isHearingEventLogPaused: boolean;
  @Input() isHearingEventLogEnded: boolean;
  @Input() jurisdictionType: string;
  @Input() hearingEventLogCount: EventLogCountInfo;

  @Output() eventSelected: EventEmitter<EventLog> = new EventEmitter<EventLog>();
  @Output() changeEvent: EventEmitter<EventLog> = new EventEmitter<EventLog>();
  @Output() addDefenceWitness: EventEmitter<void> = new EventEmitter<void>();
  @Output() downloadTodayEventLog: EventEmitter<void> = new EventEmitter<void>();
  @Output() downloadFullEventLog: EventEmitter<void> = new EventEmitter<void>();

  events: EventLogView[];

  constructor(readonly hearingEventsLogService: HearingEventsLogService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.loggedEvents) {
      this.events = [...this.loggedEvents.map(event => ({ ...event, expanded: false }))];
    }
  }

  selectEvent(eventDefinition: EventDefinition) {
    const eventLog: EventLog = this.hearingEventsLogService.buildEventLog(
      eventDefinition,
      this.time,
      this.selectedHearingDate
    );
    this.eventSelected.emit(eventLog);
  }

  onChangeEvent(event: EventLog) {
    this.changeEvent.emit(event);
  }

  onAddDefenceWitness() {
    this.addDefenceWitness.emit();
  }

  onDownloadTodayEventLog() {
    this.downloadTodayEventLog.emit();
  }

  onDownloadFullEventLog() {
    this.downloadFullEventLog.emit();
  }

  toggleExpandNotes() {
    const isAnyNoteCollapsed = this.isAnyNoteCollapsed();

    if (isAnyNoteCollapsed) {
      this.events.forEach(event => (event.expanded = true));
    } else {
      this.events.forEach(event => (event.expanded = false));
    }
  }

  isAnyNoteCollapsed() {
    return this.events.some(event => event.overflow && !event.expanded);
  }

  isAnyNotesExpandable() {
    return this.events.some(event => event.overflow);
  }

  get isCrownCourt(): boolean {
    return this.jurisdictionType === 'CROWN';
  }
}
