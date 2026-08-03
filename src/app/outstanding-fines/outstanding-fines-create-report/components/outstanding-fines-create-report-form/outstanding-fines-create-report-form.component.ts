import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { FilterOption, getCPPDate } from '../../../../core';
import { OutstandingFineCreateReportFormValues } from '../../../outstanding-fines.interfaces';
import { NgForm, FormsModule } from '@angular/forms';
import { OrganisationUnit, OrganisationUnitAutosuggestComponent } from '@cpp/reference-data';
import {
  PdkFormComponent,
  PdkGridComponent,
  PdkGridDirective,
  PdkFormFieldComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkCheckboxGroupComponent,
  PdkDatePickerInputComponent
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'outstanding-fines-create-report-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './outstanding-fines-create-report-form.component.html',
  styleUrls: ['./outstanding-fines-create-report-form.component.scss'],
  imports: [
    FormsModule,
    TranslatePipe,
    PdkFormComponent,
    PdkGridComponent,
    PdkGridDirective,
    PdkFormFieldComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkCheckboxGroupComponent,
    OrganisationUnitAutosuggestComponent,
    PdkDatePickerInputComponent
  ]
})
export class OutstandingFinesCreateReportFormComponent implements OnInit {
  @Output() onCreateReport: EventEmitter<OutstandingFineCreateReportFormValues> =
    new EventEmitter();

  @ViewChild(NgForm) createOutstandingReportForm: NgForm;

  courtRoomOptions: FilterOption[];

  selectedCourtCentre: OrganisationUnit;
  selectedOptions: OutstandingFineCreateReportFormValues;

  allCourtroomsItem = {
    id: 'all-courtrooms',
    name: 'All courtrooms'
  };

  get disableSubmitButton(): boolean {
    return !this.createOutstandingReportForm.valid;
  }

  ngOnInit() {
    this.resetSelectedOptions();
  }

  courtCentreSelected(courtCentre: OrganisationUnit) {
    this.selectedCourtCentre = courtCentre;
    this.resetSelectedOptions();
    this.selectedOptions.courtCentreFilter = { id: courtCentre.id, name: courtCentre.oucodeL3Name };
    this.courtRoomOptions = this.buildCourtRoomOptions(this.selectedCourtCentre);
  }

  buildCourtRoomOptions(courtCentre: OrganisationUnit): any[] {
    return [
      {
        label: this.allCourtroomsItem.name,
        value: this.allCourtroomsItem.id
      },
      ...courtCentre.courtrooms.map(courtroom => {
        return {
          label: courtroom.courtroomName,
          value: courtroom.id
        };
      })
    ];
  }

  courtroomSelected(checkboxEvent: any) {
    if (checkboxEvent.source.value === this.allCourtroomsItem.id) {
      this.selectedOptions.courtRoomsFilter = checkboxEvent.checked
        ? this.buildCourtRoomOptions(this.selectedCourtCentre).map(cr => cr.value as string)
        : [];
    } else {
      this.selectedOptions.courtRoomsFilter = this.selectedOptions.courtRoomsFilter.filter(
        cr => cr !== this.allCourtroomsItem.id
      );
    }
  }

  resetSelectedOptions() {
    const cppDateUtil = getCPPDate();

    this.selectedOptions = Object.assign(
      {},
      {
        courtCentreFilter: null,
        courtRoomsFilter: null,
        dateFilter: cppDateUtil.format(
          cppDateUtil.localDate(cppDateUtil.getCurrentDate()),
          'YYYY-MM-DD'
        )
      }
    );
  }

  onSubmit() {
    this.onCreateReport.emit(this.selectedOptions);
  }
}
