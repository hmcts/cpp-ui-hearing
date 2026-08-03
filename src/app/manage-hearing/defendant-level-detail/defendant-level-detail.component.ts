import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  AttendanceTypeEnum,
  DefendantCasesApplications,
  HearingDetail,
  TodaysDefendantAttendance,
  toHttpParams
} from './../../core';
import { AppConfigService } from '../../config';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import {
  ValidationError,
  PdkGridComponent,
  PdkGridDirective,
  PdkTypographyDirective,
  PdkBorderColorDirective,
  PdkTextColorDirective,
  PdkMarginDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkCheckboxComponent,
  PdkPaddingDirective,
  PdkVisuallyHiddenDirective,
  PdkLinkDirective,
  PdkDetailsSummary
} from '@cpp/pdk';
import { UpperCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DefendantPresenceComponent } from '../defendant-presence/defendant-presence.component';
import { OneLineAddressComponent } from '../../shared/components/one-line-address/one-line-address.component';
import { AddressPipe } from '../../shared/pipes/address.pipe';
import { AgePipe } from '../../shared/pipes/age.pipe';

export enum DefendantType {
  Applicant = 'applicant',
  Respondent = 'respondents',
  Appellant = 'appellant'
}
export interface extractDefendantFromCourtApplication {
  id: string;
  masterDefendantId: string;
  personDefendant: {};
  prosecutionCases: [];
  defendantAttendance: [];
}

@Component({
  selector: 'defendant-level-detail',
  templateUrl: './defendant-level-detail.component.html',
  styleUrls: ['./defendant-level-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpperCasePipe,
    DatePipe,
    FormsModule,
    TranslatePipe,
    AddressPipe,
    AgePipe,
    PdkGridComponent,
    PdkGridDirective,
    PdkTypographyDirective,
    PdkBorderColorDirective,
    PdkTextColorDirective,
    PdkMarginDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkCheckboxComponent,
    PdkPaddingDirective,
    PdkVisuallyHiddenDirective,
    PdkLinkDirective,
    DefendantPresenceComponent,
    OneLineAddressComponent,
    PdkDetailsSummary
  ]
})
export class DefendantLevelDetailComponent implements OnInit {
  @Input() hearing: HearingDetail;
  @Input() hearingId: string;
  @Input() defendant: any;
  @Input() todayDefendantsAttendance: TodaysDefendantAttendance[];
  @Input() caseStatus: string;
  @Input() selectedHearingDate: string;
  @Input() attendanceErrors?: ValidationError[] | null;
  @Input() hasBulkCase: boolean;
  @Output() onYouthCourtToggle: EventEmitter<string> = new EventEmitter();
  @Output() onPresenceChanged: EventEmitter<any> = new EventEmitter();
  @Output() selectedParticipant: EventEmitter<string> = new EventEmitter();
  isCaseActive: boolean;
  isForApplication: boolean;
  defendantType: DefendantType;
  @Output() onOutstandingFine: EventEmitter<{
    defendantId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }> = new EventEmitter();

  editDefendantType: any;
  participantPresent: any;
  defendantNotPresent: string;
  participantPresenceRequired: string;
  public appUrl: string;
  defendantPresenceFormOpen: {
    defendantId: string;
    day: string;
    value: string;
    showDefendandDetails: boolean;
  }[] = [];
  isAccordionOpen = false;

  constructor(appConfigService: AppConfigService, public translate: TranslateService) {
    this.appUrl = appConfigService.getBaseUrl();
  }

  ngOnInit() {
    this.isCaseActive = !(this.caseStatus === 'INACTIVE');
    this.isForApplication = this.defendant.isForApplication;
    this.isAccordionOpen = (this.attendanceErrors?.length || 0) > 0;
    this.translate.get('MANAGE_HEARING').subscribe(value => {
      if (!this.isCaseActive) {
        this.extractDefendantType(this.defendant);
        if (this.defendantType === DefendantType.Applicant) {
          this.editDefendantType = value['EDIT_APPLICANT'];
          this.participantPresent = value['IS_APPLICANT_PRESENT'];
          this.defendantNotPresent = value['APPLLICANT_PRESENCE_NOT_YET_ENTERED'];
          this.participantPresenceRequired = value['APPLICANT_PRESENCE_REQUIRED'];
        } else if (this.defendantType === DefendantType.Respondent) {
          this.editDefendantType = value['EDIT_RESPONDENT'];
          this.participantPresent = value['IS_RESPONDENT_PRESENT'];
          this.defendantNotPresent = value['RESPONDENT_PRESENCE_NOT_YET_ENTERED'];
          this.participantPresenceRequired = value['RESPONDENT_PRESENCE_REQUIRED'];
        } else {
          this.editDefendantType = value['EDIT_APPELLANT'];
          this.participantPresent = value['IS_APPELLANT_PRESENT'];
          this.defendantNotPresent = value['APPELLANT_PRESENCE_NOT_YET_ENTERED'];
          this.participantPresenceRequired = value['APPELLANT_PRESENCE_REQUIRED'];
        }
      } else {
        this.editDefendantType = value['EDIT_DEFENDANT'];
        this.defendantNotPresent = value['DEFENDANT_PRESENCE_NOT_YET_ENTERED'];
        this.participantPresenceRequired = value['DEFENDANT_PRESENCE_REQUIRED'];
      }
      this.selectedParticipant.emit(this.participantPresenceRequired);
    });
  }

