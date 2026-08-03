import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { HearingCaseNotes } from '../../core';

import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkInputComponent,
  PdkInputDirective,
  PdkTextInputDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkResizeDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'hearing-note-text',
  templateUrl: 'hearing-note-text.component.html',
  styleUrls: ['./hearing-note-text.component.scss'],
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkInputComponent,
    PdkInputDirective,
    PdkTextInputDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkResizeDirective,
    TranslatePipe
  ]
})
export class HearingNoteTextComponent implements OnChanges {
  originalNote: string;
  newNote = '';
  @Input() multiHearing: boolean;
  @Input() sharedHearing: boolean;
  @Input() selectedHearingDate: string;
  @Input() notes: HearingCaseNotes[];
  @Output() onClickSave: EventEmitter<any> = new EventEmitter<any>();

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart && this.originalNote !== this.newNote) {
        this.saveNote();
      }
    });
  }

  saveNote() {
    this.onClickSave.emit(this.newNote);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.notes &&
      changes.notes.currentValue &&
      changes.notes.currentValue.length &&
      changes.notes.currentValue[0].note !== this.originalNote
    ) {
      const note =
        this.multiHearing && this.selectedHearingDate
          ? this.getSameDayNote(changes.notes.currentValue)
          : changes.notes.currentValue[0].note;

      if (note !== this.originalNote) {
        this.newNote = note;
        this.originalNote = this.newNote;
      }
    }
  }

  private getSameDayNote(notes: HearingCaseNotes[]) {
    const filteredNotes = notes.filter(
      n =>
        new Date(this.selectedHearingDate).getFullYear() ===
          new Date(n.noteDateTime).getFullYear() &&
        new Date(this.selectedHearingDate).getMonth() === new Date(n.noteDateTime).getMonth() &&
        new Date(this.selectedHearingDate).getDate() === new Date(n.noteDateTime).getDate()
    );

    return filteredNotes.length > 0 ? filteredNotes[0].note : '';
  }
}
