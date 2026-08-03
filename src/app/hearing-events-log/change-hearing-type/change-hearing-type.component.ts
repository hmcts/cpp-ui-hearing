import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HearingType } from '@cpp/reference-data';
import {
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkLinkDirective,
  PdkFormComponent,
  PdkFormGroupComponent,
  PdkFormGroupDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { HearingTypeSelectorComponent } from '../hearing-type-selector/hearing-type-selector.component';
import { EventNoteComponent } from '../event-note/event-note.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'change-hearing-type',
  templateUrl: './change-hearing-type.component.html',
  styleUrls: ['./change-hearing-type.component.scss'],
  imports: [
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkLinkDirective,
    FormsModule,
    PdkFormComponent,
    HearingTypeSelectorComponent,
    EventNoteComponent,
    PdkFormGroupComponent,
    PdkFormGroupDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ]
})
export class ChangeHearingTypeComponent {
  @Input() hearingTypes: HearingType[];
  @Output() onChangeHearingType: EventEmitter<{
    hearingType: HearingType;
    eventNote: string;
  }> = new EventEmitter();
  @Output() cancel: EventEmitter<boolean> = new EventEmitter<boolean>();
  selectedHearingType: HearingType;
  eventNote = '';
  eventNoteCharacterLimit = 3000;

  back() {
    this.cancel.emit(true);
  }

  submit() {
    if (this.selectedHearingType !== null || this.selectedHearingType !== undefined) {
      this.onChangeHearingType.emit({
        hearingType: this.selectedHearingType,
        eventNote: this.eventNote
      });
    }
  }
}
