import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CourtFilterOptions, FilterOption } from '../../core/model';
import {
  ValidationError,
  PdkFillColorDirective,
  PdkPaddingDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkFormComponent,
  PdkMarginDirective,
  PdkFormFieldComponent,
  PdkSelectComponent,
  PdkDateInputComponent,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { OrganisationUnit, OrganisationUnitAutosuggestComponent } from '@cpp/reference-data';
import { getCPPDate } from '../../core';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionDateValidator } from '../../shared/validators/session-date/session-date.validator';

@Component({
  selector: 'session-times-court-filter',
  templateUrl: './session-times-court-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslatePipe,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkGridComponent,
    PdkGridDirective,
    PdkFormComponent,
    PdkMarginDirective,
    PdkFormFieldComponent,
    PdkSelectComponent,
    PdkDateInputComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    OrganisationUnitAutosuggestComponent,
    SessionDateValidator
  ]
})
export class SessionTimesCourtFilterComponent implements OnInit {
  @ViewChild('courtFilterForm') courtFilterForm: NgForm;
  @Output() courtFilterFormErrors: EventEmitter<ValidationError[]> = new EventEmitter();
  @Output() onCourtFilterFormSubmit: EventEmitter<CourtFilterOptions> = new EventEmitter();

  dateLabelErrorTransalationKey = 'SESSION_TIMES.SESSION_DATE_REQUIRED_MESSAGE';
  resetCourtFilterForm = false;
  courtRoomOptionDisabled = { label: 'Select a courtroom', value: '', selected: true };
  courtRoomsOptions: FilterOption[] = [this.courtRoomOptionDisabled];
  selectedOptions: CourtFilterOptions = {
    courtCentre: null,
    courtRoomId: null,
    sessionDate: null
  };

  ngOnInit(): void {
    const cppDate = getCPPDate();
    this.selectedOptions.sessionDate = cppDate.format(cppDate.getCurrentDate(), 'YYYY-MM-DD');
  }

  selectCourtCentre(organisationUnit: OrganisationUnit) {
    if (!!organisationUnit) {
      this.selectedOptions.courtCentre = organisationUnit;
      this.courtRoomsOptions = [
        this.courtRoomOptionDisabled,
        ...organisationUnit.courtrooms.map(item => ({
          label: item.courtroomName,
          value: item.id
        }))
      ];
    } else {
      this.courtRoomsOptions = [this.courtRoomOptionDisabled];
      this.selectedOptions.courtCentre = null;
      this.selectedOptions.courtRoomId = null;
    }
  }

  onFormSubmit() {
    if (this.courtFilterForm.valid) {
      const filterValue: CourtFilterOptions = {
        courtCentre: this.courtFilterForm.value.organisationUnit,
        courtRoomId: this.courtFilterForm.value.courtRoomId,
        sessionDate: this.courtFilterForm.value.sessionDateFilter
      };
      this.courtFilterFormErrors.emit(null);
      this.onCourtFilterFormSubmit.emit(filterValue);
    }
  }

  onSessionDateValidator(errorTranslationKey: string): void {
    this.dateLabelErrorTransalationKey = errorTranslationKey;
  }
}
