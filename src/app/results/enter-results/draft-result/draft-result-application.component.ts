import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  ValidationError,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkTextColorDirective,
  PdkVisuallyHiddenDirective,
  PdkWarningTextComponent,
  PdkLinkDirective
} from '@cpp/pdk';
import { SummonsTemplateType } from '@cpp/reference-data';
import { AmendmentReason, CourtApplication } from '../../../core';
import { getSortedRelations } from '../../core/helpers';
import { AmendmentService } from '../../common/services/amendment.service';
import { DraftResultRelation, DraftStatus, PromptEntry } from '../../results.interfaces';
import { DraftResultParserComponent } from './draft-result-parser.component';
import { DraftResultLineContainerComponent } from '../draft-result-line/draft-result-line.container';
import { CPPDatePipe } from '../../../shared/pipes/cpp-date.pipe';

interface ParseApplicationTextOptions {
  amendmentReason?: AmendmentReason;
  applicationId: string;
  caseId?: string;
  masterDefendantId?: string;
  rawText: string;
}

@Component({
  selector: 'cpp-draft-result-application',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl pdk-typography="body">
      <div pdk-margin-bottom="3">
        <dt pdk-text-colour="dark-grey">Application reference</dt>
        <dd>{{ application.applicationReference }}</dd>
      </div>
      @if (application.applicationParticulars) {
      <div pdk-margin-bottom="3">
        <dt pdk-text-colour="dark-grey">Application particulars</dt>
        <dd>{{ application.applicationParticulars }}</dd>
      </div>
      } @if (showProvisonalHearingDateForSummons) {
      <div pdk-margin-bottom="3">
        <dt pdk-text-colour="dark-grey">Agreed hearing date (If summons is approved)</dt>
        <dd>
          @if (application?.futureSummonsHearing?.weekCommencingDate) {
          <span>W/C&nbsp;</span>
          }
          <span>{{ summonsAgreedDateTime | cppDate }}</span>
        </dd>
      </div>
      }
      <div>
        <dt pdk-visually-hidden>Application type</dt>
        <dd data-test-id="application-type">{{ application.type.type }}</dd>
      </div>
      <div>
        <dt pdk-visually-hidden>Application legislation</dt>
        <dd style="font-weight: normal">
          <pdk-foldable-text pdk-text-colour="dark-grey">
            {{ application.type.legislation }}
          </pdk-foldable-text>
        </dd>
      </div>
    </dl>

    @if (application.hasSummonsSupplied) {
    <pdk-warning-text> Prosecutor has supplied a summons with this request </pdk-warning-text>
    } @for (relation of sortedRelations; track trackRelationBy($index, relation)) {
    <div pdk-margin-bottom="6">
      <cpp-draft-result-line-container
        [resultLineId]="relation.resultLineId"
        [isApplication]="true"
        [ruleType]="relation.ruleType"
        [hasHmctsOrganisation]="hasHmctsOrganisation"
        [prosecutorToBeNotified]="prosecutorToBeNotified"
        [isExParteCase]="isExParteCase"
        [canAllocateRelatedHearing]="canAllocateRelatedHearing"
        [isCourtApplicationFinalised]="courtApplicationFinalised"
        [isAmendmentAllowed]="applicationAmendAllowed"
        [amendApplicationPermission]="amendApplicationPermission"
        [caseStatus]="caseStatus"
        (errors)="errors.emit($event)"
      >
      </cpp-draft-result-line-container>
    </div>
    } @if (hasAmendApplication) { @if (showResultLineParser) {
    <cpp-draft-result-parser [label]="application.type.type"></cpp-draft-result-parser>
    } @if (!showResultLineParser || (canCopyResults && hasResolvedResultLines)) {
    <ul pdk-margin-bottom="6">
      <li>
        @if (canCopyResults && hasResolvedResultLines) {
        <a pdk-link role="button" href="javascript:void(0)" (click)="handleCopyResults()"
          >Apply results to other offences
        </a>
        }
      </li>
      <li>
        @if (!showResultLineParser) {
        <a pdk-link role="button" href="javascript:void(0)" (click)="handleAddMoreResults()"
          >Add more results</a
        >
        }
      </li>
    </ul>
    } }
  `,
  styles: [
    `
      dd {
        margin: 0;
        font-weight: bold;
      }
    `
  ],
  imports: [
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkVisuallyHiddenDirective,
    PdkWarningTextComponent,
    DraftResultLineContainerComponent,
    DraftResultParserComponent,
    PdkLinkDirective,
    CPPDatePipe
  ]
})
export class DraftResultApplicationComponent implements OnChanges {
  @Input() application: CourtApplication;
  @Input() caseId?: string;
  @Input() canCopyResults = false;
  @Input() masterDefendantId?: string;
  @Input() draftStatus: DraftStatus;
  @Input() hasSharedResults = false;
  @Input() isBoxwork = false;
  @Input()
  set relations(relations: DraftResultRelation[]) {
    this.hasResolvedResultLines = relations.some(relation => relation.ruleType !== 'unknown');
    this.sortedRelations = getSortedRelations(relations);
    this.showResultLineParser = relations.length === 0 && !this.hasSharedResults;
  }
  @Input() hasHmctsOrganisation: boolean;
  @Input() prosecutorToBeNotified: PromptEntry[];
  @Input() isExParteCase: boolean;
  @Input() canAllocateRelatedHearing: boolean;
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() navigateToCopyResults = new EventEmitter<string>();
  @ViewChild(DraftResultParserComponent) parser: DraftResultParserComponent;

  hasResolvedResultLines = false;
  sortedRelations: DraftResultRelation[] = [];
  showResultLineParser = false;
  hasAmendApplication = false;

  ngOnChanges(_: SimpleChanges) {
    this.hasAmendApplication = this.draftStatus !== 'READONLY';
    if (this.amendApplicationPermission) {
      this.hasAmendApplication =
        this.draftStatus !== 'READONLY' &&
        (!this.courtApplicationFinalised ||
          (this.courtApplicationFinalised && this.applicationAmendAllowed));
    }
  }

  get showProvisonalHearingDateForSummons() {
    if (this.application.futureSummonsHearing) {
      return (
        this.isBoxwork &&
        this.application.type.summonsTemplateType !== SummonsTemplateType.NOT_APPLICABLE
      );
    }
    return false;
  }

  get summonsAgreedDateTime() {
    const { earliestStartDateTime, weekCommencingDate } = this.application.futureSummonsHearing;

    return weekCommencingDate ? weekCommencingDate.startDate : earliestStartDateTime;
  }

  private amendmentReason: AmendmentReason | null = null;

  constructor(private cdr: ChangeDetectorRef, private amendmentService: AmendmentService) {}

  getParserOptions(): ParseApplicationTextOptions {
    if (this.parser) {
      return {
        amendmentReason: this.amendmentReason,
        applicationId: this.application.id,
        caseId: this.caseId,
        masterDefendantId: this.masterDefendantId,
        rawText: this.parser.getRawTextValue()
      };
    }

    return undefined;
  }

  handleCopyResults = async () => {
    if (this.draftStatus === 'SHARED') {
      const amendmentReason = await this.amendmentService.requestAmendmentReason({
        targetIds: [this.application.id]
      });
      if (amendmentReason) {
        this.navigateToCopyResults.emit(this.application.id);
      }
    } else {
      this.navigateToCopyResults.emit(this.application.id);
    }
  };

  handleAddMoreResults = async () => {
    if (this.draftStatus === 'SHARED') {
      this.amendmentReason = await this.amendmentService.requestAmendmentReason({
        targetIds: [this.application.id]
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

  trackRelationBy = (_: number, resultLine: DraftResultRelation): string => {
    return resultLine.resultLineId;
  };

  get courtApplicationFinalised() {
    return this.application && this.application.applicationStatus === 'FINALISED';
  }

  get applicationAmendAllowed() {
    return this.application && this.application?.amendmentAllowed;
  }
}
