import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { EventLog, EventLogCountInfo } from '../../core';
import { JurisdictionTypes } from '../core/models/jurisdiction-types';
import {
  PdkMarginDirective,
  PdkLinkDirective,
  PdkTypographyDirective,
  PdkTextColorDirective,
  PdkBorderColorDirective,
  PdkPaddingDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'suggested-events',
  templateUrl: 'suggested-events.components.html',
  styleUrls: ['./suggested-events.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkMarginDirective,
    PdkLinkDirective,
    PdkTypographyDirective,
    PdkTextColorDirective,
    PdkBorderColorDirective,
    PdkPaddingDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ]
})
export class SuggestedEventsComponent {
  @Input() loggedEvents: EventLog[];
  @Input() isHearingEventLogPaused: boolean;
  @Input() isHearingEventLogEnded: boolean;
  @Input() showStartLogBtn: boolean;
  @Input() showResumeLogBtn: boolean;
  @Input() showChangeTypeLink: boolean;
  @Input() jurisdictionType: string;
  @Input() isBoxwork: boolean;
  @Input() hearingEventLogCount: EventLogCountInfo;

  @Output() eventSelected: EventEmitter<string> = new EventEmitter<string>();
  @Output() changeHearingType: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() downloadFullEventLog: EventEmitter<void> = new EventEmitter<void>();

  constructor() {}

  onStartHearing() {
    this.eventSelected.emit('Start');
  }

  onPauseHearing() {
    this.eventSelected.emit('Pause');
  }

  onResumeHearing() {
    this.eventSelected.emit('Resume');
  }

  onEndHearing() {
    this.eventSelected.emit('End');
  }

  onChangeType() {
    this.changeHearingType.emit(true);
  }

  onDownloadFullEventLog() {
    this.downloadFullEventLog.emit();
  }

  get isCrownCourt(): boolean {
    return this.jurisdictionType === JurisdictionTypes.CROWN;
  }
}
