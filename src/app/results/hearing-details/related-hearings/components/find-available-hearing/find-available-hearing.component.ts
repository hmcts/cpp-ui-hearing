import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  requireCheckboxesToBeCheckedValidator,
  requireAtLeastOneSpecificCaseReference
} from './validators';
import {
  SearchAvailableHearingsFormOptions,
  SearchCriteriaAvailableHearingsType,
  HearingDetail
} from '../../../../../core';
import {
  CheckboxChangeEvent,
  PdkCheckboxComponent,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkTextInputDirective,
  PdkInputComponent,
  PdkInputDirective,
  PdkLinkDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkCheckBox,
  PdkForm
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

export enum RelatedCaseTypes {
  sameCase = 'SAME_CASE',
  linkedCase = 'LINKED_CASE',
  specific = 'SPECIFIC_CASE'
}

interface FormData {
  caseTypes: RelatedCaseTypes[];
  specificCaseUrns: string[];
}

@Component({
  selector: 'find-available-hearing',
  templateUrl: './find-available-hearing.component.html',
  styleUrls: ['./find-available-hearing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkTypographyDirective,
    FormsModule,
    PdkForm,
    ReactiveFormsModule,
    PdkCheckBox,
    PdkMarginDirective,
    PdkTextInputDirective,
    PdkInputComponent,
    PdkInputDirective,
    PdkLinkDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ]
})
export class FindAvailableHearingComponent implements OnInit {
  @Input() hearing: HearingDetail;
  @Input() caseUrns: string[];

  @Output() onFindAvailableHearings = new EventEmitter<SearchAvailableHearingsFormOptions>();

  relatedHearingsForm: UntypedFormGroup;
  relatedCaseTypes = RelatedCaseTypes;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit() {
    this.relatedHearingsForm = this.fb.group(
      {
        caseTypes: this.fb.control([this.relatedCaseTypes.sameCase], {
          validators: [requireCheckboxesToBeCheckedValidator()]
        }),
        specificCaseUrns: this.fb.array([this.fb.control(null)])
      },
      { validators: [requireAtLeastOneSpecificCaseReference()] }
    );
    // needs to trigger the onSubmit on pageload with sameCase Urn
    this.onSubmit();
  }

  onSubmit(): void {
    const { caseTypes, specificCaseUrns } = this.relatedHearingsForm.value as FormData;
    const searchCriterias = [];
    let caseUrns = [];

    if (caseTypes.includes(this.relatedCaseTypes.sameCase)) {
      caseUrns.push(...this.caseUrns);
      searchCriterias.push(SearchCriteriaAvailableHearingsType.CASE_IN_HEARING);
    }

    if (caseTypes.includes(this.relatedCaseTypes.linkedCase)) {
      searchCriterias.push(SearchCriteriaAvailableHearingsType.MATCHED_DEFENDANTS);
    }

    if (caseTypes.includes(this.relatedCaseTypes.specific)) {
      caseUrns.push(
        ...specificCaseUrns
          .filter(currentCase => !!(currentCase && currentCase.trim()))
          .map(currentCase => currentCase.trim())
      );
    }

    if (caseUrns.length === 0) {
      caseUrns = null;
    }

    this.onFindAvailableHearings.emit({
      hearingId: this.hearing.id,
      caseUrns,
      searchCriterias,
      caseUrnForLinkedCases: this.caseUrns
    });
  }

  get caseTypesValue(): RelatedCaseTypes[] {
    return this.relatedHearingsForm.get('caseTypes').value as RelatedCaseTypes[];
  }

  get specificCaseUrns() {
    return this.relatedHearingsForm.get('specificCaseUrns') as UntypedFormArray;
  }

  get isSearchButtonDisabled(): boolean {
    return this.relatedHearingsForm.invalid;
  }

  get formattedCaseUrns(): string {
    return this.caseUrns.join(', ');
  }

  addAnotherSpecificCase(): void {
    this.specificCaseUrns.push(this.fb.control(null));
  }

  handleResetFilters(): void {
    this.relatedHearingsForm.reset();
    if (this.specificCaseUrns.length > 1) {
      this.reInitialiseFormArray();
    }
  }

  checkSpecificCases(
    { source, checked }: CheckboxChangeEvent,
    specificCaseOption: PdkCheckboxComponent
  ) {
    if (source === specificCaseOption && !checked) {
      this.specificCaseUrns.reset();

      if (this.specificCaseUrns.length > 1) {
        this.reInitialiseFormArray();
      }
    }
  }

  reInitialiseFormArray() {
    this.specificCaseUrns.clear();
    this.addAnotherSpecificCase();
  }
}
