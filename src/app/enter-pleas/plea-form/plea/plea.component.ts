import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { cloneDeep } from 'lodash-es';
import {
  AllocationDecision,
  CPPDate,
  Defendant,
  getCPPDate,
  Offence,
  PleaOption,
  SelectOption,
  OffenceType,
  ApplyDecisionPayload,
  CourtApplication,
  ClearPleaInfo,
  allocationCodesIndicatedPleaOnly
} from '../../../core';

import {
  PdkFormFieldComponent,
  PdkGrid,
  PdkGridComponent,
  PdkSelectComponent,
  PdkMarginDirective,
  PdkTextColorDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { PleaOptionsComponent } from './plea-options.component';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FullNamePipe } from '../../../shared/pipes/full-name.pipe';
@Component({
  selector: 'plea',
  templateUrl: './plea.component.html',
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    PleaOptionsComponent,
    PdkFormFieldComponent,
    PdkGrid,
    PdkGridComponent,
    PdkSelectComponent,
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkLinkDirective,
    FullNamePipe
  ]
})
export class PleaComponent implements OnInit {
  @Input() offence: Offence;
  @Input() defendant: Defendant;
  @Input() hearingId: string;
  @Input() hasCivilCase: boolean;
  @Input() courtApplications: CourtApplication[];
  @Input() motReasonOptions: SelectOption[];
  @Input() sentencingDecisionOptions: SelectOption[];
  @Input() isDelegatedPowers: boolean;
  @Input() selectedHearingDate: string;
  @Input() hearingType: string;
  @Input() standardPleaOptions: PleaOption[] = [];
  @Input() eitherWayPleaOptions: PleaOption[] = [];
  @Input() indicatedPleaOptions: PleaOption[] = [];
  @Input() magsExtraPleaOptions: PleaOption[] = [];
  @Input() crownExtraPleaOptions: PleaOption[] = [];
  @Input() civilCasePleaOptions: PleaOption[] = [];
  @Output() updatePlea: EventEmitter<{
    offence: Offence;
    defendant: Defendant;
  }> = new EventEmitter();
  @Output() applyDecision: EventEmitter<ApplyDecisionPayload> = new EventEmitter();
  @Output() clearOffencePlea: EventEmitter<ClearPleaInfo> = new EventEmitter();

  magsPleaOnlyOptions: PleaOption[] = [];
  crownPleaOnlyOptions: PleaOption[] = [];
  additionalOptions: PleaOption[] = [];
  crownCourtPleaAppend = '-CROWN';
  magsPleaAppend = '-MAGS';

  defendantDecisionOptions: SelectOption[];
  cppDateUtil: CPPDate;

  ngOnInit() {
    this.cppDateUtil = getCPPDate();
    this.magsPleaOnlyOptions = this.getMagsPleaOnlyOptions();
    this.crownPleaOnlyOptions = this.getCrownPleaOnlyOptions();
    this.additionalOptions = this.withoutStandardOptions([
      ...this.magsExtraPleaOptions,
      ...this.crownExtraPleaOptions
    ]);
  }

  showApplyAll(offence: Offence) {
    if (
      this.defendant &&
      (this.defendant.offences || []).filter(off => off.modeOfTrial === 'Either Way').length > 1 &&
      offence &&
      offence.modeOfTrial === 'Either Way' &&
      offence.allocationDecision &&
      offence.allocationDecision.motReasonId
    ) {
      return true;
    }

    return false;
  }

  isGuiltyToLesserOffenceNamely(pleaValue = ''): boolean {
    return (
      pleaValue === 'GUILTY_LESSER_OFFENCE_NAMELY' || pleaValue === 'GUILTY_TO_ALTERNATIVE_OFFENCE'
    );
  }

  setIndicatedPlea(offence: Offence, indicatedPleaValue: string) {
    if (indicatedPleaValue) {
      const clonedOffence = cloneDeep(offence);
      clonedOffence.indicatedPlea.indicatedPleaValue = indicatedPleaValue;
      this.update(clonedOffence);
    }
  }

  clearPlea(offence: Offence, isIndicatedPlea: boolean): void {
    const clonedOffence = cloneDeep(offence);

    if (isIndicatedPlea) {
      clonedOffence.indicatedPlea.indicatedPleaValue = null;
      clonedOffence.indicatedPlea.indicatedPleaDate = null;
    } else {
      clonedOffence.allocationDecision.motReasonCode = null;
      clonedOffence.allocationDecision.motReasonDescription = null;
      clonedOffence.allocationDecision.motReasonId = null;
      clonedOffence.plea.pleaDate = null;
      clonedOffence.plea.pleaValue = null;
    }

    const defendantOfOffence = cloneDeep(this.defendant);
    delete defendantOfOffence.offences;

    this.clearOffencePlea.emit({
      offence: clonedOffence,
      defendant: this.defendant,
      isIndicatedPlea
    });
  }

  setSentencingDecision(offence: Offence, id: string): void {
    const clonedOffence = cloneDeep(offence);

    clonedOffence.allocationDecision.courtIndicatedSentence.courtIndicatedSentenceTypeId = id;

    if (id) {
      const { label: courtIndicatedSentenceDescription, id: courtIndicatedSentenceTypeId } =
        this.sentencingDecisionOptions.find(({ value }) => value === id);

      clonedOffence.allocationDecision.courtIndicatedSentence = {
        courtIndicatedSentenceTypeId,
        courtIndicatedSentenceDescription
      };
    }
    this.updatePlea.emit({ offence: clonedOffence, defendant: this.defendant });
  }

