import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

import {
  Defendant,
  DefenceCounsel,
  CompanyRepresentative,
  HearingDetail,
  ProsecutionCounsel,
  IntermediaryCounsel,
  DefendantCasesApplications,
  ApplicationSubject
} from '../../core';
import { PdkBorderColorDirective, PdkButtonComponent, PdkButtonDirective } from '@cpp/pdk';
import { HeadlineSummaryComponent } from './headline-summary/headline-summary.component';
import { HearingAttendeesComponent } from './hearing-attendees/hearing-attendees.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'hearing-details-panel',
  templateUrl: './hearing-details-panel.component.html',
  styleUrls: ['./hearing-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkBorderColorDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    HeadlineSummaryComponent,
    HearingAttendeesComponent,
    TranslatePipe
  ]
})
export class HearingDetailsPanelComponent {
  @Input() activeSubjectId: ApplicationSubject | null;
  @Input() applicationSubjects: ApplicationSubject[];
  @Input() activeDefendant: Defendant;
  @Input() changeJudiciaryLink: string;
  @Input() defenceCounsels: DefenceCounsel[];
  @Input() companyRepresentatives: CompanyRepresentative[];
  @Input() hearing: HearingDetail;
  @Input() hearingCasesCount: number;
  @Input() isStandAloneApplication: boolean;
  @Input() prosecutionCounsels: ProsecutionCounsel[];
  @Input() intermediariesCounsel: IntermediaryCounsel[];
  @Input() casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[];

  @Output() onDefendantSelected: EventEmitter<Defendant> = new EventEmitter();
  @Output() onGoToHearing: EventEmitter<void> = new EventEmitter();
  @Output() onGoToHearingResults: EventEmitter<void> = new EventEmitter();
  @Output() onGoToAddCounsels: EventEmitter<void> = new EventEmitter();
  @Output() onGoToCaseDetails: EventEmitter<string> = new EventEmitter();
  @Output() onSubjectSelected: EventEmitter<ApplicationSubject> = new EventEmitter();

  goToHearing() {
    this.hasBulkCase ? this.onGoToHearingResults.emit() : this.onGoToHearing.emit();
  }

  goToCaseDetails(id: string) {
    this.onGoToCaseDetails.emit(id);
  }

  goToAddCounsels() {
    this.onGoToAddCounsels.emit();
  }

  defendantSelected(defendant: Defendant) {
    this.onDefendantSelected.emit(defendant);
  }

  get hasBulkCase() {
    return (
      this.hearing &&
      this.hearing.prosecutionCases &&
      this.hearing.prosecutionCases.some(kase => !!kase.isGroupMaster)
    );
  }
}
