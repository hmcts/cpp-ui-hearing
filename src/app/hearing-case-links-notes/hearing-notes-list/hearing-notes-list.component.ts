import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { groupBy } from 'lodash-es';
import { HearingCaseNotes, getCPPDate } from '../../core';
import { HearingNotesListItemComponent } from './hearing-note-list-item/hearing-notes-list-item.component';

@Component({
  selector: 'hearing-note-list',
  templateUrl: 'hearing-notes-list.component.html',
  styleUrls: ['./hearing-notes-list.component.scss'],
  imports: [HearingNotesListItemComponent]
})
export class HearingNotesListComponent implements OnChanges {
  displayNotes: HearingCaseNotes[] = [];
  @Input() sharedHearing: boolean;
  @Input() multiHearing: boolean;
  @Input() selectedHearingDate: string;
  @Input() notes: HearingCaseNotes[];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.notes && changes.notes.currentValue && changes.notes.currentValue.length) {
      this.resolveDisplayNotes(changes.notes.currentValue);
      this.cdr.detectChanges();
    }
    if (changes.sharedHearing) {
      this.resolveDisplayNotes(this.displayNotes);
      this.cdr.detectChanges();
    }
  }

  private resolveDisplayNotes(changedNotes: HearingCaseNotes[]) {
    if (this.sharedHearing && !this.multiHearing) {
      this.displayNotes = [this.notes[0]];
    }
    if (this.multiHearing) {
      const notes = this.getLatestNotePerDay(this.groupNotesByDay(changedNotes));
      this.sharedHearing ? (this.displayNotes = notes) : this.resolveMultiHearingDayNotes(notes);
    }
  }

  private resolveMultiHearingDayNotes(notes: HearingCaseNotes[]) {
    this.displayNotes = notes.filter(
      n => new Date(n.noteDateTime).getTime() < new Date(this.selectedHearingDate).getTime()
    );
  }

  private groupNotesByDay(notes: HearingCaseNotes[]) {
    return groupBy(notes, note => {
      const cppDateUtil = getCPPDate();
      const localDate = cppDateUtil.localDate(note.noteDateTime);
      const startOfDate = cppDateUtil.startOf(localDate, 'day');

      return cppDateUtil.format(startOfDate, cppDateUtil.UK_DATE_FORMAT);
    });
  }

  private getLatestNotePerDay(byDay: Record<string, HearingCaseNotes[]>) {
    const latestByDay: HearingCaseNotes[] = [];
    Object.keys(byDay).forEach(d => {
      latestByDay.push(byDay[d][0]);
    });
    return latestByDay;
  }
}
