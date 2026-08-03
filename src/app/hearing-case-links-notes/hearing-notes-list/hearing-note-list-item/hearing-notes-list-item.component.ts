import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { HearingCaseNotes } from '../../../core';

import { PdkTypographyDirective } from '@cpp/pdk';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'hearing-note-list-item',
  templateUrl: 'hearing-notes-list-item.component.html',
  styleUrls: ['./hearing-notes-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkTypographyDirective, DatePipe, TranslatePipe]
})
export class HearingNotesListItemComponent {
  constructor(@Inject('Window') private window: Window) {}
  @Input() hearingCaseNote: HearingCaseNotes;
  isCollapsed = true;

  printNote() {
    const winPrint = this.window.open('about:blank', '_new');
    winPrint.document.write(`<title>print case note</title><p>${this.hearingCaseNote.note}</p>`);
    winPrint.document.close();
    winPrint.focus();
    winPrint.print();
    winPrint.close();
  }
}
