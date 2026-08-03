import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'lodash-es';
import { v4 as uuid } from 'uuid';
import {
  AppState,
  SaveHearingCaseNoteAction,
  HearingCaseNotes,
  HearingDetail,
  HearingCaseLink,
  ProsecutionCaseDetails
} from '../core';
import { PdkTabs, PdkDividerComponent } from '@cpp/pdk';
import { HearingCaseLinksComponent } from './hearing-case-links/hearing-case-links.component';
import { HearingNoteTextComponent } from './hearing-note-text/hearing-note-text.component';
import { HearingNotesListComponent } from './hearing-notes-list/hearing-notes-list.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'hearing-case-links-notes',
  templateUrl: './hearing-case-links-notes.component.html',
  styleUrls: ['./hearing-case-links-notes.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    PdkTabs,
    HearingCaseLinksComponent,
    HearingNoteTextComponent,
    HearingNotesListComponent,
    PdkDividerComponent,
    TranslatePipe
  ]
})
export class HearingCaseLinksNotesComponent implements OnInit {
  @Input() hearing: HearingDetail;
  @Input() hearingNotes: HearingCaseNotes[];
  @Input() selectedHearingDate: string;
  @Input() isStandAloneApplication: boolean;
  @Input() canAddChildApplication = false;

  @Output() onGoToCaseLink: EventEmitter<HearingCaseLink> = new EventEmitter();
  @Output() onGoToCreateTask = new EventEmitter<{ caseUrn: string; courtCentreId: string }>();

  prosecutionCasesWithoutBulkCases: ProsecutionCaseDetails[];

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    if (this.hearing) {
      this.prosecutionCasesWithoutBulkCases = (this.hearing.prosecutionCases || []).filter(
        kase => !kase.isGroupMaster
      );
    }
  }

  saveNote(noteText: string): void {
    if (this.hearing && this.hearing.prosecutionCases?.length > 0) {
      const hearingCaseNote = {
        id: uuid(),
        originatingHearingId: this.hearing.id,
        courtClerk: {
          userId: '',
          firstName: '',
          lastName: ''
        },
        prosecutionCases: map(this.hearing.prosecutionCases, 'id'),
        noteDateTime: '',
        noteType: 'HMCTS',
        note: noteText
      };
      this.store.dispatch(new SaveHearingCaseNoteAction(hearingCaseNote));
    }
  }

  goToCaseLink(hearingCaseLink: HearingCaseLink): void {
    this.onGoToCaseLink.emit(hearingCaseLink);
  }

  goToCreateTask(caseUrn: string): void {
    const courtCentreId = this.hearing.courtCentre.id;
    this.onGoToCreateTask.emit({ caseUrn, courtCentreId });
  }
}
