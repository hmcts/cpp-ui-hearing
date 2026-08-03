import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CourtApplication } from '../../../core';

import { DatePipe } from '@angular/common';
import {
  PdkBorderColorDirective,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkTextColorDirective
} from '@cpp/pdk';
import { OffencesListItemComponent } from '../offences-list/offences-list-item/offences-list-item.component';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationPartyNamePipe } from '../../../shared/pipes/application-party-name.pipe';
import { ApplicationPartiesPipe } from '../../../shared/pipes/application-parties.pipe';

@Component({
  selector: 'application-overview',
  templateUrl: './application-overview.component.html',
  styles: [
    `
      .border {
        border: 0;
        border-top: 1px solid;
        height: 1px;
        display: block;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkBorderColorDirective,
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkTextColorDirective,
    OffencesListItemComponent,
    DatePipe,
    TranslatePipe,
    ApplicationPartyNamePipe,
    ApplicationPartiesPipe
  ]
})
export class ApplicationOverviewComponent {
  @Input() applicationCourt: CourtApplication;
  @Output() onViewApplication: EventEmitter<CourtApplication> = new EventEmitter();

  viewApplication(): void {
    this.onViewApplication.emit(this.applicationCourt);
  }

  get applicantSynonym() {
    return this.applicationCourt.type.applicantAppellantFlag ? 'APPELLANT' : 'APPLICANT';
  }
}
