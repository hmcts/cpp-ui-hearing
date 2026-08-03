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
import { CounselsCache, CompanyRepresentative, Defendant } from '../../../core';
import { CounselModelGroup, counselPrefix } from '../model/counsel-model-group';
import { cloneDeep } from 'lodash-es';
import { AutoSuggestOption } from '../../../core/model/autosuggest-option';
import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkMarginDirective,
  PdkTypographyDirective,
  PdkLinkDirective,
  PdkFormFieldComponent,
  PdkAutosuggestLiteComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'company-representatives-panel',
  templateUrl: './company-representatives-panel.component.html',
  styleUrls: ['./company-representatives-panel.component.scss'],
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkMarginDirective,
    PdkTypographyDirective,
    PdkLinkDirective,
    PdkFormFieldComponent,
    PdkAutosuggestLiteComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    TranslatePipe
  ]
})
export class CompanyRepresentativesPanelComponent implements OnInit, OnChanges {
  @Input() companyRepresentatives: CompanyRepresentative[];
  @Input() counselsCacheOptions: CounselsCache;
  @Input() defendantsCurrentHearing: Defendant[];
  @Output() onUpdateCompanyRepresentative: EventEmitter<{
    rep?: CompanyRepresentative;
    removeIndex?: number;
  }> = new EventEmitter();
  @Output() validState: EventEmitter<boolean> = new EventEmitter();
  options: any;
  modelGroup: CounselModelGroup;

  constructor() {}

  ngOnInit() {
    if (!this.companyRepresentatives || this.companyRepresentatives.length === 0) {
      this.companyRepresentatives = [];
      this.addCompanyRepresentative();
    }

    this.options = this.configureOptions(this.defendantsCurrentHearing);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.companyRepresentatives) {
      this.companyRepresentatives = cloneDeep(this.companyRepresentatives);
      this.companyRepresentatives.forEach(cr => {
        this.modelGroup = this.createCounselModelGroup(cr);
      });
      this.checkIsValid(this.companyRepresentatives);
    }
  }

  configureOptions(defendantsCurrentHearing: Defendant[]) {
    return defendantsCurrentHearing
      .filter(h => !h.bulkDefendant)
      .filter(h => !!h.legalEntityDefendant)
      .map(defendant => {
        return {
          value: defendant.id,
          label: defendant.legalEntityDefendant.organisation.name
        };
      });
  }

  disableDelete() {
    return (
      this.companyRepresentatives &&
      this.companyRepresentatives.length === 1 &&
      this.companyRepresentatives[0].firstName === '' &&
      this.companyRepresentatives[0].lastName === '' &&
      this.companyRepresentatives[0].position === ''
    );
  }

  updateDefendant(companyRepresentative: CompanyRepresentative, event: any) {
    companyRepresentative.defendants = [event.value];
    this.updateCompanyRepresentative(companyRepresentative);
  }

  private createNewCompanyRepresentative() {
    const newPc: CompanyRepresentative = {
      id: uuid(),
      title: '',
      firstName: '',
      lastName: '',
      position: '',
      defendants: [],
      attendanceDays: []
    };

    this.updateCompanyRepresentative(newPc);
  }

  removeCompanyRepresentative(index: number) {
    this.onUpdateCompanyRepresentative.emit({ removeIndex: index });
  }

  addCompanyRepresentative() {
    this.createNewCompanyRepresentative();
  }

  updateModelProp(event: AutoSuggestOption, counsel: CompanyRepresentative) {
    if (!!event) {
      const selectedcounsel: CompanyRepresentative = event.value;
      this.bindModel(selectedcounsel, counsel);
    }
  }

  // This method shouldnt be bubbling the counsel to the parent container , would have been
  // better to expose an output event listening to the internal input change event within the autosuggest component.

  onInputTextChanged(
    event: string,
    counsel: CompanyRepresentative,
    prop: keyof Pick<CompanyRepresentative, 'firstName' | 'lastName'>
  ) {
    if (event !== null && prop in counsel) {
      counsel[prop] = event;
      this.updateCompanyRepresentative(counsel);
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

  private updateCompanyRepresentative(rep: CompanyRepresentative) {
    this.onUpdateCompanyRepresentative.emit({ rep: rep });
    this.checkIsValid(this.companyRepresentatives);
  }

  private bindModel(fromCounsel: CompanyRepresentative, toCounsel: CompanyRepresentative) {
    toCounsel.firstName = fromCounsel.firstName;
    toCounsel.lastName = fromCounsel.lastName;
    toCounsel.position = fromCounsel.position;

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
    this.updateCompanyRepresentative(toCounsel);
  }

  createCounselModelGroup(counsel: CompanyRepresentative): CounselModelGroup {
    return {
      ...this.modelGroup,
      [`${counsel.id}`]: {
        [`${counselPrefix.first_name}${counsel.id}`]: {
          label: counsel.firstName,
          value: counsel
        },
        [`${counselPrefix.last_Name}${counsel.id}`]: {
          label: counsel.lastName,
          value: counsel
        },
        [`${counselPrefix.defendantId}${counsel.id}`]: counsel.defendants[0],
        firstNameSuggestions: [],
        lastNameSuggestions: []
      }
    };
  }

  noWhitespaceValidator(inputData: string) {
    return (inputData || '').trim().length !== 0 ? null : true;
  }

  checkIsValid(counsels: CompanyRepresentative[]) {
    const isValid = counsels.every(
      counsel =>
        counsel.firstName !== '' &&
        counsel.lastName !== '' &&
        counsel.defendants.length > 0 &&
        !this.noWhitespaceValidator(counsel.firstName) &&
        !this.noWhitespaceValidator(counsel.lastName)
    );
    this.validState.emit(isValid);
  }
}
