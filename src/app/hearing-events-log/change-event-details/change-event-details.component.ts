import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { HearingEventsLogService } from '../core/services/hearing-events-log.service';
import {
  HearingPersonDetails,
  EventLog,
  EventDefinition,
  CPPDate,
  getCPPDate,
  EventLogView
} from '../../core';
import { EventSelectorComponent } from '../event-selector/event-selector.component';
import { HearingType } from '@cpp/reference-data';
import {
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkTypographyDirective,
  PdkLinkDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkTimeInputComponent,
  PdkFieldsetComponent,
  PdkFieldsetLegendDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { HearingEventLogTimeValidator } from '../core/validators/hearing-event-log-time.validator';

import { EventNoteComponent } from '../event-note/event-note.component';
import { HearingTypeSelectorComponent } from '../hearing-type-selector/hearing-type-selector.component';
import { TranslatePipe } from '@ngx-translate/core';
import { PopulateEventDefinitionsPipe } from '../core/pipes/populate-event-definitions.pipe';

@Component({
  selector: 'change-event-details',
  templateUrl: './change-event-details.component.html',
  styleUrls: ['./change-event-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkMarginDirective,
    PdkPaddingDirective,
    PdkTypographyDirective,
    PdkLinkDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkTimeInputComponent,
    HearingEventLogTimeValidator,
    PdkFieldsetComponent,
    PdkFieldsetLegendDirective,
    EventSelectorComponent,
    EventNoteComponent,
    HearingTypeSelectorComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ],
  providers: [
    PopulateEventDefinitionsPipe,
    HearingEventsLogService,
    {
      provide: CPPDate,
      useFactory: getCPPDate
    }
  ]
})
export class ChangeEventDetailsComponent implements OnInit {
  @Input() event: EventLogView;
  @Input() loggedEvents: EventLog[];
  @Input() currentDate: string;
  @Input() eventDefinitions: EventDefinition[];
  @Input() hearingDefendants: HearingPersonDetails[];
  @Input() hearingDefenceCounsels: HearingPersonDetails[];
  @Input() witnessNames: string[];
  @Input() hearingTypes: HearingType[];
  @Input() jurisdictionType: string;

  @Output() eventChanged: EventEmitter<{
    hearingEventId: string;
    event: EventLog;
  }> = new EventEmitter<{ hearingEventId: string; event: EventLog }>();
  @Output() eventCreated: EventEmitter<{
    hearingEventId: string;
    event: EventLog;
  }> = new EventEmitter<{ hearingEventId: string; event: EventLog }>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('eventSelector') eventSelector: EventSelectorComponent;

  private readonly HEARING_TYPE_CHANGED = 'Hearing type changed to';
  cppDateUtil: CPPDate;
  time: string;
  eventNote = '';
  recordedLabel: string;
  hearingEventDefinitionId: string;
  filteredSuggestions: HearingType[] = [];
  showChangeHearingType = false;
  selectedHearingType: HearingType;
  eventNoteCharacterLimit = 3000;

  formattedTime: string;
  eventTimeAutoShift = false;
  constructor(readonly hearingEventsLogService: HearingEventsLogService) {
    this.cppDateUtil = getCPPDate();
  }

  get isCrownCourt() {
    return this.jurisdictionType === 'CROWN';
  }

  ngOnInit() {
    this.time = this.event.eventTime;
    this.recordedLabel = this.event.recordedLabel;
    this.eventNote = this.event.note || '';
    this.hearingEventDefinitionId = this.event.hearingEventDefinitionId;
    this.showChangeHearingType = this.isChangeHearingTypeEvent(this.event.recordedLabel);
    if (this.showChangeHearingType) {
      this.selectedHearingType = this.getMappedHearingType(
        this.event.recordedLabel,
        this.hearingTypes
      );
    }
    this.formattedTime = this.formatTimeFromDateTime(this.time);
  }

  eventTimeFocused(): void {
    if (!this.eventTimeAutoShift) {
      this.eventTimeAutoShift = true;
    }
  }
  formatTimeFromDateTime(datetime: string): string {
    const date = this.cppDateUtil.localDate(datetime);
    return this.cppDateUtil.format(date, 'HH:mm');
  }

  isChangeHearingTypeEvent(label: string) {
    return label.includes(this.HEARING_TYPE_CHANGED);
  }

  getMappedHearingType(eventLabel: string, hearingTypes: HearingType[]) {
    const hearingTypeDescripition = eventLabel.replace(
      new RegExp(`${this.HEARING_TYPE_CHANGED} `),
      ''
    );
    return hearingTypes.find(ht => ht.hearingDescription === hearingTypeDescripition);
  }

  onSave() {
    let eventLog;
    const validEvent =
      this.event.alterable && this.isCrownCourt ? this.eventSelector.validateEvent() : true;

    eventLog = this.hearingEventsLogService.transformEventForUpdate(
      this.hearingEventDefinitionId,
      this.recordedLabel,
      this.time,
      this.eventNote
    );

    if (validEvent && this.eventNote.length <= this.eventNoteCharacterLimit) {
      if (this.event.isCreate) {
        this.eventCreated.emit({
          hearingEventId: this.event.hearingEventId,
          event: { ...eventLog, alterable: this.event.alterable }
        });
      } else {
        this.eventChanged.emit({
          hearingEventId: this.event.hearingEventId,
          event: { ...eventLog, alterable: this.event.alterable }
        });
      }
    }
  }

  selectEvent(event: EventDefinition) {
    this.showChangeHearingType = this.isChangeHearingTypeEvent(event.recordedLabel);
    this.selectedHearingType = null;
    this.recordedLabel = event.recordedLabel;
    this.hearingEventDefinitionId = event.id;
  }

  updateEventTime(updatedTime: string) {
    this.time = this.cppDateUtil.combineTimeToIso(this.event.eventTime, updatedTime);
  }

  onCancel() {
    this.cancel.emit();
  }

  selectHearingType(formValue: HearingType) {
    if (formValue && formValue.hearingDescription) {
      this.recordedLabel = `${this.HEARING_TYPE_CHANGED} ${formValue.hearingDescription}`;
    }
  }
}
