import { Component, Input, OnChanges } from '@angular/core';
import { IntermediaryCounsel, IntermediaryType } from '../../../../core';
import {
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkTextColorDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';

import { TranslatePipe } from '@ngx-translate/core';
import { FullNamePipe } from '../../../../shared/pipes/full-name.pipe';

@Component({
  selector: 'intermediary-attendees',
  templateUrl: './intermediary-attendees.component.html',
  styles: [
    `
      ul {
        padding: 0;
        list-style: none;
      }

      dd,
      dl,
      dt {
        margin: 0;
      }
    `
  ],
  imports: [
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkTextColorDirective,
    PdkVisuallyHiddenDirective,
    TranslatePipe,
    FullNamePipe
  ]
})
export class IntermediaryAttendeesComponent implements OnChanges {
  @Input() intermediariesCounsel: IntermediaryCounsel[];
  interpreterAttendees: IntermediaryCounsel[] = [];
  intermediaryAttendees: IntermediaryCounsel[] = [];

  get showIntermediaries(): boolean {
    if (this.intermediaryAttendees && this.intermediaryAttendees.length > 0) {
      return true;
    }
    return false;
  }

  get showInterpreters(): boolean {
    if (this.interpreterAttendees && this.interpreterAttendees.length > 0) {
      return true;
    }
    return false;
  }

  ngOnChanges(): void {
    this.updateAttendees();
  }

  private updateAttendees(): void {
    const counsels = this.intermediariesCounsel || [];
    this.interpreterAttendees = counsels.filter(ip => ip.role === IntermediaryType.INTERPRETER);
    this.intermediaryAttendees = counsels.filter(ip => ip.role === IntermediaryType.INTERMEDIARY);
  }
}
