import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnInit
} from '@angular/core';
import {
  SelectOption,
  ValidationError,
  PdkGridComponent,
  PdkGridDirective,
  PdkMarginDirective,
  PdkErrorSummaryComponent,
  PdkTypographyDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkSelectComponent,
  PdkDateInputComponent,
  PdkDatePickerInputComponent,
  PdkMinDateValidatorDirective,
  PdkTimeInputComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { NgForm, FormsModule } from '@angular/forms';
import {
  HearingType,
  JudicialMember,
  OrganisationUnit,
  OrganisationUnitAutosuggestComponent,
  HearingTypeAutosuggestComponent,
  BookingTypesSelectComponent,
  AssignPrioritySelectComponent,
  SpecialRequirementCheckboxComponent
} from '@cpp/reference-data';
import moment from 'moment';
import { formatDate } from '@angular/common';
import { CPPDate, getCPPDate, HearingDetail } from '../../../../core';
import { Judiciary } from '../../../../core/model/shared/judiciary';
import { DraftResultPromptValue } from '../../../../results/results.interfaces';
import { DurationInputComponent } from '../../../../shared/components/duration-input/duration-input.component';
import { JudiciaryTypeaheadComponent } from '../../../../session-times/session-times-judiciary/components/judiciary-typeahead/judiciary-typeahead.component';

export interface FormValues {
  courtCentre: OrganisationUnit;
  courtRoomId: string;
  hearingType: HearingType;
  hearingDuration: DraftResultPromptValue[];
  judiciary: JudicialMember;
  startDate: string;
  startTime: string;
  priority?: HearingPriority;
  bookingType?: BookingType;
  specialRequirements?: string[];
}

export interface HearingPriority {
  id: string;
  priorityCode: string;
  priorityValue: string;
  seqNum: number;
  validFrom: string;
}

export interface BookingType {
  id: string;
  typeCode: string;
  typeValue: string;
}

@Component({
  selector: 'court-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './court-details.component.html',
  styles: [
    `
      .horizontal-center {
        display: inline-block;
        padding-top: 10px;
      }
    `
  ],
  imports: [
    PdkGridComponent,
    PdkGridDirective,
    PdkMarginDirective,
    PdkErrorSummaryComponent,
    PdkTypographyDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    OrganisationUnitAutosuggestComponent,
    PdkSelectComponent,
    HearingTypeAutosuggestComponent,
    PdkDateInputComponent,
    PdkDatePickerInputComponent,
    PdkMinDateValidatorDirective,
    DurationInputComponent,
    PdkTimeInputComponent,
    JudiciaryTypeaheadComponent,
    BookingTypesSelectComponent,
    AssignPrioritySelectComponent,
    SpecialRequirementCheckboxComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective
  ]
})
export class CourtDetailsComponent implements OnInit {
  @Input() defaultValues: Partial<FormValues>;

  @Input() hearingTypes: HearingType[];
  @Input() hearingData: HearingDetail;
  @Input() isWeekCommencing: boolean;
  @Input() weekCommencingPeriod: number;
  @Output() submitData = new EventEmitter<FormValues>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('form') ngForm: NgForm;
  errors: ValidationError[] | null;
  judiciary: Judiciary[] = [];
  hearingTypeOptions: SelectOption<string>[] = [];

  judiciaryType = 'Circuit Judge';
  formValues: Partial<FormValues>;
  specialRequirement?: string[];
  specialRequirementsOptions: SelectOption<string>[] = [];
  priority?: HearingPriority;
  bookingType?: BookingType;

  minDate?: string;

  ngOnInit(): void {
    this.hearingTypeOptions = this.hearingTypes.map(hearingType => ({
      value: hearingType.id,
      label: hearingType.hearingDescription
    }));

    const dateUtil: CPPDate = getCPPDate();
    const today = dateUtil.getCurrentDate();
    this.minDate = dateUtil.format(today);

    this.formValues = { ...this.defaultValues };
  }

  getCourtroomOptions(organisationUnit?: OrganisationUnit): SelectOption<string>[] {
    if (organisationUnit && organisationUnit.courtrooms) {
      return organisationUnit.courtrooms.map(courtroom => ({
        value: courtroom.id,
        label: courtroom.courtroomName
      }));
    }
    return [];
  }

  /** TODO: Move to cpp-ui-core when week commencing is implemented after CCSPH2. */
  getWeekCommencingMonday(): Date {
    const today = moment();
    if (today.isoWeekday() === 1) {
      return today.startOf('day').toDate();
    }
    return today.add(1, 'week').startOf('isoWeek').toDate();
  }

  get weekCommencingMinDate(): string {
    return moment(this.getWeekCommencingMonday()).format('YYYY-MM-DD');
  }

  isWeekCommencingDateSelected() {
    const numberOfWeeks = this.weekCommencingPeriod;

    return (date: Date, selectedDate: Date): boolean => {
      if (!selectedDate) {
        return false;
      }

      if (!numberOfWeeks) {
        return false;
      }

      if (numberOfWeeks === 1) {
        return moment(date).isSame(selectedDate, 'isoWeek');
      }

      return this.isDateWithinTwoWeek(date, selectedDate);
    };
  }

  isWeekCommencingDateHighlighted() {
    const numberOfWeeks = this.weekCommencingPeriod;

    return (date: Date, highlightedDate: Date): boolean => {
      if (!numberOfWeeks) {
        return false;
      }

      if (numberOfWeeks === 1) {
        return moment(date).isSame(highlightedDate, 'isoWeek');
      }

      return this.isDateWithinTwoWeek(date, highlightedDate);
    };
  }

  weekCommencingDisplayText = (date: string) => {
    return `Week commencing ${formatDate(
      moment(date).startOf('isoWeek').toDate(),
      'd MMM yyyy',
      'en-GB'
    )}`;
  };

  isDateWithinTwoWeek(date: Date, dateToCompare: Date): boolean {
    const startOfWeek = moment(dateToCompare).startOf('isoWeek');
    const startOfNextWeek = moment(startOfWeek).add(7, 'days');

    return (
      moment(date).isSame(startOfWeek, 'isoWeek') || moment(date).isSame(startOfNextWeek, 'isoWeek')
    );
  }

  onSubmit(values: FormValues) {
    this.submitData.emit(values);
  }

  onClearForm() {
    this.ngForm.reset(this.defaultValues);
  }
}
