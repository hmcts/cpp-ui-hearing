import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';
import { cloneDeep } from 'lodash-es';
import { NgForm, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PdkButtonDirective,
  PdkForm,
  PdkLinkDirective,
  PdkMarginDirective,
  ValidationError
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { PleaGroupComponent } from './plea/plea-group.component';
import {
  Defendant,
  PleaData,
  IndicatedPleaData,
  SelectOption,
  PleaOption,
  ApplyDecisionPayload,
  CourtApplication,
  Offence,
  ClearPleaInfo,
  allocationCodesIndicatedPleaOnly,
  GroupedPlea,
  AlcoholLevelMethod
} from '../../core';

@Component({
  selector: 'plea-form',
  template: `
    <form pdk-form (errors)="handleError($event)" (validSubmit)="submit()" novalidate>
      @for (plea of pleas; track plea.caseURN) {
      <plea-group
        [plea]="plea"
        [isDelegatedPowers]="isDelegatedPowers"
        [hasCivilCase]="hasCivilCase"
        [courtApplications]="courtApplications"
        [motReasonOptions]="motReasonOptions"
        [selectedHearingDate]="selectedHearingDate"
        [sentencingDecisionOptions]="sentencingDecisionOptions"
        [hearingType]="hearingType"
        [standardPleaOptions]="standardPleaOptions"
        [eitherWayPleaOptions]="eitherWayPleaOptions"
        [indicatedPleaOptions]="indicatedPleaOptions"
        [magsExtraPleaOptions]="magsExtraPleaOptions"
        [crownExtraPleaOptions]="crownExtraPleaOptions"
        [alcoholMethodsOptions]="alcoholMethodsOptions"
        [civilCasePleaOptions]="civilCasePleaOptions"
        (updatePlea)="updatePlea($event)"
        (clearOffencePlea)="clearPlea($event)"
        (applyDecision)="applyDecision.emit($event)"
      >
      </plea-group>
      }
      <button data-role="submit-pleas" pdk-button type="submit">
        {{ 'ENTER_PLEAS.SAVE_AND_CONTINUE' | translate }}
      </button>

      <div pdk-margin-top="4">
        <a pdk-link unvisited [routerLink]="['/manage', this.hearingId]">{{
          'COMMON.CANCEL' | translate
        }}</a>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PdkForm,
    PdkLinkDirective,
    RouterLink,
    TranslatePipe,
    PleaGroupComponent,
    PdkButtonDirective,
    PdkMarginDirective
  ]
})
export class PleaFormComponent {
  @ViewChild(NgForm) form: NgForm;

  @Input() isDelegatedPowers: boolean;
  @Input() hearingId: string;
  @Input() hasCivilCase: boolean;
  @Input() courtApplications: CourtApplication[];
  @Input() pleas: GroupedPlea[];
  @Input() motReasonOptions: SelectOption[];
  @Input() sentencingDecisionOptions: SelectOption[];
  @Input() selectedHearingDate: string;
  @Input() hearingType: string;
  @Input() standardPleaOptions: PleaOption[];
  @Input() eitherWayPleaOptions: PleaOption[];
  @Input() indicatedPleaOptions: PleaOption[];
  @Input() magsExtraPleaOptions: PleaOption[];
  @Input() crownExtraPleaOptions: PleaOption[];
  @Input() alcoholMethodsOptions: AlcoholLevelMethod[];
  @Input() civilCasePleaOptions: PleaOption[];
  @Output() onSubmit: EventEmitter<PleaData[]> = new EventEmitter();
  @Output() onPleaChange: EventEmitter<PleaData[]> = new EventEmitter();
  @Output() onError: EventEmitter<ValidationError[]> = new EventEmitter();
  @Output() applyDecision: EventEmitter<ApplyDecisionPayload> = new EventEmitter();

  pleaData: (IndicatedPleaData | PleaData)[] = [];

  updatePlea({ offence, defendant }: { offence: Offence; defendant: Defendant }) {
    const {
      indicatedPlea,
      allocationDecision: { allocationDecisionDate }
    } = offence;
    this.pleaData = this.pleaData.filter(({ offenceId }) => offenceId !== offence.id);

    if (
      (offence.modeOfTrial === 'Either Way' ||
        (offence.modeOfTrial === 'Indictable' && defendant.isYouth)) &&
      (!allocationDecisionDate ||
        (!!indicatedPlea &&
          (indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY' ||
            !indicatedPlea.indicatedPleaValue)) ||
        (!!allocationDecisionDate && allocationDecisionDate === this.selectedHearingDate))
    ) {
      this.pleaData.push(this.getIndicatedPleaData(offence, defendant, this.isDelegatedPowers));
    } else if (offence.plea.pleaValue) {
      this.pleaData.push(this.getPleaData(offence, this.isDelegatedPowers, defendant));
    } else if (offence.plea && !offence.plea.pleaValue) {
      this.pleaData.push(this.getPleaData(offence, this.isDelegatedPowers, defendant));
    }

    this.onPleaChange.emit(this.pleaData);
  }

  clearPlea({ offence, isIndicatedPlea, defendant }: ClearPleaInfo): void {
    this.pleaData = this.pleaData.filter(({ offenceId }) => offenceId !== offence.id);

    if (isIndicatedPlea) {
      this.pleaData.push(this.getIndicatedPleaData(offence, defendant, this.isDelegatedPowers));
    } else {
      this.pleaData.push(this.getPleaData(offence, this.isDelegatedPowers, defendant));
    }

    this.onPleaChange.emit(this.pleaData);
  }

  getIndicatedPleaData(
    offence: Offence,
    defendant: Defendant,
    isDelegatedPowers: boolean
  ): IndicatedPleaData {
    const offencePayload = cloneDeep(offence);
    const { allocationDecision } = offencePayload;
    const { prosecutionCaseId, id } = defendant;
    const data: IndicatedPleaData = {
      defendantId: id,
      offenceId: offence.id,
      prosecutionCaseId,
      plea: {
        ...offencePayload.plea,
        isDelegatedPowers,
        pleaDate: this.selectedHearingDate
      },
      indicatedPlea: {
        ...offencePayload.indicatedPlea,
        indicatedPleaDate: this.selectedHearingDate,
        source: 'IN_COURT'
      }
    };

    if (
      data.indicatedPlea.indicatedPleaValue !== 'INDICATED_GUILTY' ||
      !data.indicatedPlea.indicatedPleaValue
    ) {
      data['allocationDecision'] = {
        ...allocationDecision,
        offenceId: offencePayload.id,
        allocationDecisionDate: !!offencePayload.allocationDecision.allocationDecisionDate
          ? offencePayload.allocationDecision.allocationDecisionDate
          : this.selectedHearingDate
      };

      if (
        data.allocationDecision &&
        data.allocationDecision.courtIndicatedSentence &&
        !allocationDecision.courtIndicatedSentence.courtIndicatedSentenceTypeId
      ) {
        delete data.allocationDecision.courtIndicatedSentence;
      }
    }

    if (
      (data.plea.pleaValue &&
        data.indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY' &&
        this.hearingType === 'MAGISTRATES') ||
      (data.allocationDecision &&
        allocationCodesIndicatedPleaOnly.includes(data.allocationDecision.motReasonCode) &&
        this.hearingType === 'MAGISTRATES')
    ) {
      data.plea.pleaValue = null;
      data.plea.pleaDate = null;
    }

    if (!data.plea.pleaValue) {
      data.plea.pleaDate = null;
    }

    if (!data.indicatedPlea.indicatedPleaValue) {
      data.indicatedPlea.indicatedPleaDate = null;
    }
    return data;
  }

  getPleaData(offence: Offence, isDelegatedPowers: boolean, defendant: Defendant): PleaData {
    const { prosecutionCaseId, id } = defendant;

    const offenceCopy = cloneDeep(offence);
    delete offenceCopy.allocationDecision.courtIndicatedSentence;

    let currentSequenceNumber = offence.allocationDecision?.sequenceNumber || 90;
    if (offenceCopy.modeOfTrial === 'Indictable') {
      currentSequenceNumber = offence.allocationDecision?.sequenceNumber || 100;
    }

    const {
      code: motReasonCode,
      label: motReasonDescription,
      id: motReasonId,
      sequenceNumber
    } = this.motReasonOptions.find(({ sequenceNumber: seqNo }) => seqNo === currentSequenceNumber);

    return {
      defendantId: id,
      offenceId: offenceCopy.id,
      prosecutionCaseId,
      allocationDecision: {
        ...offenceCopy.allocationDecision,
        motReasonCode,
        motReasonDescription,
        motReasonId: offenceCopy.plea.pleaValue ? motReasonId : null,
        allocationDecisionDate: !!offenceCopy.allocationDecision.allocationDecisionDate
          ? offenceCopy.allocationDecision.allocationDecisionDate
          : this.selectedHearingDate,
        sequenceNumber
      },
      plea: {
        ...offenceCopy.plea,
        isDelegatedPowers,
        pleaDate: offenceCopy.plea.pleaValue ? this.selectedHearingDate : null
      }
    };
  }

  handleError(event: ValidationError[]) {
    this.onError.emit(event);
  }

  submit() {
    this.pleas.forEach(({ withCount, withoutCount }) => {
      withCount.forEach(groupedPlea =>
        groupedPlea.defendants.forEach(defendant =>
          this.updatePlea({ offence: defendant.offences[0], defendant: defendant })
        )
      );
      withoutCount.forEach(defendant =>
        defendant.offences.forEach(offence => this.updatePlea({ offence, defendant }))
      );
    });
    this.onSubmit.emit(this.pleaData);
  }
}
