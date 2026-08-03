import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HearingSummary, Offence } from '../../../core';
import { ProsecutionCaseSummary } from '../../../core/model/shared/prosecution-case-summary';
import moment from 'moment';
import {
  PdkTypographyDirective,
  PdkLabelComponent,
  PdkMarginDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { CaseReferencePipe } from '../../pipes/case-reference.pipe';
import { HearingPartyLabelPipe } from '../../pipes/hearing-party-label.pipe';
import { ReportingRestrictionsComponent } from '../../../shared/components/reporting-restrictions/reporting-restrictions.component';

@Component({
  selector: 'hearing-summary-item',
  templateUrl: './hearing-summary-item.component.html',
  styleUrls: ['./hearing-summary-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    CaseReferencePipe,
    HearingPartyLabelPipe,
    PdkTypographyDirective,
    PdkLabelComponent,
    PdkMarginDirective,
    PdkVisuallyHiddenDirective,
    ReportingRestrictionsComponent
  ]
})
export class HearingSummaryItemComponent {
  @Input() isActive: boolean;
  @Input() hearing: HearingSummary;
  @Input() selectedHearingDate: string;

  sharedResults: boolean;

  get caseSummaries(): ProsecutionCaseSummary[] {
    return !!this.hearing ? this.hearing.prosecutionCaseSummaries : null;
  }

  get bulkCase(): ProsecutionCaseSummary {
    return !!this.caseSummaries ? this.caseSummaries.find(kase => !!kase.isGroupMaster) : null;
  }

  get bulkHearingSummaryTitle(): string {
    if (this.bulkCase) {
      return `${this.hearing.numberOfGroupCases} Defendants`;
    } else {
      return '';
    }
  }

  get bulkCaseOffenceTitle(): string {
    if (this.bulkCase) {
      return this.bulkCase.defendants[0].offences[0].offenceTitle;
    } else {
      return '';
    }
  }

  get caseReferenceLabel() {
    if (this.caseSummaries && this.caseSummaries.length) {
      const caseSummary = this.hearing.prosecutionCaseSummaries[0];
      return caseSummary.prosecutionCaseIdentifier.caseURN ? 'COMMON.URN' : 'COMMON.PAR';
    }

    const { caseSummaries } = this.hearing.courtApplicationSummaries[0];
    if (caseSummaries && caseSummaries.length) {
      return caseSummaries[0].prosecutionCaseIdentifier.caseURN ? 'COMMON.URN' : 'COMMON.PAR';
    }

    return 'COMMON.ARN';
  }

  get hearingSequenceNumber() {
    const listingHearingDay = this.hearing.hearingDays.find(hearingDay =>
      hearingDay.sittingDay.startsWith(this.selectedHearingDate)
    );

    return listingHearingDay ? listingHearingDay.listingSequence : undefined;
  }

  get allOffences(): Offence[] {
    return (this.caseSummaries || []).reduce(
      (fromSummaries, summary) =>
        fromSummaries.concat(
          (summary.defendants || []).reduce(
            (fromDefendants, defendant) => fromDefendants.concat(defendant.offences || []),
            []
          )
        ),
      []
    );
  }

  hasSharedResultsInDay(): boolean {
    if (this.hearing.hearingDays && this.hearing.hearingDays.length) {
      return this.hearing.hearingDays.some(
        hearingDay =>
          moment(hearingDay.sittingDay).format('YYYY-MM-DD') === this.selectedHearingDate &&
          hearingDay.hasSharedResults
      );
    }

    return false;
  }

  hasSharedResults(): boolean {
    this.sharedResults = this.hearing.hearingDays.some(hearingDay => hearingDay.hasSharedResults);

    if (!this.sharedResults) {
      return this.hearing.hasSharedResults;
    }
    return this.hasSharedResultsInDay();
  }

  get isHearingWithMoreThan2Cases(): boolean {
    return this.caseSummaries.length > 2;
  }
}
