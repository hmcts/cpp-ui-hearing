import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { cloneDeep } from 'lodash-es';
import {
  Defendant,
  Offence,
  VerdictType,
  OffenceType,
  LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE,
  HearingDetail
} from '../../../core';
import { DatePipe } from '@angular/common';
import { JurorsSelectorComponent } from './jurors-selector/jurors-selector.component';
import { OffenceSearchComponent } from '../../../shared/components/offence-search/offence-search.component';
import {
  PdkGridComponent,
  PdkGridDirective,
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkMarginDirective,
  PdkInsetTextComponent,
  PdkLinkDirective,
  PdkTextColorDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { FullNamePipe } from '../../../shared/pipes/full-name.pipe';
interface Option {
  value: string;
  label: string;
  categoryType?: string;
}
@Component({
  selector: 'verdict',
  templateUrl: './verdict.component.html',
  imports: [
    DatePipe,
    FormsModule,
    TranslatePipe,
    FullNamePipe,
    JurorsSelectorComponent,
    OffenceSearchComponent,
    PdkGridComponent,
    PdkGridDirective,
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkMarginDirective,
    PdkInsetTextComponent,
    PdkLinkDirective,
    PdkTextColorDirective
  ]
})
export class VerdictComponent implements OnInit, OnChanges {
  @Input() offence: Offence;
  @Input() defendant: Defendant;
  @Input() hasCivilCase: boolean;
  @Input() hearingType: string;
  @Input() allVerdictTypes: VerdictType[];
  @Input() verdictTypesForHearingJurisdiction: VerdictType[];
  @Input() currentHearingDetail: HearingDetail;
  @Output() updateVerdict = new EventEmitter<{
    offence: Offence;
    defendant: Defendant;
  }>();
  @Output() updateDefendantOffence = new EventEmitter<{
    offence: Offence;
    defendant: Defendant;
    offenceType: OffenceType;
  }>();

  allOptions: Option[] = [];
  selectableOptions: Option[] = [];
  open: Record<string, boolean> = {};

  DEFAULT_DESCRIPTIONS = ['Found guilty', 'Found not guilty'];
  CIVIL_CASE_DEFAULT_DESCRIPTIONS = ['Proved', 'Not proved'];

  valueUpdated = false;
  clonedOffence: Offence;

  get currentVerdictType() {
    if (!this.clonedOffence.verdict.isDeleted && this.clonedOffence.verdict.verdictType) {
      return this.clonedOffence.verdict.verdictType.id;
    }
    return undefined;
  }

  ngOnInit(): void {
    this.clonedOffence = cloneDeep(this.offence);
  }

  createStringFromDescription(description: string) {
    return description.replace(/[^A-Za-z0-9]/g, '');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.verdictTypesForHearingJurisdiction &&
      changes.verdictTypesForHearingJurisdiction.currentValue
    ) {
      this.selectableOptions = this.createOptions(this.verdictTypesForHearingJurisdiction);
    }

    if (changes.allVerdictTypes && changes.allVerdictTypes.currentValue) {
      this.allOptions = this.createOptions(this.allVerdictTypes);
    }
  }

  updateOffence(offenceType: OffenceType) {
    if (offenceType) {
      this.updateDefendantOffence.emit({
        offence: {
          ...this.clonedOffence,
          verdict: {
            ...this.clonedOffence.verdict,
            lesserOrAlternativeOffence: {
              offenceCode: offenceType.cjsOffenceCode,
              offenceDefinitionId: offenceType.offenceId,
              offenceTitle: offenceType.title,
              offenceLegislation: offenceType.legislation
            }
          }
        },
        defendant: this.defendant,
        offenceType
      });
    }
  }

  onUpdateVerdict(verdictTypeId: string) {
    // Remove 'lesser or alternative offence' every time a verdict is selected
    delete this.clonedOffence.verdict.lesserOrAlternativeOffence;

    if (verdictTypeId) {
      this.clonedOffence.verdict.verdictType.id = verdictTypeId;
      this.valueUpdated = true;
      this.clonedOffence.verdict.isDeleted = false;

      this.updateVerdict.emit({
        offence: this.clonedOffence,
        defendant: this.defendant
      });
    }
  }

  onJurorsSelect(offence: Offence) {
    const clonedDefendant = cloneDeep(this.defendant);

    const offenceIndex = clonedDefendant.offences.findIndex(o => o.id === offence.id);

    if (offenceIndex > -1) {
      clonedDefendant.offences.splice(offenceIndex, 1, offence);
    }

    this.updateVerdict.emit({ offence, defendant: clonedDefendant });
  }

  toggleOtherVerdicts(offenceId: string): void {
    this.open[offenceId] = !this.open[offenceId];
  }

  // if no options selected, show guilty and not guilty, otherwise just the selected option
  filterOptions(selectedCategory: string, isDeleted: boolean, showAll: boolean): Option[] {
    if (showAll === true) {
      return this.selectableOptions;
    }

    if (this.hasCivilCase) {
      return this.selectableOptions.filter(option =>
        this.CIVIL_CASE_DEFAULT_DESCRIPTIONS.includes(option.label)
      );
    }

    if (selectedCategory && !isDeleted) {
      return [this.allOptions.find(option => option.value === selectedCategory)];
    }

    return this.selectableOptions.filter(option =>
      this.DEFAULT_DESCRIPTIONS.includes(option.label)
    );
  }

  hasJury(id: string): boolean {
    if (!id || !this.verdictTypesForHearingJurisdiction.length) {
      return false;
    }
    const { categoryType } = this.verdictTypesForHearingJurisdiction.find(
      verdictType => verdictType.id === id
    ) || {
      categoryType: undefined
    };
    return !!categoryType && categoryType.match('BY_JURY') !== null;
  }

  isGuiltyButLesserOrAlternativeOffence(value: string): boolean {
    const verdictType = (this.allVerdictTypes || []).find(({ id }) => id === value);
    return !!verdictType
      ? verdictType.cjsVerdictCode === LESSER_OR_ALTERNATIVE_OFFENCE_CJS_VERDICT_CODE
      : false;
  }

  private createOptions(verdictTypes: VerdictType[]): Option[] {
    const clonedVerdictTypes = cloneDeep(verdictTypes);
    clonedVerdictTypes.sort((a, b) => a.sequence - b.sequence);
    return clonedVerdictTypes.map(this.mapVerdictTypeToOption);
  }

  private mapVerdictTypeToOption(type: VerdictType) {
    return {
      value: type.id,
      label: type.description,
      categoryType: type.categoryType
    };
  }

  clear(offence: Offence, defendant: Defendant): void {
    const clonedOffence = cloneDeep(offence);
    clonedOffence.verdict.isDeleted = true;
    clonedOffence.verdict.lesserOrAlternativeOffence = undefined;

    this.updateVerdict.emit({ offence: clonedOffence, defendant });
  }

  canChangeVerdict(offence: Offence) {
    const verdictType = (this.allVerdictTypes || []).find(
      ({ id }) => id === offence.verdict.verdictType.id
    );
    if (!verdictType) {
      return true;
    }
    if (verdictType.jurisdiction === this.currentHearingDetail.jurisdictionType) {
      return true;
    }
    return false;
  }
}
