import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ApplicationAggregate,
  CourtApplication,
  HearingDetail,
  TodaysDefendantAttendance,
  VerdictType
} from '../../core';
import {
  ValidationError,
  PdkMarginDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkDividerComponent
} from '@cpp/pdk';
import { ApplicationSubjectComponent } from './application-subject.component';
import { DefendantLevelDetailComponent } from '../defendant-level-detail/defendant-level-detail.component';
import { ShareableResultsContainerComponent } from '../../results/share-results/shareable-results.container';
import { ApplicationResultsComponent } from './application-results.component';

@Component({
  selector: 'application-result-details',
  template: `
    <div data-test-id="application-result">
      @for (application of courtApplications; track $index) { @if ( showSubject &&
      (!application.masterDefendant || (application.masterDefendant.prosecutionCases || []).length
      === 0) ) {
      <application-subject
        [subject]="application.subject"
        [isGroupCaseApplicationText]="isGroupCaseApplicationText"
      >
      </application-subject>
      } @if ( !!application.masterDefendant && (application.masterDefendant.prosecutionCases ||
      []).length > 0 ) {
      <defendant-level-detail
        pdk-margin-top="6"
        class="defendant-level-detail"
        [hearing]="hearing"
        [hearingId]="hearingId"
        [defendant]="application.masterDefendant"
        [attendanceErrors]="attendanceErrors"
        [caseStatus]="caseStatus"
        [todayDefendantsAttendance]="todayDefendantsAttendance"
        [selectedHearingDate]="selectedHearingDate"
        (onOutstandingFine)="onOutstandingFine.emit($event)"
        (onPresenceChanged)="onPresenceChanged.emit($event)"
        (onYouthCourtToggle)="onYouthCourtToggle.emit($event)"
        (selectedParticipant)="onSelectedParticipant.emit($event)"
      >
      </defendant-level-detail>
      } @if (application.masterDefendant?.masterDefendantId) {
      <pdk-grid container>
        <pdk-grid full>
          <cpp-shareable-results-container
            [masterDefendantId]="application.masterDefendant.masterDefendantId"
          ></cpp-shareable-results-container>
        </pdk-grid>
      </pdk-grid>
      <pdk-divider pdk-margin-top="4" pdk-margin-bottom="2"></pdk-divider>
      } @for (courtApplication of application.applications; track courtApplication.id) {
      <application-results
        [hearing]="hearing"
        [hearingType]="hearingType"
        [courtApplication]="courtApplication"
        (onGoToEnterResult)="onGoToEnterResult.emit()"
        [pleasMapping]="pleasMapping"
        [guiltyPleasValues]="guiltyPleasValues"
        [verdictTypes]="verdictTypes"
        [isPleaApplicableFlag]="isPleaApplicableFlag"
        [isVerdictsPageAvailable]="isVerdictsPageAvailable"
        [amendApplicationPermission]="amendApplicationPermission"
        [applicationCaseStatus]="applicationCaseStatus"
      >
      </application-results>
      } } @for (application of applicationResults; track application.id) {
      <application-results
        [hearing]="hearing"
        [hearingType]="hearingType"
        [courtApplication]="application"
        (onGoToEnterResult)="onGoToEnterResult.emit()"
        [pleasMapping]="pleasMapping"
        [guiltyPleasValues]="guiltyPleasValues"
        [verdictTypes]="verdictTypes"
        [isPleaApplicableFlag]="isPleaApplicableFlag"
        [isVerdictsPageAvailable]="isVerdictsPageAvailable"
        [amendApplicationPermission]="amendApplicationPermission"
        [applicationCaseStatus]="applicationCaseStatus"
      >
      </application-results>
      }
    </div>
  `,
  styles: [
    `
      .defendant-level-detail {
        display: flex;
        flex-direction: column;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ApplicationSubjectComponent,
    DefendantLevelDetailComponent,
    PdkMarginDirective,
    PdkGridComponent,
    PdkGridDirective,
    ShareableResultsContainerComponent,
    PdkDividerComponent,
    ApplicationResultsComponent
  ]
})
export class ApplicationResultDetailsComponent {
  @Input() hearing?: HearingDetail;
  @Input() attendanceErrors?: ValidationError[] | null;
  @Input() hearingId?: string;
  @Input() applicationResults?: CourtApplication[] = [];
  @Input() courtApplications?: ApplicationAggregate[] = [];
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
  @Input() applicationCaseStatus: string;
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Output() onGoToEnterResult: EventEmitter<void> = new EventEmitter();
  @Output() onOutstandingFine: EventEmitter<{
    defendantId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  }> = new EventEmitter();
  @Output() onYouthCourtToggle: EventEmitter<string> = new EventEmitter();
  @Output() onPresenceChanged: EventEmitter<any> = new EventEmitter();
  @Output() onSelectedParticipant: EventEmitter<string> = new EventEmitter();
}
