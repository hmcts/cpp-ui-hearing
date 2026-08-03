import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  ElementRef
} from '@angular/core';
import { TrialTypeEnum } from '../../hearing-events-log/core/models';
import { TrialType } from '../../core/model/shared/trial-type';
import { CrackedIneffectiveSubReason } from '../../core/model/shared/cracked-ineffective-sub-reason';
import { HearingDetail } from '../../core';
import { EXPECTED_HEARING_USER_PERMISSIONS, HearingUserPermissions } from '../../config';
import { CppUserHasPermissionDirective } from '@cpp/users-groups';
import {
  PdkDetailsDirective,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkAutosuggestLiteComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkInsetTextComponent,
  PdkDetailsSummary,
  ValidationError
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'trial-type',
  templateUrl: './trial-type.component.html',
  styleUrls: ['./trial-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CppUserHasPermissionDirective,
    PdkDetailsDirective,
    PdkMarginDirective,
    PdkTypographyDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkAutosuggestLiteComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe,
    PdkGridComponent,
    PdkGridDirective,
    PdkInsetTextComponent,
    PdkDetailsSummary
  ]
})
export class TrialTypeComponent implements OnChanges {
  @Input() trialTypes: TrialType[] = [];
  @Input() hearing: HearingDetail;
  @Input() subReasons: CrackedIneffectiveSubReason[] = [];
  @Input() trialEffectivenessError: ValidationError[] | null = null;
  @Input() citSubreasonEnabled = false;
  @Output() onSaveTrialType: EventEmitter<TrialType> = new EventEmitter();
  @ViewChild('detailsElement', { read: ElementRef }) detailsElement: ElementRef;

  trialTypeOptions = [
    { label: TrialTypeEnum.EFFECTIVE, value: TrialTypeEnum.EFFECTIVE },
    { label: TrialTypeEnum.INEFFECTIVE, value: TrialTypeEnum.INEFFECTIVE },
    { label: TrialTypeEnum.CRACKED, value: TrialTypeEnum.CRACKED },
    { label: TrialTypeEnum.VACATED, value: TrialTypeEnum.VACATED }
  ];

  originalReasonId: string = '';
  originalSubReasonId: string = '';
  originalTrialTypeOptionId: string = '';
  isAccordionOpen = false;

  typeaheadOptions: TrialType[] = [];
  reasonSuggestions: TrialType[] = [];
  subReasonSuggestions: CrackedIneffectiveSubReason[] = [];

  selectedReason: TrialType;
  selectedSubReason: CrackedIneffectiveSubReason;
  trialTypeOptionId = '';

  showTypeahead = false;
  showSelectedReason = false;
  actionDetailsOpen = false;
  label: string;
  currentReasonSearchText: string = '';

  jurisdictionTypes: string[] = [];
  currentPrimaryReasonCode: string;

  constructor(
    @Inject(EXPECTED_HEARING_USER_PERMISSIONS) public expectedPermissions: HearingUserPermissions,
    private cdr: ChangeDetectorRef
  ) {}

  get hasTrialEffectivenessError(): boolean {
    return this.trialEffectivenessError !== null && this.trialEffectivenessError.length > 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.label = this.buildLabel();
    if (this.hearing) {
      this.setJurisdiction();
      this.setInitialValues();
      this.storeOriginalValues();
    }

    if (changes['subReasons'] && changes['subReasons'].currentValue) {
      this.updateSubReasonSuggestions();

      if (this.selectedSubReason) {
        const stillValid = this.subReasons.find(sr => sr.id === this.selectedSubReason.id);
        if (!stillValid) {
          this.selectedSubReason = null;
        }
      } else if (this.hearing?.crackedIneffectiveTrial?.crackedIneffectiveSubReasonId) {
        this.selectedSubReason =
          this.subReasons.find(
            sr => sr.id === this.hearing.crackedIneffectiveTrial.crackedIneffectiveSubReasonId
          ) ?? null;
      }

      this.cdr.markForCheck();
    }
  }

  setJurisdiction(): void {
    this.jurisdictionTypes = this.hearing.jurisdictionType === 'CROWN' ? ['CCM', 'CC'] : ['CCM'];
  }

  buildLabel(): string {
    const { crackedIneffectiveTrial, isEffectiveTrial } = this.hearing;
    if (crackedIneffectiveTrial?.trialType === 'Vacated')
      return 'TRIAL_OUTCOME.VACATED_TRIAL_TITLE';
    if (crackedIneffectiveTrial || isEffectiveTrial) return 'TRIAL_OUTCOME.TRIAL_IS_TITLE';
    return 'TRIAL_OUTCOME.COLLAPSIBLE_TITLE';
  }

