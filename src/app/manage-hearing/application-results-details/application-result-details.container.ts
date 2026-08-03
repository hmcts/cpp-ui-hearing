import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ApplicationAggregate,
  caseStatus,
  CourtApplication,
  HearingDetail,
  TodaysDefendantAttendance,
  VerdictType
} from '../../core';
import { ValidationError } from '@cpp/pdk';
import { ResultsState } from '../../results/core/store';
import { select, Store } from '@ngrx/store';
import { canAmendApplication } from '../../core/selectors/user-groups';
import { ApplicationResultDetailsComponent } from './application-result-details.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'application-result-details-container',
  template: `
    <application-result-details
      [hearing]="hearing"
      [hearingId]="hearingId"
      [courtApplications]="courtApplications"
      [applicationResults]="applicationResults"
      [isGroupCaseApplicationText]="isGroupCaseApplicationText"
      [showSubject]="showSubject"
      (onGoToEnterResult)="onGoToEnterResult.emit()"
      [pleasMapping]="pleasMapping"
      [guiltyPleasValues]="guiltyPleasValues"
      [verdictTypes]="verdictTypes"
      [attendanceErrors]="attendanceErrors"
      [caseStatus]="caseStatus"
      [isPleaApplicableFlag]="isPleaApplicableFlag"
      [isVerdictsPageAvailable]="isVerdictsPageAvailable"
      [todayDefendantsAttendance]="todayDefendantsAttendance"
      [selectedHearingDate]="selectedHearingDate"
      [amendApplicationPermission]="isAmendApplicationPermission$ | async"
      [applicationCaseStatus]="applicationCaseStatus$ | async"
      (onOutstandingFine)="onOutstandingFine.emit($event)"
      (onYouthCourtToggle)="onYouthCourtToggle.emit($event)"
      (onPresenceChanged)="onPresenceChanged.emit($event)"
      (onSelectedParticipant)="onSelectedParticipant.emit($event)"
    >
    </application-result-details>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApplicationResultDetailsComponent, AsyncPipe]
})
export class ApplicationResultDetailsContainer {
  @Input() hearing: HearingDetail;
  @Input() hearingId: string;
  @Input() applicationResults: CourtApplication[] = [];
  @Input() courtApplications: ApplicationAggregate[] = [];
  @Input() isGroupCaseApplicationText: string;
  @Input() hearingType: string;
  @Input() showSubject = true;
  @Input() pleasMapping: { [key: string]: string } = {};
  @Input() guiltyPleasValues: string[] = [];
  @Input() verdictTypes: VerdictType[];
  @Input() isPleaApplicableFlag: boolean;
  @Input() isVerdictsPageAvailable: boolean;
  @Input() todayDefendantsAttendance: TodaysDefendantAttendance[];
  @Input() selectedHearingDate: string;
  @Input() caseStatus: string;
  @Input() attendanceErrors?: ValidationError[] | null;
  @Output() onGoToEnterResult: EventEmitter<void> = new EventEmitter();
  @Output() onPresenceChanged: EventEmitter<any> = new EventEmitter();
  @Output() onOutstandingFine: EventEmitter<{
    defendantId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }> = new EventEmitter();
  @Output() onYouthCourtToggle: EventEmitter<string> = new EventEmitter();
  @Output() onSelectedParticipant: EventEmitter<string> = new EventEmitter();
  isAmendApplicationPermission$ = this.store.pipe(select(canAmendApplication));
  applicationCaseStatus$ = this.store.pipe(select(caseStatus));

  constructor(private store: Store<ResultsState>) {}
}
