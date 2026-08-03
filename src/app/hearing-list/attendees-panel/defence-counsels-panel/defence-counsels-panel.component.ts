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
import { CounselsCache, DefenceCounsel, Defendant } from '../../../core';
import { AutoSuggestOption } from '../../../core/model/autosuggest-option';
import { cloneDeep } from 'lodash-es';
import { CounselModelGroup, counselPrefix } from '../model/counsel-model-group';
import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkVisuallyHiddenDirective,
  PdkLinkDirective,
  PdkFormFieldComponent,
  PdkAutosuggestLiteComponent,
  PdkTextInputDirective,
  PdkCheckBox
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'defence-counsels-panel',
  templateUrl: './defence-counsels-panel.component.html',
  styleUrls: ['./defence-counsels-panel.component.scss'],
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkVisuallyHiddenDirective,
    PdkLinkDirective,
    PdkFormFieldComponent,
    PdkAutosuggestLiteComponent,
    PdkTextInputDirective,
    PdkCheckBox,
    TranslatePipe
  ]
})
export class DefenceCounselsPanelComponent implements OnInit, OnChanges {
  @Input() defenceCounsels: DefenceCounsel[];
  @Input() counselsCacheOptions: CounselsCache;
  @Input() defendantsCurrentHearing: Defendant[];
  @Input() isHearingEventLogEnded: boolean;
  @Output() onUpdateDefenceCounsel: EventEmitter<{
    dc?: DefenceCounsel;
    removeIndex?: number;
  }> = new EventEmitter();
  @Output() validState: EventEmitter<boolean> = new EventEmitter();
  firstNameSuggestions: AutoSuggestOption[] = [];
  lastNameSuggestions: AutoSuggestOption[] = [];
  modelGroup: CounselModelGroup = {};
  options: any;

  constructor() {}

  ngOnInit() {
    if (!this.defenceCounsels || this.defenceCounsels.length === 0) {
      this.defenceCounsels = [];
      this.addDefenceCounsel();
    }

    this.options = this.configureOptions(this.defendantsCurrentHearing);
  }

  configureOptions(defendantsCurrentHearing: Defendant[]) {
    return defendantsCurrentHearing
      .filter(d => !d.isGroupMaster)
      .map(defendant => {
        return {
          value: defendant.id,
          label: defendant.personDefendant
            ? defendant.personDefendant.personDetails.firstName +
              ' ' +
              defendant.personDefendant.personDetails.lastName
            : defendant.legalEntityDefendant.organisation.name
        };
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.defenceCounsels && changes.defenceCounsels.currentValue) {
      this.defenceCounsels = cloneDeep(this.defenceCounsels);
      this.defenceCounsels.forEach(dc => {
        this.modelGroup = this.createDefenceCounselModelGroup(dc);
      });
      this.checkIsValid(this.defenceCounsels);
    }
  }

  disableDelete() {
    if (this.isHearingEventLogEnded) {
      return true;
    }
    return (
      this.defenceCounsels &&
      this.defenceCounsels.length === 1 &&
      this.defenceCounsels[0].firstName === '' &&
      this.defenceCounsels[0].lastName === '' &&
      this.defenceCounsels[0].status === ''
    );
  }

  updateDefendant(defenceCounsel: DefenceCounsel, event: any) {
    defenceCounsel.defendants = event;
    this.updateDefenceCounsel(defenceCounsel);
  }

  private createNewDefenceCounsel() {
    const newPc: DefenceCounsel = {
      id: uuid(),
      title: '',
      firstName: '',
      middleName: '',
      lastName: '',
      status: '',
      defendants: [],
      attendanceDays: []
    };

    this.updateDefenceCounsel(newPc);
  }

  removeDefenceCounsel(index: number) {
    this.onUpdateDefenceCounsel.emit({ removeIndex: index });
  }

  addDefenceCounsel() {
    this.createNewDefenceCounsel();
  }

  updateModelProp(event: AutoSuggestOption, counsel: DefenceCounsel) {
    if (!!event) {
      const selectedcounsel: DefenceCounsel = event.value;
      this.bindModel(selectedcounsel, counsel);
    }
  }

  // This method shouldnt be bubbling the counsel to the parent container , would have been
  // better to expose an output event listening to the internal input change event within the autosuggest component.

  onInputTextChanged(
    event: string,
    counsel: DefenceCounsel,
    prop: keyof Pick<DefenceCounsel, 'firstName' | 'lastName'>
  ) {
    if (event !== null) {
      counsel[prop] = event;
      this.updateDefenceCounsel(counsel);
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

  updateDefenceCounsel(dc: DefenceCounsel) {
    this.onUpdateDefenceCounsel.emit({ dc: dc });
    this.checkIsValid(this.defenceCounsels);
  }

  private bindModel(fromCounsel: DefenceCounsel, toCounsel: DefenceCounsel) {
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

    this.updateDefenceCounsel(toCounsel);
  }

  createDefenceCounselModelGroup(defenceCounsel: DefenceCounsel): CounselModelGroup {
    return {
      ...this.modelGroup,
      [`${defenceCounsel.id}`]: {
        [`${counselPrefix.first_name}${defenceCounsel.id}`]: {
          label: defenceCounsel.firstName,
          value: defenceCounsel
        },
        [`${counselPrefix.last_Name}${defenceCounsel.id}`]: {
          label: defenceCounsel.lastName,
          value: defenceCounsel
        },
        [`${counselPrefix.defendantId}${defenceCounsel.id}`]: defenceCounsel.defendants,
        firstNameSuggestions: [],
        lastNameSuggestions: []
      }
    };
  }

  noWhitespaceValidator(inputData: string) {
    return (inputData || '').trim().length !== 0 ? null : true;
  }

  checkIsValid(counsels: DefenceCounsel[]) {
    const isValid = counsels.every(
      counsel =>
        counsel.firstName !== '' &&
        counsel.lastName !== '' &&
        counsel.status !== '' &&
        counsel.defendants.length > 0 &&
        !this.noWhitespaceValidator(counsel.firstName) &&
        !this.noWhitespaceValidator(counsel.lastName) &&
        !this.noWhitespaceValidator(counsel.status)
    );

    this.validState.emit(isValid);
  }
}
