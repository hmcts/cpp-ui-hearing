import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HearingSummary } from '../../../core';
import { AppConfigService } from '../../../config';
import * as formUtils from '../../utils/form-utils';
import { RecordIndex } from '../../model/record-index';
import { NgClass, LowerCasePipe, TitleCasePipe, DatePipe } from '@angular/common';
import { PdkMarginDirective, PdkTypographyDirective, PdkLinkDirective, PdkTable } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { FullNamePipe } from '../../../shared/pipes/full-name.pipe';

@Component({
  selector: 'resulted-hearings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: `resulted-hearings.component.html`,
  imports: [
    PdkTable,
    PdkMarginDirective,
    PdkTypographyDirective,
    NgClass,
    PdkLinkDirective,
    LowerCasePipe,
    TitleCasePipe,
    DatePipe,
    TranslatePipe,
    FullNamePipe
  ]
})
export class ResultedHearingsComponent {
  @Input() hearingSummaries: HearingSummary[] = [];
  @Input() isReadOnly: boolean;

  displayedRecordList: RecordIndex[] = [];

  constructor(private configService: AppConfigService) {}

  basePath(): string {
    return this.configService.appUrl;
  }

  isFirstRowForHearing(caseIndex: number, defendantIndex: number, offenceIndex: number) {
    return formUtils.isFirstRowForHearing(caseIndex, defendantIndex, offenceIndex);
  }

  hasRowDisplayed(
    kaseIndex: number,
    defendantIndex: number,
    offenceIndex: number,
    name: string,
    hearingIndex: number
  ) {
    return formUtils.hasRowDisplayed(
      kaseIndex,
      defendantIndex,
      offenceIndex,
      name,
      hearingIndex,
      this.displayedRecordList
    );
  }

  hasOffenceDisplayed(
    kaseIndex: number,
    defendantIndex: number,
    offenceIndex: number,
    hearingIndex: number
  ) {
    return formUtils.hasOffenceDisplayed(
      kaseIndex,
      defendantIndex,
      offenceIndex,
      hearingIndex,
      this.displayedRecordList
    );
  }

  isFirstRowForOffence(offenceIndex: number) {
    return formUtils.isFirstRowForOffence(offenceIndex);
  }
}