  disableEitherWayPlea(offence: Offence): boolean {
    if (offence.indicatedPlea && offence.indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY') {
      return true;
    }

    if (allocationCodesIndicatedPleaOnly.includes(offence.allocationDecision.motReasonCode)) {
      return true;
    }
    return false;
  }

  disableAllocationDecision(offence: Offence): boolean {
    return offence.indicatedPlea && offence.indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY';
  }

  disableSentencingDecision(offence: Offence): boolean {
    return offence.indicatedPlea && offence.indicatedPlea.indicatedPleaValue === 'INDICATED_GUILTY';
  }

  updateAllocationDecision(offence: Offence, id: string): void {
    const clonedOffence = cloneDeep(offence);

    if (!id) {
      clonedOffence.allocationDecision.motReasonId = null;
      this.updatePlea.emit({ offence: clonedOffence, defendant: this.defendant });
      return;
    }

    const {
      sequenceNumber,
      label: motReasonDescription,
      id: motReasonId,
      code: motReasonCode
    } = this.motReasonOptions.find(({ value }) => value === id);

    clonedOffence.allocationDecision = {
      ...clonedOffence.allocationDecision,
      sequenceNumber,
      motReasonCode,
      motReasonId,
      motReasonDescription
    };

    this.updatePlea.emit({ offence: clonedOffence, defendant: this.defendant });
  }

  update(offence: Offence, event?: string): void {
    const clonedOffence = cloneDeep(offence);
    if (event) {
      // we need to remember to remove the suffix we added for CROWN pleas
      event = event.replace(this.crownCourtPleaAppend, '');
      event = event.replace(this.magsPleaAppend, '');
      clonedOffence.plea.pleaValue = event;
      clonedOffence.plea.lesserOrAlternativeOffence = null;
    }

    this.updatePlea.emit({ offence: clonedOffence, defendant: this.defendant });
  }

  updateLesserOrAlternativeOffence(offenceType: OffenceType, offence: Offence): void {
    const clonedOffence = cloneDeep(offence);

    clonedOffence.plea.lesserOrAlternativeOffence = {
      offenceDefinitionId: offenceType.offenceId,
      offenceCode: offenceType.cjsOffenceCode,
      offenceTitle: offenceType.title,
      offenceLegislation: offenceType.legislation
    };
    this.updatePlea.emit({ offence: clonedOffence, defendant: this.defendant });
  }

  getDelegatedPowersForDefendant(offence: Offence): boolean {
    const {
      plea: { delegatedPowers }
    } = offence;

    return !!delegatedPowers;
  }

  showEitherWayMOTPleaForm(
    modeOfTrial: string,
    allocationDecision: AllocationDecision,
    hearingType: string,
    isYouth: boolean = false
  ): boolean {
    // Rules defined as stated in: https://tools.hmcts.net/jira/browse/CRC-11313
    return (
      hearingType === 'MAGISTRATES' &&
      (modeOfTrial === 'Either Way' || (modeOfTrial === 'Indictable' && isYouth)) &&
      (!allocationDecision.allocationDecisionDate ||
        (allocationDecision.allocationDecisionDate &&
          (this.cppDateUtil.isBefore(
            this.selectedHearingDate,
            allocationDecision.allocationDecisionDate
          ) ||
            allocationDecision.allocationDecisionDate === this.selectedHearingDate)))
    );
  }

  showSentencingIndication(modeOfTrial: string): boolean {
    return modeOfTrial !== 'Indictable';
  }

  showIndicatedPlea(modeOfTrial: string, isYouth: boolean = false): boolean {
    if (modeOfTrial === 'Indictable') {
      return isYouth;
    }

    return true;
  }

  showSummaryMOTPleaForm(
    modeOfTrial: string,
    allocationDecision: AllocationDecision,
    hearingType: string,
    isYouth = false
  ): boolean {
    if (modeOfTrial === 'Indictable' && isYouth && hearingType === 'MAGISTRATES') {
      return false;
    } else {
      return (
        modeOfTrial !== 'Either Way' ||
        this.isMOTCapturedPreviously(modeOfTrial, allocationDecision, hearingType)
      );
    }
  }

  private isMOTCapturedPreviously(
    modeOfTrial: string,
    allocationDecision: AllocationDecision,
    hearingType: string,
    isYouth = false
  ): boolean {
    return (
      ((modeOfTrial === 'Either Way' || (modeOfTrial === 'Indictable' && isYouth)) &&
        hearingType === 'CROWN') ||
      this.cppDateUtil.isAfter(this.selectedHearingDate, allocationDecision.allocationDecisionDate)
    );
  }

  private withoutStandardOptions(
    options: { label: string; value: string }[]
  ): { label: string; value: string }[] {
    const notStardard = options.filter(option => {
      return !this.standardPleaOptions.find(stdOption => stdOption.value === option.value);
    });
    if (notStardard.length) {
      return [...new Map(notStardard.map(option => [option.value, option])).values()];
    }
    return [];
  }

  private getMagsPleaOnlyOptions() {
    return this.withoutStandardOptions(this.magsExtraPleaOptions).map(option => ({
      ...option,
      value: option.value + this.magsPleaAppend
    }));
  }

  private getCrownPleaOnlyOptions() {
    return this.withoutStandardOptions(this.crownExtraPleaOptions).map(option => ({
      ...option,
      value: option.value + this.crownCourtPleaAppend
    }));
  }
}
