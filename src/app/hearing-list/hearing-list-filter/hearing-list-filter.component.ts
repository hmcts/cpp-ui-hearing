import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { isEqual, range } from 'lodash-es';

import { FilterOption, DefaultOptions, CourtCentre, getCPPDate, CourtRoom } from '../../core';

import { OrganisationUnit, OrganisationUnitAutosuggestComponent } from '@cpp/reference-data';
import {
  ValidationError,
  PdkFormComponent,
  PdkGridComponent,
  PdkGridDirective,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkFormFieldComponent,
  PdkPaddingDirective,
  PdkSelectComponent,
  PdkDateInputComponent,
  PdkTimeInputComponent,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
@Component({
  selector: 'hearing-list-filter',
  templateUrl: './hearing-list-filter.component.html',
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkGridComponent,
    PdkGridDirective,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkFormFieldComponent,
    PdkPaddingDirective,
    OrganisationUnitAutosuggestComponent,
    PdkSelectComponent,
    PdkDateInputComponent,
    PdkTimeInputComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ]
})
export class HearingListFilterComponent implements OnInit {
  @Input() courtCentres: CourtCentre[];
  @Input() selectedOptions: DefaultOptions;
  @Output() onChange: EventEmitter<DefaultOptions> = new EventEmitter();
  @Output() onApplySearch: EventEmitter<any> = new EventEmitter();
  @Output() errors: EventEmitter<ValidationError[]> = new EventEmitter();

  dateOptions: FilterOption[];
  courtRoomOptions: FilterOption[] = [];

  selectedCourtCentre: CourtCentre = null;
  selectedOrganisationUnit: OrganisationUnit = null;

  // TODO: Could this go in Store and change everytime it's updated
  // If this goes in parent container and is supplied as Input, what happens
  // when it changes? Does it get pushed down to here?
  // Should this be in Store?
  // Should this be typed?
  dateOptionsConfig = {
    numOptions: 30,
    format: {
      display: 'DD  MMMM YYYY',
      value: 'YYYY-MM-DD'
    }
  };

  ngOnInit() {
    if (this.selectedOptions.courtCentreFilter) {
      this.courtCentreSelected({
        id: this.selectedOptions.courtCentreFilter.id
      } as OrganisationUnit);
    }

    if (!this.selectedOptions.dateFilter) {
      this.dateOptions = this.buildDateOptions(this.selectedOptions.dateFilter as string);
      this.selectedOptions.dateFilter = this.dateOptions.find(date => date.selected)
        ? this.dateOptions.find(date => date.selected).value
        : undefined;
    }

    if (!this.hasInitialValues(this.selectedOptions)) {
      // To trigger the first load without the parent container having to know about FilterOptions, etc
      this.onChanges(this.selectedOptions);
    }
  }

  buildFilterOption = (item: CourtRoom, index: number) => {
    return {
      label: item.name,
      value: item.id,
      selected: index === 0
    };
  };

  buildDateOptions(selectedDate: string): FilterOption[] {
    const cppDateUtil = getCPPDate();
    const localDate = cppDateUtil.localDate(cppDateUtil.getCurrentDate());
    const tomorrowLabel = cppDateUtil.add(localDate, 1, 'days');
    const tomorrowValue = cppDateUtil.add(localDate, 1, 'days');

    const tomorrow = {
      label: cppDateUtil.format(tomorrowLabel, this.dateOptionsConfig.format.display),
      value: cppDateUtil.format(tomorrowValue, this.dateOptionsConfig.format.value),
      selected: false
    };
    return [tomorrow].concat(
      range(this.dateOptionsConfig.numOptions).map(num => {
        const date = cppDateUtil.subtract(localDate, num, 'days');

        return {
          label: cppDateUtil.format(date, this.dateOptionsConfig.format.display),
          value: cppDateUtil.format(date, this.dateOptionsConfig.format.value),
          selected: !selectedDate
            ? num === 0
            : cppDateUtil.format(date, this.dateOptionsConfig.format.value) === selectedDate
        };
      })
    );
  }

  // Is there any dependency on these being ordered?
  buildCourtRoomOptions(courtCentre: CourtCentre): FilterOption[] {
    return courtCentre.courtrooms.map(this.buildFilterOption);
  }

  courtCentreSelected(event: OrganisationUnit) {
    if (!event) {
      return;
    }
    this.selectedCourtCentre = this.courtCentres.find(cOpt => cOpt.id === event.id);
    this.selectedOrganisationUnit = {
      id: event.id,
      oucodeL3Name: this.selectedCourtCentre.name
    } as OrganisationUnit;

    this.onChange.emit({
      courtCentreFilter: { id: event.id, name: this.selectedCourtCentre.name }
    });
    this.courtRoomOptions = this.buildCourtRoomOptions(this.selectedCourtCentre);
  }

  courtRoomSelected(value: string) {
    if (value) {
      this.onChange.emit({
        courtRoomFilter: {
          id: value,
          name: this.selectedCourtCentre.courtrooms.find(r => r.id === value).name
        }
      });
    }
  }

  onChanges(options: DefaultOptions) {
    const key = Object.keys(options)[0] as keyof DefaultOptions;
    if (!options[key] || isEqual(this.selectedOptions[key], options[key])) {
      return;
    }
    this.onChange.emit(options);
  }

  applySearch() {
    this.onApplySearch.emit();
  }

  hasInitialValues(initialValues: DefaultOptions): boolean {
    return !!(
      initialValues.dateFilter ||
      initialValues.courtRoomFilter ||
      initialValues.courtRoomFilter
    );
  }
}
