import { Component, Input, OnChanges, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { HearingDetail, DefendantCasesApplications, ProsecutionCaseDetails } from '../../../core';
import { flatMap } from 'lodash-es';
import { TranslateService } from '@ngx-translate/core';
import { I18nPluralPipe } from '@angular/common';
import { PdkSummaryItemComponent, PdkTypographyDirective, PdkMarginDirective } from '@cpp/pdk';
type PluralType = '=1' | 'other';

type PluralMap = Record<PluralType, string>;
interface SummaryPluralMap {
  defendant: PluralMap;
  case: PluralMap;
  offence: PluralMap;
  application: PluralMap;
}

const SUMMARIES: string[] = [
  'HEARING_LIST.DEFENDANT',
  'HEARING_LIST.DEFENDANTS',
  'HEARING_LIST.CASE',
  'HEARING_LIST.CASES',
  'HEARING_LIST.OFFENCE',
  'HEARING_LIST.OFFENCES',
  'HEARING_LIST.APPLICATION',
  'HEARING_LIST.APPLICATIONS'
];

@Component({
  selector: 'headline-summary',
  templateUrl: './headline-summary.component.html',
  styles: [
    `
      .headline-summary {
        display: grid;
        justify-items: stretch;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkSummaryItemComponent, PdkTypographyDirective, PdkMarginDirective, I18nPluralPipe],
  providers: [TranslateService]
})
export class HeadlineSummaryComponent implements OnChanges, OnInit {
  @Input() hearing: HearingDetail;
  @Input() hearingCasesCount: number;
  @Input() casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[];

  numOfApplications: number;
  numOfCases: number;
  numOfDefendants: number;
  numOfOffences: number;

  summaryPluralMap: SummaryPluralMap;

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    const translations = this.translate.instant(SUMMARIES);
    this.summaryPluralMap = {
      defendant: {
        '=1': translations['HEARING_LIST.DEFENDANT'],
        other: translations['HEARING_LIST.DEFENDANTS']
      },
      case: {
        '=1': translations['HEARING_LIST.CASE'],
        other: translations['HEARING_LIST.CASES']
      },
      application: {
        '=1': translations['HEARING_LIST.APPLICATION'],
        other: translations['HEARING_LIST.APPLICATIONS']
      },
      offence: {
        '=1': translations['HEARING_LIST.OFFENCE'],
        other: translations['HEARING_LIST.OFFENCES']
      }
    };
  }

  ngOnChanges() {
    if (this.getBulkCase()) {
      this.numOfDefendants = this.hearingCasesCount;
      this.numOfCases = this.hearingCasesCount;
      this.numOfOffences = this.hearingCasesCount;
    } else {
      this.numOfApplications = (this.hearing.courtApplications || []).length;
      this.numOfDefendants = (this.casesAndApplicationsGroupedByDefendant || []).length;
      this.numOfCases = (this.hearing.prosecutionCases || []).length;
      this.numOfOffences = this.getNumOfOffences();
    }
  }

  getNumOfOffences() {
    return flatMap(this.casesAndApplicationsGroupedByDefendant, 'prosecutionCases').reduce(
      (offences, currentCase) => offences.concat(currentCase.offences),
      []
    ).length;
  }

  getDefendants() {
    return (this.hearing.prosecutionCases || []).reduce(
      (defendants, currentCase) => defendants.concat(currentCase.defendants),
      []
    );
  }

  getBulkCase(): ProsecutionCaseDetails {
    return this.hearing && this.hearing.prosecutionCases
      ? this.hearing.prosecutionCases.find(kase => kase.isGroupMaster)
      : null;
  }
}