  get showSubReasonInput(): boolean {
    return (
      this.citSubreasonEnabled &&
      !!this.selectedReason &&
      this.trialTypeOptionId !== TrialTypeEnum.EFFECTIVE &&
      this.trialTypeOptionId !== TrialTypeEnum.VACATED
    );
  }

  get disableSaveButton(): boolean {
    const trialTypeChanged = this.trialTypeOptionId !== this.originalTrialTypeOptionId;
    const reasonChanged = this.selectedReason?.id !== this.originalReasonId;
    const subReasonChanged = this.selectedSubReason?.id !== this.originalSubReasonId;

    if (!trialTypeChanged && !reasonChanged && !subReasonChanged) {
      return true;
    }

    const type = this.trialTypeOptionId;
    const hasReason = !!this.selectedReason?.id;
    const hasSubReason = !!this.selectedSubReason?.id;

    if (!type) return true;
    if (type === TrialTypeEnum.EFFECTIVE) return false;
    if (type === TrialTypeEnum.VACATED) return !hasReason;

    return this.citSubreasonEnabled ? !(hasReason && hasSubReason) : !hasReason;
  }

  toggleActionDetails(): void {
    this.actionDetailsOpen = !this.actionDetailsOpen;

    if (!this.actionDetailsOpen) {
      this.resetForm();
      this.setInitialValues();
    }
    this.cdr.markForCheck();
  }

  resetForm(): void {
    this.trialTypeOptionId = '';
    this.showSelectedReason = false;
    this.showTypeahead = false;
    this.selectedReason = null;
    this.selectedSubReason = null;
    this.currentPrimaryReasonCode = null;
    this.subReasonSuggestions = [];
  }

  trialOptionSelected(): void {
    this.showSelectedReason = false;
    this.selectedSubReason = null;
    this.currentPrimaryReasonCode = null;
    this.subReasonSuggestions = [];
    this.currentReasonSearchText = '';

    if (this.trialTypeOptionId === TrialTypeEnum.EFFECTIVE) {
      this.showTypeahead = false;
      this.selectedReason = {
        id: TrialTypeEnum.EFFECTIVE,
        trialType: TrialTypeEnum.EFFECTIVE
      } as TrialType;
      this.showSelectedReason = true;
    } else {
      this.showTypeahead = true;
      this.selectedReason = null;
      setTimeout(() => this.filterTypeaheadOptions());
    }
    this.cdr.markForCheck();
  }

  selectReason(value: string): void {
    if (!value) return;

    this.selectedReason = this.trialTypes.find(t => t.id === value);
    if (!this.selectedReason) return;

    this.showTypeahead = false;
    this.showSelectedReason = true;
    this.selectedSubReason = null;
    this.currentPrimaryReasonCode = this.selectedReason.reasonCode;
    this.updateSubReasonSuggestions();
    this.cdr.markForCheck();
  }

  toggleTypeahead(): void {
    this.showTypeahead = !this.showTypeahead;
    this.showSelectedReason = false;
    this.selectedReason = null;
    this.selectedSubReason = null;
    this.currentPrimaryReasonCode = null;
    this.subReasonSuggestions = [];
    this.currentReasonSearchText = '';
    this.cdr.markForCheck();
  }

  saveTrialType(): void {
    const trialTypeToSave = { ...this.selectedReason };
    if (this.citSubreasonEnabled && this.selectedSubReason) {
      trialTypeToSave.crackedIneffectiveSubReasonId = this.selectedSubReason.id;
    }
    if (this.trialTypeOptionId === TrialTypeEnum.VACATED) {
      trialTypeToSave.vacateTrial = true;
    }
    this.onSaveTrialType.emit(trialTypeToSave);
    if (this.detailsElement) {
      this.detailsElement.nativeElement.open = false;
    }
    this.isAccordionOpen = false;
    this.actionDetailsOpen = false;
    this.cdr.markForCheck();
  }

  clearSubReason(): void {
    this.selectedSubReason = null;
    this.updateSubReasonSuggestions();
    this.cdr.markForCheck();
  }

  onReasonInput(searchText?: string): void {
    if (searchText !== undefined) {
      this.currentReasonSearchText = searchText;
    }
    this.filterTypeaheadOptions();
  }

