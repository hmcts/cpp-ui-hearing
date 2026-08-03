import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { HearingDetail, ProsecutionCaseDetails } from '../../core/model/HearingDetail';
import { isEmpty } from 'lodash-es';
import { CourtApplication, DefendantCasesApplications, Organisation } from '../../core';
import { UpperCasePipe } from '@angular/common';
import {
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkPaddingDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkFillColorDirective
} from '@cpp/pdk';
import { CaseMarkersComponent } from './case-markers/case-markers.component';
import { OffencesListComponent } from './offences-list/offences-list.component';
import { ApplicationOverviewComponent } from './application-overview/application-overview.component';
import { TranslatePipe } from '@ngx-translate/core';
import { CPPDatePipe } from '../../shared/pipes/cpp-date.pipe';

@Component({
  selector: 'defendant-details-panel',
  templateUrl: './defendant-details-panel.component.html',
  styleUrls: ['./defendant-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkMarginDirective,
    PdkTypographyDirective,
    CaseMarkersComponent,
    PdkPaddingDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkFillColorDirective,
    OffencesListComponent,
    ApplicationOverviewComponent,
    UpperCasePipe,
    TranslatePipe,
    CPPDatePipe
  ],
  providers: [BsModalService]
})
export class DefendantDetailsPanelComponent {
  @Input() defendant: DefendantCasesApplications;
  @Input() reason: string;
  @Input() applicationsCourt: CourtApplication[];
  @Input() reportingRestrictionReason: string;
  @Input() isStandAloneApplication: boolean;
  @Input() hearing: HearingDetail;
  @Output() onViewApplication: EventEmitter<CourtApplication> = new EventEmitter();
  @Output() onGoToCaseMarkers: EventEmitter<string> = new EventEmitter();
  modalRef: BsModalRef;

  constructor(private modalService: BsModalService) {}

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  goToCaseMarker(caseId: string) {
    this.onGoToCaseMarkers.emit(caseId);
  }

  viewApplication(applicationCourt: CourtApplication) {
    this.onViewApplication.emit(applicationCourt);
  }

  caseMarkers(prosecutionCase: Partial<ProsecutionCaseDetails>) {
    const caseMarkersText: string[] = [];
    if (prosecutionCase.caseMarkers) {
      prosecutionCase.caseMarkers.forEach(m => caseMarkersText.push(m.markerTypeDescription));
    }
    return caseMarkersText.filter(function (item, pos) {
      return caseMarkersText.indexOf(item) === pos;
    });
  }

  isEmpty(object: { organisation: Organisation }) {
    return isEmpty(object);
  }

  get isBulkDefendant() {
    return this.defendant && this.defendant.prosecutionCases
      ? this.defendant.prosecutionCases.some(kase => !!kase.isGroupMaster)
      : false;
  }
}
