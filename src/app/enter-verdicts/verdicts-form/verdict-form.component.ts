import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  ValidationError,
  PdkFormComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkMarginDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import {
  Defendant,
  GroupedPlea,
  Offence,
  Verdict,
  UpdateVerdictData,
  VerdictType,
  OffenceType,
  HearingDetail
} from '../../core';
import { FormsModule } from '@angular/forms';
import { VerdictGroupComponent } from './verdict/verdict-group.component';
import { TranslatePipe } from '@ngx-translate/core';
export interface VerdictForm {
  defendants: {
    id: string;
    offences: {
      id: string;
      verdict: Verdict;
      offenceDefinitionId: string;
      offenceCode: string;
      offenceTitle: string;
      offenceLegislation: string;
    }[];
  }[];
  caseId: string;
}
@Component({
  selector: 'verdict-form',
  template: `
    <form
      #form="ngForm"
      pdk-form
      novalidate
      (errors)="handleError($event)"
      (validSubmit)="submit()"
    >
      @for (plea of pleas; track trackByPleaAndDate(plea)) {
      <verdict-group
        [plea]="plea"
        [hasCivilCase]="hasCivilCase"
        [hearingType]="hearingType"
        [allVerdictTypes]="allVerdictTypes"
        [verdictTypesForHearingJurisdiction]="verdictTypesForHearingJurisdiction"
        [currentHearingDetail]="currentHearingDetail"
        (updateVerdict)="updateVerdict($event)"
        (updateDefendantOffence)="updateDefendantOffence($event)"
      >
      </verdict-group>
      }
      <button data-role="submit-verdicts" pdk-button type="submit" [disabled]="disableSaveVerdict">
        {{ 'ENTER_VERDICTS.SAVE_AND_CONTINUE' | translate }}
      </button>
      <div pdk-margin-top="4">
        <a pdk-link href="javascript:void(0);" (click)="cancelVerdict.emit()">
          {{ 'COMMON.CANCEL' | translate }}
        </a>
      </div>
    </form>
  `,
  imports: [
    FormsModule,
    PdkFormComponent,
    VerdictGroupComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkMarginDirective,
    PdkLinkDirective,
    TranslatePipe
  ]
})
export class VerdictFormComponent implements OnInit {
  @Input() pleas: GroupedPlea[];
  @Input() hearingType: string;
  @Input() hasCivilCase: boolean;
  @Input() allVerdictTypes: VerdictType[];
  @Input() verdictTypesForHearingJurisdiction: VerdictType[];
  @Input() currentHearingDetail: HearingDetail;
  @Output() onSubmit: EventEmitter<string[]> = new EventEmitter();
  @Output() onError: EventEmitter<ValidationError[]> = new EventEmitter();
  @Output() updateVerdictData: EventEmitter<UpdateVerdictData[]> = new EventEmitter();
  @Output() updateDefendantOffenceData = new EventEmitter<{
    offence: Offence;
    defendant: Defendant;
    offenceType: OffenceType;
  }>();
  @Output() cancelVerdict: EventEmitter<void> = new EventEmitter();

  verdictData: UpdateVerdictData[] = [];
  errors: ValidationError[];
  changedOffenceIds: Set<string> = new Set();
  disableSaveVerdict = false;

  ngOnInit() {
    this.disableSaveVerdict = (this.pleas || []).some(plea => {
      return plea.withoutCount.some(defendant => {
        return defendant.offences.some(offence => {
          const verdictType = (this.allVerdictTypes || []).find(
            ({ id }) => id === offence.verdict.verdictType.id
          );

          if (
            verdictType &&
            verdictType.jurisdiction !== this.currentHearingDetail.jurisdictionType
          ) {
            return true;
          }
          return false;
        });
      });
    });
  }

  updateVerdict({ offence, defendant }: { offence: Offence; defendant: Defendant }) {
    this.verdictData = [];
    this.verdictData.push(this.getVerdictData(offence, defendant));
    this.changedOffenceIds.add(offence.id);

    this.updateVerdictData.emit(this.verdictData);
  }

  submit() {
    if (!this.errors) {
      this.onSubmit.emit(Array.from(this.changedOffenceIds));
    }
  }

  handleError(errors: ValidationError[]) {
    this.errors = errors;
    this.onError.emit(errors);
  }

  getVerdictData(offence: Offence, defendant: Defendant) {
    const { prosecutionCaseId, id } = defendant;
    const offenceCopy = offence;
    const currentOption = this.verdictTypesForHearingJurisdiction.find(
      verdictType => verdictType.id === offence.verdict.verdictType.id
    );
    return {
      defendantId: id,
      offenceId: offenceCopy.id,
      prosecutionCaseId,
      verdict: {
        ...offenceCopy.verdict,
        verdictType: {
          ...offenceCopy.verdict.verdictType,
          id: currentOption?.id || undefined,
          category: currentOption?.category || '',
          categoryType: currentOption?.categoryType || '',
          description: currentOption?.description || ''
        }
      }
    };
  }

  updateDefendantOffence({
    offence,
    defendant,
    offenceType
  }: {
    offence: Offence;
    defendant: Defendant;
    offenceType: OffenceType;
  }) {
    this.changedOffenceIds.add(offence.id);
    this.updateDefendantOffenceData.emit({ offence, defendant, offenceType });
  }

  // Until this verdic form and enter pleas form are refactored
  // We need a unique trackBy to allow recreation of the components when verdict is cleared.
  trackByPleaAndDate(plea: GroupedPlea) {
    return `${plea.caseURN}-${(Date.now() * Math.random()).toString()}`;
  }
}
