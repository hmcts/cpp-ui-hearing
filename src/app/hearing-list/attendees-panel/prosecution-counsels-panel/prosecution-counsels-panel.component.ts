import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { v4 as uuid } from 'uuid';
import { CounselsCache, ProsecutionCounsel } from '../../../core';
import { counselPrefix, CounselModelGroup } from '../model/counsel-model-group';
import { AutoSuggestOption } from '../../../core/model/autosuggest-option';
import { cloneDeep } from 'lodash-es';
import { ProsecutionCaseSummary } from '../../../core/model/shared/prosecution-case-summary';
import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkLinkDirective,
  PdkFormFieldComponent,
  PdkAutosuggestLiteComponent,
  PdkTextInputDirective,
  PdkCheckboxGroupComponent
} from '@cpp/pdk';

import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'prosecution-counsels-panel',
  templateUrl: './prosecution-counsels-panel.component.html',
  styleUrls: ['./prosecution-counsels-panel.component.scss'],
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkLinkDirective,
    PdkFormFieldComponent,
    PdkAutosuggestLiteComponent,
    PdkTextInputDirective,
    PdkCheckboxGroupComponent,
    TranslatePipe
  ]
})
export class ProsecutionCounselsPanelComponent implements OnInit, OnChanges {
  @Input() counselsCacheOptions: CounselsCache;
  @Output() onUpdateProsecutionCounsel: EventEmitter<{
    pc?: ProsecutionCounsel;
    removeIndex?: number;
  }> = new EventEmitter();
  @Input() prosecutionCounsels: ProsecutionCounsel[];
  @Input() prosecutionCasesSummary: ProsecutionCaseSummary[];
  @Input() isHearingEventLogEnded: boolean;
  @Output() validState: EventEmitter<boolean> = new EventEmitter();
  modelGroup: CounselModelGroup;

  constructor() {}

  ngOnInit() {
    if (!this.prosecutionCounsels || this.prosecutionCounsels.length === 0) {
      this.prosecutionCounsels = [];
      this.addProsecutionCounsel();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.prosecutionCounsels && changes.prosecutionCounsels.currentValue) {
      this.prosecutionCounsels = cloneDeep(this.prosecutionCounsels);
      this.prosecutionCounsels.forEach(dc => {
        this.modelGroup = this.createDefenceCounselModelGroup(dc);
      });
      this.checkIsValid(this.prosecutionCounsels);
    }
  }

  get prosecutionCaseOptions() {
    if (this.prosecutionCasesSummary) {
      return this.prosecutionCasesSummary.map(cs => ({
        value: cs.id,
        label: cs.isGroupMaster
          ? 'Bulk Defendant'
          : cs.prosecutionCaseIdentifier.caseURN ||
            cs.prosecutionCaseIdentifier.prosecutionAuthorityReference
      }));
    }

    return null;
  }

  disableDelete() {
    if (this.isHearingEventLogEnded) {
      return true;
    }
    return (
      this.prosecutionCounsels &&
      this.prosecutionCounsels.length === 1 &&
      this.prosecutionCounsels[0].firstName === '' &&
      this.prosecutionCounsels[0].lastName === '' &&
      this.prosecutionCounsels[0].status === ''
    );
  }

  private createNewProsecutionCounsel() {
    const caseIds = this.prosecutionCasesSummary.map(cs => cs.id);

    const newPc: ProsecutionCounsel = {
      id: uuid(),
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      status: '',
      prosecutionCases: caseIds,
      attendanceDays: []
    };

    this.updateProsecutionCounsel(newPc);
  }

  removeProsecutionCounsel(index: number) {
    this.onUpdateProsecutionCounsel.emit({ removeIndex: index });
  }

  addProsecutionCounsel() {
    this.createNewProsecutionCounsel();
  }

  updateModelProp(event: AutoSuggestOption, counsel: ProsecutionCounsel) {
    if (!!event) {
      const selectedcounsel: ProsecutionCounsel = event.value;
      this.bindModel(selectedcounsel, counsel);
    }
  }

  // This method shouldnt be bubbling the counsel to the parent container , would have been
  // better to expose an output event listening to the internal input change event within the autosuggest component.

  onInputTextChanged(
    event: string,
    counsel: ProsecutionCounsel,
    prop: keyof Pick<ProsecutionCounsel, 'firstName' | 'lastName'>
  ) {
    if (event !== null) {
      counsel[prop] = event;
      this.updateProsecutionCounsel(counsel);
      switch (prop) {
        case 'firstName':
          this.modelGroup[counsel.id].firstNameSuggestions =
            this.counselsCacheOptions.firstNameOpts.filter(
              opts => opts.label.trim().indexOf(event.trim()) !== -1
            ) || [];
          break;
        case 'lastName':
          this.modelGroup[counsel.id].lastNameSuggestions =
            this.counselsCacheOptions.lastNameOpts.filter(
              opts => opts.label.trim().indexOf(event.trim()) !== -1
            ) || [];
          break;
      }
    }
  }

  updateProsecutionCounsel(pc: ProsecutionCounsel) {
    this.onUpdateProsecutionCounsel.emit({ pc: pc });
    this.checkIsValid(this.prosecutionCounsels);
  }

  private bindModel(fromCounsel: ProsecutionCounsel, toCounsel: ProsecutionCounsel) {
    toCounsel.firstName = fromCounsel.firstName;
    toCounsel.lastName = fromCounsel.lastName;
    toCounsel.status = fromCounsel.status;

    this.modelGroup[toCounsel.id] = {
      ...this.modelGroup[toCounsel.id],
      [`${counselPrefix.first_name}${toCounsel.id}`]: {
        label: toCounsel.firstName,
        value: toCounsel
      },
      [`${counselPrefix.last_Name}${toCounsel.id}`]: {
        label: toCounsel.lastName,
        value: toCounsel
      }
    };

    this.updateProsecutionCounsel(toCounsel);
  }

  createDefenceCounselModelGroup(prosecutionCounsel: ProsecutionCounsel): CounselModelGroup {
    return {
      ...this.modelGroup,
      [`${prosecutionCounsel.id}`]: {
        [`${counselPrefix.first_name}${prosecutionCounsel.id}`]: {
          label: prosecutionCounsel.firstName,
          value: prosecutionCounsel
        },
        [`${counselPrefix.last_Name}${prosecutionCounsel.id}`]: {
          label: prosecutionCounsel.lastName,
          value: prosecutionCounsel
        },
        firstNameSuggestions: [],
        lastNameSuggestions: []
      }
    };
  }

  noWhitespaceValidator(inputData: string) {
    return (inputData || '').trim().length !== 0 ? null : true;
  }

  checkIsValid(counsels: ProsecutionCounsel[]) {
    const isValid = counsels.every(
      counsel =>
        counsel.firstName !== '' &&
        counsel.lastName !== '' &&
        counsel.status !== '' &&
        counsel.prosecutionCases.length !== 0 &&
        !this.noWhitespaceValidator(counsel.firstName) &&
        !this.noWhitespaceValidator(counsel.lastName) &&
        !this.noWhitespaceValidator(counsel.status)
    );

    this.validState.emit(isValid);
  }
}
