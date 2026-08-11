import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CourtApplicationType } from '@cpp/reference-data';
import { isEmpty } from 'lodash-es';
import { AppConfigService } from '../../config/config.service';
import {
  DefendantCasesApplications,
  VerdictType,
  toHttpParams,
  HearingDetail,
  LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE,
  Offence
} from '../../core';
import {
  BreachedApplication,
  DefendantBreachApplication
} from '../../core/model/breach-application';
import {
  AttendanceTypeEnum,
  TodaysDefendantAttendance
} from '../../core/model/defendants-attendance';
import { ActiveCourtOrderByDefendantId } from '../../core/model/court-orders';
import { ProsecutionCaseDetails } from '../../core/model/shared/prosecution-case-details';
import {
  ValidationError,
  PdkMarginDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkDividerComponent,
  PdkVisuallyHiddenDirective,
  PdkTypographyDirective,
  PdkTextColorDirective,
  PdkLinkDirective,
  PdkWarningTextComponent
} from '@cpp/pdk';
import { DatePipe } from '@angular/common';
import { DefendantLevelDetailComponent } from '../defendant-level-detail/defendant-level-detail.component';
import { ShareableResultsContainerComponent } from '../../results/share-results/shareable-results.container';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { RouterLink } from '@angular/router';
import { ApplicationResultDetailsContainer } from '../application-results-details/application-result-details.container';
import { BreachFormComponent } from '../breach-form/breach-form.component';
import { TranslatePipe } from '@ngx-translate/core';
import { VerdictTypeDescriptionPipe } from '../../shared/pipes/verdict-type-description.pipe';
import { ReportingRestrictionsComponent } from '../../shared/components/reporting-restrictions/reporting-restrictions.component';
import { ValidationMessage } from '../../results/results-validation.interfaces';

type NotifiedPleaValue = 'NO_NOTIFICATION' | 'NOTIFIED_NOT_GUILTY' | 'NOTIFIED_GUILTY';
type NotifiedPleaMapping = Record<NotifiedPleaValue, string>;

const REMAND_STATUS_NOT_RECORDED = 'Not recorded';
const REMAND_STATUS_BY_INITIATION_CODE: Readonly<Record<string, string>> = {
  S: 'Summons',
  Q: 'Postal Requisition/Written charge',
  C: 'Custody'
};

@Component({
  selector: 'hearing-results-list',
  templateUrl: './hearing-results-list.component.html',
  styleUrls: ['./hearing-results-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    TranslatePipe,
    VerdictTypeDescriptionPipe,
    PdkMarginDirective,
    PdkGridComponent,
    PdkGridDirective,
    PdkDividerComponent,
    PdkVisuallyHiddenDirective,
    PdkTypographyDirective,
    PdkTextColorDirective,
    PdkLinkDirective,
    PdkWarningTextComponent,
    DefendantLevelDetailComponent,
    ShareableResultsContainerComponent,
    NgxPageScrollModule,
    RouterLink,
    ApplicationResultDetailsContainer,
    BreachFormComponent,
    ReportingRestrictionsComponent
  ]
})
export class HearingResultsListComponent {
  readonly BY_JURY = 'BY_JURY';

  @Input() hearing: HearingDetail;
  @Input() hearingId: string;
  @Input() verdictTypes: VerdictType[];
  @Input() selectedHearingDate: string;
  @Input() todayDefendantsAttendance: TodaysDefendantAttendance[];
  @Input() reasonOptions: { label: string; value: string }[] = [];
  @Input() hearingType: string;
  @Input() casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[];
  @Input() pleasMapping: { [key: string]: string } = {};
  @Input() guiltyPleasValues: string[] = [];
  @Input() activeCourtOrders: ActiveCourtOrderByDefendantId;
  @Input() breachTypes: CourtApplicationType[];
  @Output() onYouthCourtToggle: EventEmitter<string> = new EventEmitter();
  @Input() earliestNextHearingDate?: string;
  @Input() attendanceErrors?: ValidationError[] | null;
  @Input() offenceLevelWarningMessages: Map<string, ValidationMessage[]> = new Map();
  @Input() defendantLevelWarningMessages: Map<string, ValidationMessage[]> = new Map();
  @Input() isPleaApplicableFlag: boolean;
  @Input() isVerdictsPageAvailable: boolean;
  @Output() onSelectedParticipant: EventEmitter<string> = new EventEmitter();

