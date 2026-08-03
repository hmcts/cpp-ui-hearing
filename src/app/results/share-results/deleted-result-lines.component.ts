import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AmendmentRecord, ResolvedDraftResultLine } from '../results.interfaces';

import { PdkDetailsSummary, PdkMarginDirective, PdkTypographyDirective } from '@cpp/pdk';
import { DatePipe } from '@angular/common';
import { ResultPromptsSummaryComponent } from '../common/components/result-prompts-summary.component';

@Component({
  selector: 'cpp-deleted-result-lines',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details pdk-details pdk-margin-top="4">
      <summary>
        <span class="summary" data-test-id="deletedResults">
          @if (deletedResultLines.length === 1) { Deleted result } @else { Deleted results }
        </span>
      </summary>
      <pdk-details-text>
        @for (deletedResultLine of deletedResultLines; track deletedResultLine.resultLineId) {
        <div pdk-margin-bottom="3">
          @if ( getLastAmendmentRecord(deletedResultLine).amendmentReason.id ===
          'a02018a1-915c-3343-95ad-abc5f99b339a' ) {
          <div>
            <span pdk-typography="body-medium" class="description">
              {{ getLastAmendmentRecord(deletedResultLine).amendmentReason.reasonDescription }}
            </span>
          </div>
          }
          <div>
            <span pdk-typography="body" data-test-id="deletedResultsLabel"
              ><b>{{ deletedResultLine.label }}</b></span
            >
          </div>
          <cpp-result-prompts-summary
            [class.cpp-shareable-result-line--deleted]="deletedResultLine.deleted"
            [highlighted]="false"
            [inline]="false"
            [resultPrompts]="deletedResultLine.resultPrompts"
          ></cpp-result-prompts-summary>
          <div>
            <span pdk-typography="body-small" data-test-id="deletedResultsAmendedBy"
              >Amended by {{ getLastAmendmentRecord(deletedResultLine).amendedBy }},
              {{
                getLastAmendmentRecord(deletedResultLine).amendmentDate | date : 'dd MMM yyyy'
              }}</span
            >
          </div>
          <div>
            <span pdk-typography="body-small" data-test-id="deletedResultsValidatedBy"
              >Validated by {{ getLastAmendmentRecord(deletedResultLine).validatedBy }},
              {{
                getLastAmendmentRecord(deletedResultLine).validationDate | date : 'dd MMM yyyy'
              }}</span
            >
          </div>
        </div>
        }
      </pdk-details-text>
    </details>
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
export class DeletedResultLinesComponent {
  @Input() deletedResultLines: ResolvedDraftResultLine[];

  getLastAmendmentRecord({ amendmentsLog }: ResolvedDraftResultLine): AmendmentRecord {
    return amendmentsLog.amendmentsRecord[0];
  }
}
