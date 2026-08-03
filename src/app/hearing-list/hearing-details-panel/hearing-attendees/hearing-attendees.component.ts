import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Input,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';

import {
  Defendant,
  DefenceCounsel,
  CompanyRepresentative,
  HearingDetail,
  ProsecutionCounsel,
  IntermediaryCounsel,
  DefendantCasesApplications,
  ApplicationSubject,
  ProsecutionCaseDetails
} from '../../../core';
import { AppConfigService } from '../../../config';
import { FullNamePipe } from '../../../shared';

import { PanelItemComponent } from '../../panel-item/panel-item.component';
import { AttendeeComponent } from './attendee/attendee.component';
import {
  PdkDividerComponent,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkLinkDirective,
  PdkTextColorDirective,
  PdkVisuallyHiddenDirective,
  PdkPaddingDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { IntermediaryAttendeesComponent } from './intermediary-attendees/intermediary-attendees.component';
import { JudicialMemberNamePipe } from '@cpp/reference-data';
import { ApplicationPartyNamePipe } from '../../../shared/pipes/application-party-name.pipe';
export interface PeopleListInfo {
  type: string;
  names: string[];
}

@Component({
  selector: 'hearing-attendees',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hearing-attendees.component.html',
  styleUrls: ['./hearing-attendees.component.scss'],
  imports: [
    PanelItemComponent,
    AttendeeComponent,
    PdkDividerComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkLinkDirective,
    TranslatePipe,
    PdkTextColorDirective,
    PdkVisuallyHiddenDirective,
    IntermediaryAttendeesComponent,
    PdkPaddingDirective,
    JudicialMemberNamePipe,
    FullNamePipe,
    ApplicationPartyNamePipe
  ],
  providers: [FullNamePipe, AppConfigService]
})
export class HearingAttendeesComponent implements OnInit, OnChanges {
  @Input() applicationSubjects: ApplicationSubject[];
  @Input() activeSubjectId: string | null;
  @Input() activeDefendant: Defendant;
  @Input() changeJudiciaryLink: string;
  @Input() defenceCounsels: DefenceCounsel[];
  @Input() companyRepresentatives: CompanyRepresentative[];
  @Input() hearing: HearingDetail;
  @Input() isStandAloneApplication: boolean;
  @Input() prosecutionCounsels: ProsecutionCounsel[];
  @Input() intermediariesCounsel: IntermediaryCounsel[];
  @Input() casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[];

  @Output() onDefendantSelected: EventEmitter<Defendant> = new EventEmitter();
  @Output() onGoToAddCounsels: EventEmitter<void> = new EventEmitter();
  @Output() onGoToCaseDetails: EventEmitter<string> = new EventEmitter();
  @Output() onSubjectSelected: EventEmitter<ApplicationSubject> = new EventEmitter();

  private _defendants: Defendant[];

  appUrl: string;
  objectKeys = Object.keys;

  constructor(appConfigService: AppConfigService, private fullNamePipe: FullNamePipe) {
    this.appUrl = appConfigService.getBaseUrl();
  }

  ngOnInit() {
    this.updateHearingData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hearing) {
      this.updateHearingData();
    }
  }

  get defendants() {
    return this._defendants;
  }

  get nonBulkCases(): ProsecutionCaseDetails[] {
    return this.hearing && this.hearing.prosecutionCases
      ? this.hearing.prosecutionCases.filter(kase => !kase.isGroupMaster)
      : [];
  }

  get judges() {
    return this.hearing.judiciary.map(judiciary => judiciary.judicialMember);
  }

  get showDefenceCounsels(): boolean {
    if (this.defenceCounsels && this.defenceCounsels.length > 0) {
      return !!this.defenceCounsels[0].firstName;
    }
    return false;
  }

  get showProsecutionCounsels(): boolean {
    if (this.prosecutionCounsels && this.prosecutionCounsels.length > 0) {
      return !!this.prosecutionCounsels[0].firstName;
    }
    return false;
  }

  get showCompanyRepresentatives(): boolean {
    if (this.companyRepresentatives && this.companyRepresentatives.length > 0) {
      return !!this.companyRepresentatives[0].firstName;
    }
    return false;
  }

  getDefendantName(defendant: DefendantCasesApplications) {
    let defendantName = '';
    if (defendant.personDefendant) {
      defendantName = this.fullNamePipe.transform(defendant.personDefendant.personDetails);
    } else if (defendant.legalEntityDefendant) {
      defendantName = defendant.legalEntityDefendant.organisation.name;
    } else {
      defendantName = defendant.defenceOrganisation.name;
    }

    return defendantName;
  }

  selectDefendant(defendant: Defendant | DefendantCasesApplications) {
    this.onDefendantSelected.emit(defendant as Defendant);
  }

  allHearingDefendants(): Defendant[] {
    return (this.hearing.prosecutionCases || []).reduce(
      (defendants, currentCase) => defendants.concat(currentCase.defendants),
      []
    );
  }

  get applicantSynonym() {
    return this.hearing.courtApplications[0].type.applicantAppellantFlag
      ? 'APPELLANT'
      : 'APPLICANT';
  }

  private updateHearingData() {
    if (!this.isStandAloneApplication) {
      this._defendants = this.allHearingDefendants();
    }
  }

  hasBulkCase(defendantCases: DefendantCasesApplications): boolean {
    return defendantCases && defendantCases.prosecutionCases.some(kase => !!kase.isGroupMaster);
  }

  displayCaseDetails(): boolean {
    return this.hearing && this.hearing.prosecutionCases
      ? !this.isStandAloneApplication &&
          this.hearing.prosecutionCases.some(kase => !kase.isGroupMaster)
      : false;
  }
}