  @Output() onPresenceCancel: EventEmitter<void> = new EventEmitter();
  @Output() onPresenceChanged: EventEmitter<any> = new EventEmitter();
  @Output() onGoToEnterResult: EventEmitter<void> = new EventEmitter();
  @Output() onGoToEnterPlea: EventEmitter<void> = new EventEmitter();
  @Output() onGoToEnterVerdict: EventEmitter<void> = new EventEmitter();
  @Output() onOutstandingFine: EventEmitter<{
    defendantId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }> = new EventEmitter();
  @Output() onBreachApplications: EventEmitter<DefendantBreachApplication> = new EventEmitter();

  defendantPresenceFormOpen: {
    defendantId: string;
    day: string;
    value: string;
    showDefendandDetails: boolean;
  }[] = [];
  notifiedPleaMapping: NotifiedPleaMapping = {
    NO_NOTIFICATION: 'No plea',
    NOTIFIED_NOT_GUILTY: 'Not Guilty',
    NOTIFIED_GUILTY: 'Guilty'
  };

  public appUrl: string;

  constructor(appConfigService: AppConfigService) {
    this.appUrl = appConfigService.getBaseUrl();
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
  getNotifiedPleaValue(notifiedPleaValue: string): string {
    const isValid = (value: string): value is NotifiedPleaValue =>
      value in this.notifiedPleaMapping;
    return isValid(notifiedPleaValue)
      ? this.notifiedPleaMapping[notifiedPleaValue]
      : notifiedPleaValue;
  }
  getDefendantPresenceLabel(defendantId: string): string {
    const defendantAttendance = this.getDefendantAttendance(defendantId);

    if (!defendantAttendance) {
      return 'MANAGE_HEARING.DEFENDANT_PRESENCE_NOT_YET_ENTERED';
    }

    if (defendantAttendance.attendanceType === AttendanceTypeEnum.IN_PERSON) {
      return 'MANAGE_HEARING.IN_PERSON';
    } else if (defendantAttendance.attendanceType === AttendanceTypeEnum.BY_VIDEO) {
      return 'MANAGE_HEARING.BY_VIDEO';
    }

    return 'MANAGE_HEARING.NOT_PRESENT';
  }

  showDefendantDetails(defendantId: string): boolean {
    const foundDpo = this.defendantPresenceFormOpen.find(
      dpo => dpo.defendantId === defendantId && dpo.day === this.selectedHearingDate
    );

    return foundDpo ? foundDpo.showDefendandDetails : false;
  }

  hasPlea(offence: Offence): boolean {
    return (
      (offence.plea && offence.plea.pleaValue && !!offence.plea.pleaDate) ||
      (offence.indicatedPlea &&
        offence.indicatedPlea.indicatedPleaValue &&
        !['INDICATED_NOT_GUILTY', 'NO_INDICATION'].includes(
          offence.indicatedPlea.indicatedPleaValue
        ) &&
        !!offence.indicatedPlea.indicatedPleaDate)
    );
  }

  hasNotifiedPlea(offence: Offence): any {
    return (
      offence.notifiedPlea &&
      offence.notifiedPlea.notifiedPleaValue &&
      offence.notifiedPlea.notifiedPleaValue !== 'NO_NOTIFICATION' &&
      offence.notifiedPlea.notifiedPleaDate
    );
  }

  hasNotifiedPleaGuilty(offence: Offence) {
    return (
      this.hasNotifiedPlea(offence) && offence.notifiedPlea.notifiedPleaValue === 'NOTIFIED_GUILTY'
    );
  }

  hasVerdict(offence: Offence): any {
    return (
      offence.verdict &&
      !isEmpty(offence.verdict.verdictType) &&
      offence.verdict.verdictType.id &&
      !offence.verdict.isDeleted &&
      offence.verdict.verdictDate
    );
  }

  pleaDate(offence: Offence) {
    return offence.plea.pleaDate;
  }

  isVerdictTypeByJury(offence: Offence): boolean {
    return offence.verdict.verdictType.categoryType.includes(this.BY_JURY);
  }

  // TODO: There appears to be a unanimous flag already calculated
  // so why do we need to do this
  hasUnanimousVerdict(offence: Offence): boolean {
    return !offence.verdict.isDeleted && offence.verdict.jurors.numberOfSplitJurors === 0;
  }

  hasMajorityVerdict(offence: Offence): boolean {
    return !offence.verdict.isDeleted && offence.verdict.jurors.numberOfSplitJurors > 0;
  }

  // Added condition to exclude guilty of lesser or alternative offence because categoryType has changed in RefData
  // https://codereview.mdv.cpp.nonlive/c/cpp.static-data.patches/+/139146
  hasVerdictDate(offence: Offence): boolean {
    return (
      offence.verdict &&
      offence.verdict.verdictDate &&
      !offence.verdict.isDeleted &&
      !(
        offence.verdict.verdictType.categoryType.includes('NOT_GUILTY') &&
        offence.verdict.verdictType.cjsVerdictCode !==
          LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE
      )
    );
  }

  verdictDate(offence: Offence) {
    return offence.verdict.verdictDate;
  }

  numberOfJurors(offence: Offence): number {
    return offence.verdict.jurors.numberOfJurors || 12;
  }

  numberOfSplitJurors(offence: Offence): number {
    return offence.verdict.jurors.numberOfSplitJurors || 0;
  }

  isVerdictLesserOrAlternativeOffence(verdictTypeId: string): boolean {
    const verdictType = (this.verdictTypes || []).find(({ id }) => id === verdictTypeId);
    return !!verdictType
      ? verdictType.cjsVerdictCode === LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE
      : false;
  }

  isGuiltyToLesserOffenceNamely(pleaValue: string): boolean {
    return (
      pleaValue === 'GUILTY_LESSER_OFFENCE_NAMELY' || pleaValue === 'GUILTY_TO_ALTERNATIVE_OFFENCE'
    );
  }

  convictionDate(offence: Offence) {
    return offence.convictionDate;
  }

  hasConvictionDatePlea(offence: Offence): boolean {
    return offence.convictionDate && this.hasGuiltyPlea(offence);
  }

  hasConvictionDateVerdict(offence: Offence): boolean {
    return offence.convictionDate && this.hasConvictedVerdict(offence);
  }

  hasConvictionDate(offence: Offence): boolean {
    return !!offence.convictionDate;
  }

  hasGuiltyPlea(offence: Offence): boolean {
    return (
      this.guiltyPleasValues.some(plea => plea === offence.plea.pleaValue) ||
      (offence.indicatedPlea && offence.indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY')
    );
  }

  hasAnyGuiltyPleasOrConvictionDates(defendant: DefendantCasesApplications): boolean {
    return defendant.prosecutionCases.some(prosecutionCase =>
      prosecutionCase.offences.some(
        offence => this.hasGuiltyPlea(offence) || this.hasConvictionDate(offence)
      )
    );
  }

  hasConvictedVerdict(offence: Offence): boolean {
    return (
      offence.verdict.verdictType &&
      offence.verdict.verdictType.category &&
      offence.verdict.verdictType.category === 'Guilty' &&
      !offence.verdict.isDeleted
    );
  }

  onBreachFormSubmit(breachedApplications: BreachedApplication[], masterDefendantId: string) {
    this.onBreachApplications.emit(<DefendantBreachApplication>{
      hearingId: this.hearingId,
      masterDefendantId,
      breachedApplications
    });
  }

  getDrivingRecord(defendant: DefendantCasesApplications) {
    window.open(`../external-services/dvla/search?${this.buildDvlaSearchParams(defendant)}`);
  }

  buildDvlaSearchParams(defendant: DefendantCasesApplications): string {
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

  hasBulkCase(casesAndApplications: DefendantCasesApplications) {
    return casesAndApplications.prosecutionCases.some(kase => !!kase.isGroupMaster);
  }

  getRemandStatus = (
    defendant: DefendantCasesApplications,
    prosecutionCase: Omit<ProsecutionCaseDetails, 'defendants'>
  ): string =>
    defendant?.personDefendant?.bailStatus?.description ??
    REMAND_STATUS_BY_INITIATION_CODE[prosecutionCase.initiationCode] ??
    REMAND_STATUS_NOT_RECORDED;
  onYouthBoxSelected(defendant: DefendantCasesApplications) {
    if (!this.hasBulkCase(defendant)) {
      this.onYouthCourtToggle.emit(defendant.id);
    }
  }

  isVerdictDeleted(offence: Offence) {
    return !offence.verdict.isDeleted;
  }

  canChangeVerdict(offence: Offence) {
    const verdictType = (this.verdictTypes || []).find(
      ({ id }) => id === offence.verdict.verdictType.id
    );
    if (!verdictType) {
      return true;
    }
    if (verdictType.jurisdiction === this.hearing.jurisdictionType) {
      return true;
    }
    return false;
  }
}