  onSubReasonInput(searchText: string): void {
    this.selectedSubReason = null;

    if (!this.currentPrimaryReasonCode || !this.subReasons) {
      this.subReasonSuggestions = [];
      return;
    }

    const allForCode = this.subReasons.filter(
      sr => sr.primaryReasonCode === this.currentPrimaryReasonCode
    );

    this.subReasonSuggestions =
      !searchText || searchText.trim() === ''
        ? allForCode
        : allForCode.filter(
            reason =>
              reason.subReasonDesc.toLowerCase().includes(searchText.toLowerCase().trim()) ||
              reason.subReasonCode.toLowerCase().includes(searchText.toLowerCase().trim())
          );

    this.cdr.markForCheck();
  }

  initialTrialTypeJurisdiction(): { value: string } {
    if (!this.hearing.crackedIneffectiveTrial?.id) {
      return { value: TrialTypeEnum.EFFECTIVE.toLowerCase() };
    }
    const trialType = this.trialTypes.find(t => t.id === this.hearing.crackedIneffectiveTrial.id);
    return { value: trialType ? trialType.trialType.toLowerCase() : '' };
  }

  private storeOriginalValues(): void {
    if (this.hearing.isEffectiveTrial) {
      this.originalTrialTypeOptionId = TrialTypeEnum.EFFECTIVE;
      this.originalReasonId = TrialTypeEnum.EFFECTIVE;
      this.originalSubReasonId = '';
    } else if (this.hearing.crackedIneffectiveTrial) {
      this.originalTrialTypeOptionId = this.hearing.crackedIneffectiveTrial.trialType;
      this.originalReasonId = this.hearing.crackedIneffectiveTrial.id;
      this.originalSubReasonId =
        this.hearing.crackedIneffectiveTrial.crackedIneffectiveSubReasonId || '';
    } else {
      this.originalTrialTypeOptionId = '';
      this.originalReasonId = '';
      this.originalSubReasonId = '';
    }
  }

  private setInitialValues(): void {
    if (this.hearing.isEffectiveTrial) {
      this.selectedReason = {
        id: TrialTypeEnum.EFFECTIVE,
        trialType: TrialTypeEnum.EFFECTIVE
      } as TrialType;
      this.trialTypeOptionId = TrialTypeEnum.EFFECTIVE;
      this.showSelectedReason = true;
    }

    if (this.hearing.crackedIneffectiveTrial) {
      const trialType = this.trialTypes.find(t => t.id === this.hearing.crackedIneffectiveTrial.id);
      if (trialType) {
        this.selectedReason = trialType;
        this.trialTypeOptionId = trialType.trialType;
        this.currentPrimaryReasonCode = trialType.reasonCode;
        this.showSelectedReason = true;
        this.updateSubReasonSuggestions();

        if (
          this.hearing.crackedIneffectiveTrial.crackedIneffectiveSubReasonId &&
          !this.selectedSubReason
        ) {
          this.selectedSubReason =
            this.subReasons?.find(
              sr => sr.id === this.hearing.crackedIneffectiveTrial.crackedIneffectiveSubReasonId
            ) ?? null;
        }
      }
    }

    if (this.trialTypeOptionId && this.trialTypeOptionId !== TrialTypeEnum.EFFECTIVE) {
      this.filterTypeaheadOptions();
    }
  }

  private updateSubReasonSuggestions(): void {
    this.subReasonSuggestions =
      !this.currentPrimaryReasonCode || !this.subReasons
        ? []
        : this.subReasons.filter(sr => sr.primaryReasonCode === this.currentPrimaryReasonCode);
  }

  private filterTypeaheadOptions(): void {
    this.typeaheadOptions = this.trialTypes.filter(({ trialType, jurisdiction }) => {
      if (this.trialTypeOptionId === TrialTypeEnum.VACATED) {
        return trialType === TrialTypeEnum.VACATED;
      }
      return trialType === this.trialTypeOptionId && this.jurisdictionTypes.includes(jurisdiction);
    });

    if (this.currentReasonSearchText && this.currentReasonSearchText.trim() !== '') {
      const searchText = this.currentReasonSearchText.toLowerCase().trim();
      this.typeaheadOptions = this.typeaheadOptions.filter(
        t =>
          t.reasonShortDescription.toLowerCase().includes(searchText) ||
          t.reasonCode?.toLowerCase().includes(searchText)
      );
    }

    this.typeaheadOptions = this.typeaheadOptions.map(t => ({
      ...t,
      label: t.reasonShortDescription,
      value: t.id
    }));
    this.typeaheadOptions.push({ id: '', value: '', label: '' } as TrialType);
    this.cdr.markForCheck();
  }
}
