import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import {
  ValidationError,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkTextColorDirective,
  PdkPaddingDirective,
  PdkCheckboxComponent,
  PdkVisuallyHiddenDirective,
  PdkLinkDirective,
  PdkBorderColorDirective,
  PdkInsetTextComponent
} from '@cpp/pdk';
import { AmendmentReason, JurisdictionType, Offence } from '../../../core';
import { AmendmentService } from '../../common/services/amendment.service';
import { getSortedRelations } from '../../core/helpers';
import { DraftResultRelation, DraftStatus } from '../../results.interfaces';
import { ValidationMessage } from '../../results-validation.interfaces';
import { DraftResultParserComponent } from './draft-result-parser.component';
import { OffenceConditionStatus } from '../../../core/model/offence-condition-status';
import { DraftResultLineContainerComponent } from '../draft-result-line/draft-result-line.container';
import { FormsModule } from '@angular/forms';

interface ParseOffenceTextOptions {
  amendmentReason?: AmendmentReason;
  applicationId?: string;
  caseId: string;
  defendantId: string;
  masterDefendantId: string;
  offenceId: string;
  rawText: string;
}

@Component({
  selector: 'cpp-draft-result-offence',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h5 pdk-typography="heading-small">
      <span class="offence-index" pdk-margin-right="2">
        @if (offence.count && jurisdictionType === 'CROWN') { Count {{ offence.count }} - } @if
        (!offence.count || jurisdictionType === 'MAGISTRATES') { {{ offence.orderIndex }}. }
      </span>
      <span data-test-id="offenceTitle">{{ offence.offenceTitle }}</span>
    </h5>

    <div pdk-typography="body" pdk-margin-top="-4" pdk-margin-bottom="4">
      @if (offence.wording && !offence.indictmentParticular) {
      <pdk-foldable-text pdk-text-colour="dark-grey" data-test-id="offenceWording">
        {{ offence.wording }}
      </pdk-foldable-text>
      } @if (offence.indictmentParticular) {
      <pdk-foldable-text pdk-text-colour="dark-grey" data-test-id="offenceWording">
        {{ offence.indictmentParticular }}
      </pdk-foldable-text>
      }
    </div>
    @if (validationErrorMessages.length > 0) {
    <pdk-inset-text
      pdk-border-colour="red"
      style="border-left-width: 5px;"
      [id]="'results-validation-error-' + offence.id"
      [attr.data-test-id]="'offenceValidationError-' + offence.id"
    >
      @for (entry of validationErrorMessages; track entry) {
      <div [attr.data-test-id]="'offenceValidationError-' + offence.id + '-' + entry.ruleId">
        <strong pdk-text-colour="red">{{ entry.message }}</strong>
      </div>
      }
    </pdk-inset-text>
    } @if (offenceConditionStatus.displayElectronicMonitoringWarning) {
    <div pdk-padding-top="3" pdk-padding-bottom="3" class="notification-icon">
      <i class="vector-icon notification-icon__large">
        <svg width="32" height="32">
          <use [attr.xlink:href]="'assets/icons/svg-icons-definitions.svg#important'"></use>
        </svg>
      </i>
      <div
        class="notepad-target__notification"
        pdk-margin-top="1"
        data-test-id="target-notification"
      >
        Manage outstanding electronic monitoring on this offence
      </div>
    </div>
    } @if (offenceConditionStatus.displayWarranArrestWarning) {
    <div pdk-padding-top="3" pdk-padding-bottom="3" class="notification-icon">
      <i class="vector-icon notification-icon__large">
        <svg width="32" height="32">
          <use [attr.xlink:href]="'assets/icons/svg-icons-definitions.svg#important'"></use>
        </svg>
      </i>
      <div
        class="notepad-target__notification"
        pdk-margin-top="1"
        data-test-id="target-notification"
      >
        Manage outstanding warrant of arrest on this offence
      </div>
    </div>
    } @for (relation of sortedRelations; track $index) {
    <div pdk-margin-bottom="6">
      <cpp-draft-result-line-container
        [resultLineId]="relation.resultLineId"
        [ruleType]="relation.ruleType"
        [targetStatus]="draftStatus"
        [canAllocateRelatedHearing]="canAllocateRelatedHearing"
        (errors)="errors.emit($event)"
      >
      </cpp-draft-result-line-container>
    </div>
    } @if (draftStatus !== 'READONLY') { @if (showResultLineParser) {
    <cpp-draft-result-parser [label]="offence.offenceTitle"></cpp-draft-result-parser>
    }
    <pdk-checkbox
      data-test-id="toggleShadowListing"
      pdk-margin-top="-4"
      checkboxType="small"
      [ngModel]="shadowListed"
      (ngModelChange)="shadowListedChange.emit($event)"
      [ngModelOptions]="{}"
    >
      Exclude <span pdk-visually-hidden>{{ offence.offenceTitle }}</span> offence from list (next
      hearing)
    </pdk-checkbox>
    @if (!this.showResultLineParser || (this.canCopyResults && this.hasResolvedResultLines)) {
    <ul pdk-margin-bottom="6">
      @if (canCopyResults && hasResolvedResultLines) {
      <li>
        <a pdk-link role="button" href="javascript:void(0)" (click)="handleCopyResults()"
          >Apply results to other offences
        </a>
      </li>
      } @if (!showResultLineParser) {
      <li>
        <a
          data-test-id="addMoreResults"
          pdk-link
          role="button"
          href="javascript:void(0)"
          (click)="handleAddMoreResults()"
          >Add more results</a
        >
      </li>
      }
    </ul>
    } }
  `,
  styles: [
    `
      .offence-index {
        display: inline-block;
      }

      .notepad-target__notification {
        font-size: 20px;
        font-weight: bold;
      }

      svg use {
        color: inherit;
        fill: inherit;
      }

      .vector-icon {
        float: left;
        margin-right: 5px;
        padding-top: 3px;
      }

      .notification-icon {
        margin-right: 8px;
        margin-top: -3px;
      }

      .notification-icon__large {
        width: 35px;
        height: 35px;
      }
    `
  ],
  imports: [
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkPaddingDirective,
    PdkBorderColorDirective,
    PdkInsetTextComponent,
    DraftResultLineContainerComponent,
    DraftResultParserComponent,
    PdkCheckboxComponent,
    FormsModule,
    PdkVisuallyHiddenDirective,
    PdkLinkDirective
  ]
})
export class DraftResultOffenceComponent {
  @Input() applicationId?: string;
  @Input() canCopyResults = false;
  @Input() caseId: string;
  @Input() defendantId: string;
  @Input() draftStatus: DraftStatus;
  @Input() hasSharedResults = false;
  @Input() masterDefendantId: string;
  @Input()
  set relations(relations: DraftResultRelation[]) {
    this.hasResolvedResultLines = relations.some(relation => relation.ruleType !== 'unknown');
    this.sortedRelations = getSortedRelations(relations);
    // Show / hide the result line parser, depending on any relations existing.
    // Note that for previously shared results, this must default to false so as
    // to force the user to choose an amendment reason via 'Add results'
    this.showResultLineParser = relations.length === 0 && !this.hasSharedResults;
  }
  @Input() jurisdictionType: JurisdictionType;
  @Input() offence: Offence;
  @Input() offenceNumber: number;
  @Input() shadowListed = false;
  @Input() offenceConditionStatus: OffenceConditionStatus;
  @Input() canAllocateRelatedHearing: boolean;
  @Input() validationErrorMessagesByOffenceId: Map<string, ValidationMessage[]> = new Map();
  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() shadowListedChange = new EventEmitter();
  @Output() navigateToCopyResults = new EventEmitter<string>();
  @ViewChild(DraftResultParserComponent) parser: DraftResultParserComponent;

  hasResolvedResultLines = false;
  sortedRelations: DraftResultRelation[] = [];
  showResultLineParser = false;

  get validationErrorMessages(): ValidationMessage[] {
    return this.validationErrorMessagesByOffenceId?.get(this.offence.id) ?? [];
  }

  private amendmentReason: AmendmentReason | null = null;

  constructor(private cdr: ChangeDetectorRef, private amendmentService: AmendmentService) {}

  getParserOptions(): ParseOffenceTextOptions | void {
    if (this.parser) {
      return {
        amendmentReason: this.amendmentReason,
        applicationId: this.applicationId,
        caseId: this.caseId,
        defendantId: this.defendantId,
        masterDefendantId: this.masterDefendantId,
        offenceId: this.offence.id,
        rawText: this.parser.getRawTextValue()
      };
    }
  }

  handleCopyResults = async () => {
    if (this.draftStatus === 'SHARED') {
      const amendmentReason = await this.amendmentService.requestAmendmentReason({
        targetIds: [this.offence.id]
      });
      if (amendmentReason) {
        this.navigateToCopyResults.emit(this.offence.id);
      }
    } else {
      this.navigateToCopyResults.emit(this.offence.id);
    }
  };

  handleAddMoreResults = async () => {
    if (this.draftStatus === 'SHARED') {
      this.amendmentReason = await this.amendmentService.requestAmendmentReason({
        targetIds: [this.offence.id]
      });
      if (this.amendmentReason) {
        this.showResultLineParser = Boolean(this.amendmentReason);
        this.cdr.detectChanges();
        this.parser.focus();
      }
    } else {
      this.showResultLineParser = true;
    }
  };

  resetParser(): void {
    if (this.parser) {
      this.amendmentReason = null;
      this.parser.clear();
    }
  }
}