  extractDefendantType(applicantion: any) {
    if (!this.isCaseActive) {
      if (applicantion.label === 'applicant' && !applicantion.type.appealFlag) {
        this.defendantType = DefendantType.Applicant;
      } else if (applicantion.label === 'respondent') {
        this.defendantType = DefendantType.Respondent;
      } else {
        this.defendantType = DefendantType.Appellant;
      }
    }
  }
  getDefendantAttendance(defendantId: string): TodaysDefendantAttendance {
    if (this.todayDefendantsAttendance) {
      return this.todayDefendantsAttendance.find(
        todaysAttendance =>
          todaysAttendance.defendantId === defendantId &&
          todaysAttendance.day === this.selectedHearingDate
      );
    }

    return null;
  }

  getDefendantAttendanceType(defendantId: string): AttendanceTypeEnum {
    const defendantAttendance = this.getDefendantAttendance(defendantId);
    if (defendantAttendance) {
      return defendantAttendance.attendanceType;
    }
    return null;
  }

  getDefendantPresenceLabel(defendantId: string): string {
    const defendantAttendance = this.getDefendantAttendance(defendantId);

    if (!defendantAttendance) {
      return this.defendantNotPresent;
    }

    if (defendantAttendance.attendanceType === AttendanceTypeEnum.IN_PERSON) {
      return 'MANAGE_HEARING.IN_PERSON';
    } else if (defendantAttendance.attendanceType === AttendanceTypeEnum.BY_VIDEO) {
      return 'MANAGE_HEARING.BY_VIDEO';
    }

    return 'MANAGE_HEARING.NOT_PRESENT';
  }

  getDrivingRecord(defendant: DefendantCasesApplications) {
    window.open(`../external-services/dvla/search?${this.buildDvlaSearchParams(defendant)}`);
  }

  buildDvlaSearchParams(defendant: any): string {
    if (!defendant || !defendant.personDefendant || !defendant.personDefendant.personDetails) {
      return '';
    }

    const reference = !!defendant.prosecutionCases?.length
      ? defendant.prosecutionCases[0].prosecutionCaseIdentifier?.caseURN
      : defendant.courtApplications[0]?.applicationReference;
    const { firstName, lastName, dateOfBirth, address, gender } =
      defendant.personDefendant.personDetails;
    return toHttpParams({
      source: 'hearing',
      driverNumber: defendant.personDefendant.driverNumber,
      firstNames: firstName,
      lastName,
      dateOfBirth,
      postcode: address ? address.postcode : undefined,
      gender,
      reasonType: 'ACE',
      reference
    }).toString();
  }

  outstandingFine(defendant: any) {
    if (defendant && defendant.personDefendant) {
      const { firstName, lastName } = defendant.personDefendant.personDetails;
      this.onOutstandingFine.emit({ defendantId: defendant.id, firstName, lastName });
    } else if (defendant && defendant.legalEntityDefendant) {
      const { name } = defendant.legalEntityDefendant.organisation;
      this.onOutstandingFine.emit({ defendantId: defendant.id, name });
    }
  }

  onPresenceSave(data: any) {
    this.setDefendantPresenceFormOpen(data.defendantId, data.selectedOption, false);
    this.isAccordionOpen = false;
    this.onPresenceChanged.emit(data);
  }

  handleAccordionToggle(event: Event) {
    this.isAccordionOpen = (event.target as HTMLDetailsElement).open;
  }

  setDefendantPresenceFormOpen(defendantId: string, value: string, showDefendant: boolean) {
    const dp = this.defendantPresenceFormOpen.find(
      dpo => dpo.defendantId === defendantId && dpo.day === this.selectedHearingDate
    );

    if (dp) {
      dp.value = value;
      dp.showDefendandDetails = showDefendant;
    } else {
      this.defendantPresenceFormOpen.push({
        defendantId: defendantId,
        day: this.selectedHearingDate,
        value: value,
        showDefendandDetails: showDefendant
      });
    }
  }
  get editDefendantUrl(): string {
    const caseId = this.defendant.prosecutionCases[0]?.id;
    const defendantId = this.defendant.id;
    const queryParams =
      this.isForApplication === true ? `?isForApplication=${this.isForApplication}` : '';

    return `${this.appUrl}/prosecution-casefile/edit-case/${caseId}/personal-details/${defendantId}/edit/${this.hearingId}${queryParams}`;
  }
}
