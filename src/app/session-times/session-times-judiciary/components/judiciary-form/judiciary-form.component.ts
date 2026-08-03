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

interface JudiciaryModelGroup {
  withIds: JudicialMember[];
  withNamesOnly: string[];
}

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

  judiciaryModelGroup: JudiciaryModelGroup = {
    withIds: [],
    withNamesOnly: []
  };

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
      this.judiciaryModelGroup = this.toJudiciaryModelGroup(this.courtSession);
    }
  }

  isChairmanDisabled(index: number) {
    return this.selectedJudiciaries[index].isEnabled === false;
  }

  onSetJudiciaryTypeahead(event: JudicialMember, index: number) {
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
    this.otherJudiciaries.push('');
  }

  addOtherJudiciary(event: any): void {
    if (event) {
      this.enableSave();
    }
  }

  getJudiciaryWithId(index: number): JudicialMember {
    const withIds = this.judiciaryModelGroup.withIds;
    return withIds.length > index ? withIds[index] : null;
  }

  handleSearchSuggestions(text: string, role: keyof CourtOfficerTypeaheadOptions) {
    this.filteredOfficerSuggestions[role] = this.courtOfficerOptions[role].filter(
      (option: TypeaheadOption) => option.label.toLowerCase().indexOf(text.toLowerCase()) !== -1
    );
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

  private toJudiciaryModelGroup(courtSession: CourtSession): JudiciaryModelGroup {
    const judiciaries = courtSession.judiciaries;

    let modelGroup = {
      ...this.judiciaryModelGroup
    };
    if (judiciaries) {
      this.selectedJudiciaries = this.prepareSelectedJudiciaires(judiciaries);

      const withIds = judiciaries.filter(j => j.judiciaryId).map(j => j.judicialMember);
      const withNamesOnly = judiciaries
        .filter(j => !j.judiciaryId && j.judiciaryName)
        .map(j => j.judiciaryName);
      this.otherJudiciaries = [...withNamesOnly];
      modelGroup = {
        withIds,
        withNamesOnly
      };
    }

    return modelGroup;
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

  private prepareSelectedJudiciaires(judiciaries: CourtSessionJudiciary[]): SelectedJudiciary[] {
    const matching = judiciaries
      .filter(j => j.judiciaryId)
      .map((withId, index) => {
        if (!!withId.benchChairman) {
          this.selectedAmJudiciaryIndex = index;
        }
        return {
          index,
          value: withId.judicialMember.id,
          isEnabled: true
        } as SelectedJudiciary;
      });

    const shouldFill = matching.length < this.selectedJudiciaries.length;
    return [
      ...matching,
      ...(shouldFill
        ? this.selectedJudiciaries.slice(matching.length, this.selectedJudiciaries.length)
        : [])
    ];
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
