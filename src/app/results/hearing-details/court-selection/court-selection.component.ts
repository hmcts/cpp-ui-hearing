import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import {
  ValidationError,
  PdkGridComponent,
  PdkGridDirective,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { OrganisationUnit, OrganisationUnitAutosuggestComponent } from '@cpp/reference-data';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'court-selection',
  templateUrl: './court-selection.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    PdkGridComponent,
    PdkGridDirective,
    PdkTypographyDirective,
    PdkMarginDirective,
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    OrganisationUnitAutosuggestComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    RouterLink
  ]
})
export class CourtSelectionComponent {
  @Input() backUrl: string;
  @Input() jurisdictionType: 'CROWN' | 'MAGISTRATES';
  @Input() queryParams: Record<string, string>;
  @Input() organisationUnits: OrganisationUnit[];
  @Output() cancel: EventEmitter<void> = new EventEmitter();
  @Output() continue: EventEmitter<OrganisationUnit> = new EventEmitter();
  @Output() errors: EventEmitter<ValidationError[]> = new EventEmitter();
  courtType: 'CROWN' | 'MAGISTRATES';
  selectedCourtCentre: OrganisationUnit;

  onContinue() {
    if (this.selectedCourtCentre) {
      this.continue.emit(this.selectedCourtCentre);
    }
  }
}
