import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HearingType } from '@cpp/reference-data';
import { PdkFormFieldComponent, PdkAutosuggestLiteComponent } from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'hearing-type-selector',
  templateUrl: './hearing-type-selector.component.html',
  imports: [FormsModule, TranslatePipe, PdkFormFieldComponent, PdkAutosuggestLiteComponent]
})
export class HearingTypeSelectorComponent {
  @Input() hearingTypes: HearingType[];
  @Input() preselectedHearingType: HearingType;
  @Output() hearingTypeSelected: EventEmitter<HearingType> = new EventEmitter();
  filteredSuggestions: HearingType[] = [];

  handleSearchSuggestions(text: string) {
    this.filteredSuggestions = this.hearingTypes.filter(
      value => value.hearingDescription.toLowerCase().indexOf(text.toLowerCase()) !== -1
    );
  }

  selectHearingType(hearingType: HearingType) {
    if (hearingType !== null) {
      this.hearingTypeSelected.emit(hearingType);
    }
  }
}
