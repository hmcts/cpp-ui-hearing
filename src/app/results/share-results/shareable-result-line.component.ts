import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {
  generateId,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkListDirective,
  PdkTextColorDirective,
  PdkLinkDirective,
  PdkVisuallyHiddenDirective,
  PdkAction
} from '@cpp/pdk';
import { AmendmentReason, HearingLockState } from '../../core';
import { hasPendingAmendments } from '../core/helpers';
import { ResolvedDraftResultLine } from '../results.interfaces';
import { ResultPromptsSummaryComponent } from '../common/components/result-prompts-summary.component';
import { DatePipe } from '@angular/common';
import { ShareableResultLineAmendmentComponent } from './shareable-result-line-amendment.component';
import { ShareableResultLineAmendmentLegacyComponent } from './shareable-result-line-amendment-legacy.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'cpp-shareable-result-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-action-details
      [highlightedLabel]="highlightedLabel"
      [highlighted]="true"
      pdk-margin-vertical="1"
      pdk-margin-left="-2"
      pdk-margin-right="-4"
    >
      <pdk-action-title pdk-typography="body" data-test-id="resultLineTitle">
        <b [class.cpp-shareable-result-line--deleted]="resultLine.deleted">
          {{ resultLine.label }}
          {{
            conditonalMandatoryWithChild !== undefined
              ? conditonalMandatoryWithChild
                ? 'Yes'
                : 'No'
              : ''
          }}
        </b>
      </pdk-action-title>
      <pdk-action-body pdk-typography="body">
        <cpp-result-prompts-summary
          [class.cpp-shareable-result-line--deleted]="resultLine.deleted"
          [highlighted]="false"
          [inline]="false"
          [resultPrompts]="resultLine.resultPrompts"
        ></cpp-result-prompts-summary>

        <ul pdk-list pdk-margin-top="1">
          <li pdk-typography="body-small" pdk-text-colour="dark-grey">
            Result/order made on {{ resultLine.orderedDate | date : 'dd MMM yyyy' }}
          </li>
          @if (resultLine.amendmentDate) {
          <li pdk-typography="body-small" pdk-text-colour="dark-grey">
            Amended on {{ resultLine.amendmentDate | date : 'dd MMM yyyy' }}
          </li>
          } @if (resultLine.sharedDate) {
          <li pdk-typography="body-small">
            Shared on {{ resultLine.sharedDate | date : 'dd MMM yyyy' }}
          </li>
          }
        </ul>

        @if (!!resultLine.amendmentsLog && resultLine.amendmentsLog.isAmended) {
        <cpp-shareable-result-line-amendment
          [resultLine]="resultLine"
          [amendmentReason]="resultLine.amendmentReason"
          [locked]="amendmentsLocked"
          [pending]="hasPendingAmendment"
        ></cpp-shareable-result-line-amendment>
        } @else { @if (resultLine.amendmentReason) {
        <cpp-shareable-result-line-amendment-legacy
          [amendmentReason]="resultLine.amendmentReason"
          [locked]="amendmentsLocked"
          [pending]="hasPendingAmendment"
          (amendmentReasonChange)="amendmentReasonChange.emit($event)"
        ></cpp-shareable-result-line-amendment-legacy>
        } }
      </pdk-action-body>

      @if (hasAmendApplication) {
      <pdk-action-options>
        <a pdk-link unvisited [routerLink]="['/manage', hearingId, 'enter-results']">
          {{ resultLine.sharedDate ? 'Amend' : 'Change'
          }}<span pdk-visually-hidden>&nbsp;{{ resultLine.label }}</span>
        </a>
      </pdk-action-options>
      }
    </pdk-action-details>
  `,
  styles: [
    `
      .cpp-shareable-result-line--deleted {
        text-decoration: line-through;
      }
    `
  ],
  imports: [
    PdkAction,
    PdkMarginDirective,
    PdkTypographyDirective,
    ResultPromptsSummaryComponent,
    PdkListDirective,
    PdkTextColorDirective,
    ShareableResultLineAmendmentComponent,
    ShareableResultLineAmendmentLegacyComponent,
    PdkLinkDirective,
    RouterLink,
    PdkVisuallyHiddenDirective,
    DatePipe
  ]
})
export class ShareableResultLineComponent implements OnChanges {
  @Input() hearingAmendedByCurrentUser: boolean;
  @Input() hearingId: string;
  @Input() hearingLockState: HearingLockState;
  @Input() resultLine: ResolvedDraftResultLine;
  @Input() conditonalMandatoryWithChild: boolean;
  @Input() isCourtApplicationFinalised: boolean;
  @Input() isAmendmentAllowed: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Output() amendmentReasonChange = new EventEmitter<AmendmentReason>();

  amendmentReasonExpanded = false;
  hasAmendApplication = false;
  id = generateId('share-result-line');

  ngOnChanges(_: SimpleChanges) {
    this.hasAmendApplication = !this.resultLine.deleted && !this.amendmentsLocked;
    if (this.amendApplicationPermission) {
      this.hasAmendApplication =
        !this.resultLine.deleted &&
        !this.amendmentsLocked &&
        (!this.isCourtApplicationFinalised ||
          (this.isCourtApplicationFinalised && this.isAmendmentAllowed));
    }
  }

  get amendmentsLocked(): boolean {
    switch (this.hearingLockState) {
      case HearingLockState.INITIALISED:
      case HearingLockState.SHARED:
        return false;

      case HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR:
      case HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR:
        return !this.hearingAmendedByCurrentUser;

      case HearingLockState.APPROVAL_REQUESTED:
      case HearingLockState.VALIDATED:
        return true;
    }
  }

  get hasPendingAmendment(): boolean {
    return hasPendingAmendments(this.resultLine);
  }

  get highlightedLabel(): string {
    if (this.resultLine.deleted) {
      return 'Deleted';
    }
    return this.hasPendingAmendment || !this.resultLine.sharedDate ? 'Saved' : 'Shared';
  }
}
