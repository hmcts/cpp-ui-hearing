import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import {
  HearingPersonDetails,
  EventLog,
  EventDefinition,
  CustomAutosuggestSection
} from '../../core';
import { PopulateEventDefinitionsPipe } from '../core/pipes';

import {
  PdkFormFieldComponent,
  PdkAutosuggestComponent,
  PdkTypographyDirective,
  PdkTextColorDirective,
  PdkMarginDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'event-selector',
  template: `
    <pdk-form-field
      label="Event definition"
      labelType="none"
      [errorMessages]="[
        {
          rule: 'required',
          message: 'HEARING_EVENTS_LOG.INVALID_EVENT.EVENT_TYPE_REQUIRED' | translate,
        },
      ]"
    >
      <pdk-autosuggest
        name="hearing-event-log-selector"
        data-role="hearing-event-log-selector"
        required
        highlightColor="blue"
        [mapSuggestionToKey]="getKey"
        [mapSuggestionToLabel]="getLabel"
        (inputText)="handleInputText($event)"
        [sections]="eventSections"
        [suggestionTemplateRef]="suggestionTemplateRef"
        [sectionTitleTemplateRef]="sectionTitleTemplateRef"
        [ngModel]="selectedEvent"
        (ngModelChange)="selectEventDefinition($event)"
      >
      </pdk-autosuggest>

      <ng-template #suggestionTemplateRef let-highlighted="highlighted" let-suggestion="suggestion">
        <span
          pdk-typography="body-small"
          [pdk-text-colour]="getTitleTextColour(highlighted)"
          [innerHtml]="getMatchedTitle(suggestion)"
        ></span>
      </ng-template>

      <ng-template #sectionTitleTemplateRef let-section="section">
        <span
          [pdk-margin-top]="!section.first ? 6 : 1"
          pdk-typography="heading-small"
          pdk-margin-bottom="1"
          [innerHtml]="section.title || ''"
        ></span>
      </ng-template>
    </pdk-form-field>
  `,
  imports: [
    PdkFormFieldComponent,
    PdkAutosuggestComponent,
    FormsModule,
    PdkTypographyDirective,
    PdkTextColorDirective,
    PdkMarginDirective,
    TranslatePipe
  ],
  providers: [PopulateEventDefinitionsPipe]
})
export class EventSelectorComponent implements OnChanges {
  @Input() event: EventLog;
  @Input() eventDefinitions: EventDefinition[];
  @Input() hearingDefendants: HearingPersonDetails[];
  @Input() hearingDefenceCounsels: HearingPersonDetails[];
  @Input() witnessNames: string[];
  @Input() resetAfterSelect = false;
  @Input() isHearingEventLogPaused: boolean;

  @Output() eventSelected: EventEmitter<EventDefinition> = new EventEmitter();

  events: EventDefinition[] = [];
  selectedEvent: EventDefinition;
  error = '';
  eventSections: CustomAutosuggestSection<EventDefinition>[] = [];
  inputValue: string;
  readonly FILTERED_EVENT_MAX_COUNT = 100;

  constructor(readonly populateEventDefinitionsPipe: PopulateEventDefinitionsPipe) {}

  selectEventDefinition(event: EventDefinition) {
    if (event !== null) {
      this.selectedEvent = event;
      this.eventSelected.emit(this.selectedEvent);

      if (this.resetAfterSelect) {
        this.selectedEvent = this.events[this.events.length - 1];
      }

      this.error = '';
    }
  }

  ngOnChanges() {
    this.events = this.populateEventDefinitionsPipe.transform(
      this.eventDefinitions || [],
      this.hearingDefendants,
      this.hearingDefenceCounsels,
      this.witnessNames
    );

    if (this.event) {
      this.selectedEvent = this.events.find(ed =>
        this.event.recordedLabel.includes(ed.recordedLabel)
      );
    }
  }

  validateEvent(): boolean {
    if (!this.selectedEvent || !this.selectedEvent.recordedLabel) {
      this.error = 'EVENT_TYPE_REQUIRED';
    } else if (this.selectedEvent && this.selectedEvent.recordedLabel) {
      this.error =
        this.events.map(ed => ed.recordedLabel).indexOf(this.selectedEvent.recordedLabel) > -1
          ? ''
          : 'EVENT_TYPE_REQUIRED';
    }
    return this.error === '';
  }

  onSubmit() {
    this.validateEvent();
  }

  getKey(event: EventDefinition) {
    return event.id;
  }

  getLabel(event: EventDefinition) {
    return event.actionLabel;
  }

  getTitleTextColour(highlighted: boolean) {
    return highlighted ? 'white' : 'black';
  }

  getMatchedTitle = (suggestion: EventDefinition): string => {
    const label = this.getLabel(suggestion);
    if (this.inputValue.length > 0) {
      const offset = this.inputValue.length;
      const idx = label.toLowerCase().indexOf(this.inputValue.toLowerCase());

      if (idx !== -1) {
        return (
          `${label.substring(0, idx)}<b>${label.substring(idx, idx + offset)}</b>` +
          `${label.substring(idx + offset)}`
        );
      }
    }
    return label;
  };

  groupEventsIntoSections(events: EventDefinition[]): CustomAutosuggestSection<EventDefinition>[] {
    const eventsInSections = events.reduce(
      (sections: CustomAutosuggestSection<EventDefinition>[], event) => {
        const { groupLabel } = event;
        const foundIndex = sections.findIndex(({ title }) => title === groupLabel);
        if (foundIndex > -1) {
          sections[foundIndex].suggestions = [...sections[foundIndex].suggestions, event];
          return sections;
        }
        return [...sections, { title: groupLabel, suggestions: [event] }];
      },
      [] as CustomAutosuggestSection<EventDefinition>[]
    );

    eventsInSections.forEach((section, index) =>
      index === 0 ? (section.first = true) : (section.first = false)
    );

    return eventsInSections;
  }

  handleInputText(event: string) {
    this.selectedEvent = null;
    this.inputValue = event;

    const filteredEvents = event
      ? this.events.filter(({ actionLabel }) =>
          actionLabel.toLowerCase().includes(event.toLowerCase().trim())
        )
      : [];

    this.eventSections =
      this.groupEventsIntoSections(filteredEvents.slice(0, this.FILTERED_EVENT_MAX_COUNT)) || [];
  }
}
