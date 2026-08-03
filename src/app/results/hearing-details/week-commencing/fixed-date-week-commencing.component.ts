import {
  Component,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  Input,
  ViewChild
} from '@angular/core';

import { NgForm, FormsModule } from '@angular/forms';
import {
  ValidationError,
  PdkErrorSummaryComponent,
  PdkTypographyDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkRadioConditionalComponent,
  PdkMarginDirective,
  PdkFormGroupComponent,
  PdkFormGroupDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import {
  HearingType,
  OrganisationUnit,
  OrganisationUnitAutosuggestComponent,
  HearingTypeAutosuggestComponent
} from '@cpp/reference-data';
import { JurisdictionCode } from '../../../hearing-events-log/core/models/jurisdiction-types';
import { DraftResultPromptValue } from '../../results.interfaces';

import { DurationInputComponent } from '../../../shared/components/duration-input/duration-input.component';
export interface HearingDateFormValues {
  dateType?: 'FIXED' | 'WEEK_COMMENCING' | 'DATE_TO_BE_FIXED';
  courtCentre?: OrganisationUnit;
  hearingType?: HearingType;
  hearingDuration?: DraftResultPromptValue[];
}

@Component({
  selector: 'fixed-date-week-commencing',
  templateUrl: './fixed-date-week-commencing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkErrorSummaryComponent,
    PdkTypographyDirective,
    PdkGridComponent,
    PdkGridDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkRadioConditionalComponent,
    PdkMarginDirective,
    OrganisationUnitAutosuggestComponent,
    HearingTypeAutosuggestComponent,
    DurationInputComponent,
    PdkFormGroupComponent,
    PdkFormGroupDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective
  ]
})
export class FixedDateWeekCommencingComponent {
  @Input() initialValues: HearingDateFormValues;
  @Input() showDateToBeFixed: boolean;
  @Output() submitData = new EventEmitter<HearingDateFormValues>();

  @Output() goBack: EventEmitter<void> = new EventEmitter();
  @ViewChild(NgForm) form: NgForm;
  errors: ValidationError[];
  jurisdictionCode = JurisdictionCode;

  submitForm(values: HearingDateFormValues): void {
    this.submitData.emit(values);
  }
}
