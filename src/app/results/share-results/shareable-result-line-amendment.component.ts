import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { AmendmentReason } from '../../core';
import { AmendmentRecord, DraftResultPrompt, ResolvedDraftResultLine } from '../results.interfaces';
import { DatePipe } from '@angular/common';
import { PdkDetailsSummary, PdkMarginDirective, PdkTypographyDirective } from '@cpp/pdk';
import { ResultPromptsSummaryComponent } from '../common/components/result-prompts-summary.component';

@Component({
  selector: 'cpp-shareable-result-line-amendment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showDetails) {
    <details pdk-details pdk-margin-top="3" [open]="detailsOpen" (toggle)="onToggle($event)">
      <summary>
        <span class="summary" data-test-id="viewPreviousResultsDetails"
          >View previous results details</span
        >
      </summary>
      <pdk-details-text>
        @for (amendmentRecord of resultLine.amendmentsLog.amendmentsRecord; track $index) {
        <div pdk-margin-bottom="3">
          @if (showRecord(amendmentRecord)) { @if ( amendmentRecord.amendmentReason.id ===
          'a02018a1-915c-3343-95ad-abc5f99b339a' ) {
          <div>
            <span pdk-typography="body-medium" class="description">
              {{ amendmentRecord.amendmentReason.reasonDescription }}
            </span>
          </div>
          } @if (!resultLine.amendmentsLog.resultWithoutPrompts) {
          <cpp-result-prompts-summary
            [class.cpp-shareable-result-line--deleted]="resultLine.deleted"
            [highlighted]="false"
            [inline]="false"
            [resultPrompts]="getAmendedPrompts(amendmentRecord)"
          ></cpp-result-prompts-summary>
          }
          <div>
            <span pdk-typography="body-small" data-test-id="previousResultsDetailsAmendedBy"
              >Amended by {{ amendmentRecord.amendedBy }},
              {{ amendmentRecord.amendmentDate | date : 'dd MMM yyyy' }}</span
            >
          </div>
          <div>
            @if (!!amendmentRecord.validatedBy) {
            <span pdk-typography="body-small" data-test-id="previousResultsDetailsValidatedBy"
              >Validated by {{ amendmentRecord.validatedBy }},
              {{ amendmentRecord.validationDate | date : 'dd MMM yyyy' }}</span
            >
            }
          </div>
          }
        </div>
        }
      </pdk-details-text>
    </details>
    }
  `,
  styles: [
    `
      .description {
        font-style: italic;
        text-overflow: clip;
        white-space: nowrap;
      }
    `
  ],
  imports: [
    PdkMarginDirective,
    PdkTypographyDirective,
    ResultPromptsSummaryComponent,
    DatePipe,
    PdkDetailsSummary
  ]
})
export class ShareableResultLineAmendmentComponent implements OnChanges {
  @Input() resultLine: ResolvedDraftResultLine;
  @Input() amendmentReason: AmendmentReason;
  @Input() locked = false;
  @Input() pending = false;

  detailsOpen = false;

  ngOnChanges(): void {
    this.detailsOpen = false;
  }

  onToggle(event: Event): void {
    const target = event.target as HTMLDetailsElement;
    this.detailsOpen = target.open;
  }

  get showDetails(): boolean {
    const { amendmentsLog, deleted } = this.resultLine;
    const amendmentsRecord = (!!amendmentsLog && amendmentsLog.amendmentsRecord) || [];
    const resultLineCurrentlyAddedAndWithoutPrompts =
      !!amendmentsLog && amendmentsLog.isCurrentlyAdded && amendmentsLog.resultWithoutPrompts;

    if (amendmentsRecord.length || resultLineCurrentlyAddedAndWithoutPrompts || deleted) {
      return (
        amendmentsRecord.some(record => record.validatedBy) ||
        resultLineCurrentlyAddedAndWithoutPrompts ||
        !!this.getAmendedPrompts(amendmentsRecord[0]).length ||
        deleted
      );
    }
    return false;
  }

  showRecord(amendmentRecord: AmendmentRecord): boolean {
    const {
      amendmentsLog: { isCurrentlyAdded, resultWithoutPrompts },
      deleted
    } = this.resultLine;
    return (
      !!amendmentRecord.validatedBy ||
      this.getAmendedPrompts(amendmentRecord).length > 0 ||
      ((isCurrentlyAdded || deleted) && resultWithoutPrompts) ||
      deleted
    );
  }

  getAmendedPrompts(amendmentRecord: AmendmentRecord): DraftResultPrompt<unknown>[] {
    if (!amendmentRecord) {
      return [];
    }
    if (!!amendmentRecord.validatedBy) {
      return amendmentRecord.resultPromptsRecord;
    }
    const amendedPrompts = (amendmentRecord.resultPromptsRecord || []).filter(previousPrompt => {
      return !this.resultLine.resultPrompts.some(
        currentPrompt => JSON.stringify(currentPrompt) === JSON.stringify(previousPrompt)
      );
    });
    const idSet = new Set(
      (amendmentRecord.resultPromptsRecord || []).map(prompt => prompt.promptRef)
    );
    const optionalPromptsAdded = (this.resultLine.resultPrompts || []).filter(
      prompt => !idSet.has(prompt.promptRef)
    );
    return amendedPrompts.concat(optionalPromptsAdded);
  }
}
