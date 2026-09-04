import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {
  CourtOfficerRole,
  CourtOfficerTypeaheadOptions,
  CourtSession,
  JudicialMember,
  SelectedJudiciary,
  SessionTypeEnum,
  TypeaheadOption,
  CourtSessionJudiciary
} from '../../../../core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import {
  PdkFormGroupComponent,
  PdkFormGroupDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkFormFieldComponent,
  PdkTypographyDirective,
  PdkTextInputDirective,
  PdkVisuallyHiddenDirective,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkTimeInputComponent,
  PdkAutosuggestLiteComponent
} from '@cpp/pdk';
import { JudiciaryTypeaheadComponent } from '../judiciary-typeahead/judiciary-typeahead.component';
import { UpperCasePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

type CourtOfficerModelGroup = { [role in CourtOfficerRole]: TypeaheadOption };

export interface JudiciaryAutoSuggestOption extends JudicialMember {
  judicialMemberName: string;
}

@Component({
  selector: 'judiciary-form',
  templateUrl: './judiciary-form.component.html',
  styleUrls: ['./judiciary-form.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  imports: [
    PdkFormGroupComponent,
    PdkFormGroupDirective,
    FormsModule,
    PdkGridComponent,
    PdkGridDirective,
    PdkFormFieldComponent,
    JudiciaryTypeaheadComponent,
    PdkTypographyDirective,
    PdkTextInputDirective,
    PdkVisuallyHiddenDirective,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkTimeInputComponent,
    PdkAutosuggestLiteComponent,
    UpperCasePipe,
    TranslatePipe
  ]
})
export class JudiciaryFormComponent implements OnChanges {
  @Input() courtSession: CourtSession;
  @Input() sessionType: SessionTypeEnum;
  @Input() courtOfficerOptions: CourtOfficerTypeaheadOptions;

  @Output() onEnableSave: EventEmitter<void> = new EventEmitter();

  judiciaryFields: JudicialMember[] = [null, null, null];

  courtOfficerModelGroup: CourtOfficerModelGroup = {
    courtClerks: null,
    courtAssociate: null,
    legalAdvisers: null
  };

  filteredOfficerSuggestions: CourtOfficerTypeaheadOptions = {
    courtClerks: [],
    courtAssociate: [],
    legalAdvisers: []
  };

  selectedAmJudiciaryIndex: number;
  selectedJudiciaries: SelectedJudiciary[] = [
    {
      index: 0,
      isEnabled: false,
      value: null
    },
    {
      index: 1,
      isEnabled: false,
      value: null
    },
    {
      index: 2,
      isEnabled: false,
      value: null
    }
  ];
  otherJudiciaries: string[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (this.hasChange(changes.courtSession) && this.courtOfficerOptions) {
      this.courtOfficerModelGroup = this.toCourtOfficerModelGroup(
        this.courtSession,
        this.courtOfficerOptions
      );
    }
    if (this.hasChange(changes.courtOfficerOptions) && this.courtSession) {
      this.courtOfficerModelGroup = this.toCourtOfficerModelGroup(
        this.courtSession,
        this.courtOfficerOptions
      );
    }
    if (this.hasNewChange(changes.courtSession)) {
      this.initialiseJudiciaries(this.courtSession);
    }
  }

  isChairmanDisabled(index: number) {
    return !this.selectedJudiciaries[index]?.isEnabled;
  }

  onSetJudiciaryTypeahead(event: JudicialMember, index: number) {
    this.judiciaryFields = this.judiciaryFields.map((judiciary, fieldIndex) =>
      fieldIndex === index ? event : judiciary
    );
    if (!!event) {
      this.selectedJudiciaries[index] = {
        ...this.selectedJudiciaries[index],
        value: event.id,
        isEnabled: true
      };
    } else {
      this.selectedJudiciaries[index].isEnabled = false;
      if (index === this.selectedAmJudiciaryIndex) {
        this.selectedAmJudiciaryIndex = null;
      }
    }
    this.enableSave();
  }

  onChairmanChange(event: any) {
    this.selectedAmJudiciaryIndex = event.value;
    this.enableSave();
  }

  onAddAnotherJudiciary() {
    const index = this.judiciaryFields.length;
    this.judiciaryFields = [...this.judiciaryFields, null];
    this.selectedJudiciaries = [
      ...this.selectedJudiciaries,
      { index, isEnabled: false, value: null }
    ];
  }

  addOtherJudiciary(event: any): void {
    if (event) {
      this.enableSave();
    }
  }

  getJudiciaryWithId(index: number): JudicialMember {
    return this.judiciaryFields[index] || null;
  }

  handleSearchSuggestions(text: string, role: keyof CourtOfficerTypeaheadOptions) {
    this.filteredOfficerSuggestions[role] = this.courtOfficerOptions[role]
      .filter(
        (option: TypeaheadOption) => option.label.toLowerCase().indexOf(text.toLowerCase()) !== -1
      )
      .slice(0, 50);
  }

  selectCourtOfficer() {
    this.enableSave();
  }

  enableSave(): void {
    this.onEnableSave.emit();
  }

  onTimeChange(event: any): void {
    if (event) {
      this.enableSave();
    }
  }

  private initialiseJudiciaries(courtSession: CourtSession): void {
    const judiciaries = courtSession.judiciaries || [];
    const withIds = judiciaries.filter(judiciary => judiciary.judiciaryId);
    const fieldCount = Math.max(3, withIds.length);
    this.selectedAmJudiciaryIndex = null;

    this.judiciaryFields = [
      ...withIds.map(judiciary => judiciary.judicialMember),
      ...Array(fieldCount - withIds.length).fill(null)
    ];
    this.selectedJudiciaries = this.prepareSelectedJudiciaires(withIds, fieldCount);
    this.otherJudiciaries = judiciaries
      .filter(judiciary => !judiciary.judiciaryId && judiciary.judiciaryName)
      .map(judiciary => judiciary.judiciaryName);
  }

  private toCourtOfficerModelGroup(
    courtSession: CourtSession,
    courtOfficerOptions: CourtOfficerTypeaheadOptions
  ): CourtOfficerModelGroup {
    const { courtClerkId, courtAssociateId, legalAdviserId } = courtSession;
    return {
      courtClerks: this.getPreSelectedCourtOfficerById(
        courtClerkId,
        courtOfficerOptions.courtClerks
      ),
      courtAssociate: this.getPreSelectedCourtOfficerById(
        courtAssociateId,
        courtOfficerOptions.courtAssociate
      ),
      legalAdvisers: this.getPreSelectedCourtOfficerById(
        legalAdviserId,
        courtOfficerOptions.legalAdvisers
      )
    };
  }

  private prepareSelectedJudiciaires(
    judiciaries: CourtSessionJudiciary[],
    fieldCount: number
  ): SelectedJudiciary[] {
    return Array.from({ length: fieldCount }, (_, index) => {
      const judiciary = judiciaries[index];
      if (judiciary?.benchChairman) {
        this.selectedAmJudiciaryIndex = index;
      }
      return {
        index,
        value: judiciary?.judiciaryId || null,
        isEnabled: Boolean(judiciary?.judiciaryId)
      };
    });
  }

  private getPreSelectedCourtOfficerById(
    officerId: string,
    courtOfficerOptions: TypeaheadOption[]
  ): TypeaheadOption {
    const officer = courtOfficerOptions.find(option => option.id === officerId);
    return officer
      ? {
          id: officer.id,
          label: officer.label
        }
      : null;
  }

  private hasChange(change: SimpleChange): boolean {
    return change && change.currentValue;
  }

  private hasNewChange(change: SimpleChange): boolean {
    return change && change.currentValue && change.currentValue !== change.previousValue;
  }
}
