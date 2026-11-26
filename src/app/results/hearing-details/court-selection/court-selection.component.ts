import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewEncapsulation,
  input,
  linkedSignal
} from '@angular/core';
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
  PdkBackLink
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
    PdkBackLink,
    RouterLink
  ]
})
export class CourtSelectionComponent {
  @Input() backUrl: string | string[];
  @Input() jurisdictionType: 'CROWN' | 'MAGISTRATES';
  @Input() organisationUnits: OrganisationUnit[];
  readonly courtCentre = input<OrganisationUnit>();
  @Output() continue: EventEmitter<OrganisationUnit> = new EventEmitter();
  @Output() errors: EventEmitter<ValidationError[]> = new EventEmitter();
  courtType: 'CROWN' | 'MAGISTRATES';
  readonly selectedCourtCentre = linkedSignal(() => this.courtCentre());

  onContinue() {
    if (this.selectedCourtCentre()) {
      this.continue.emit(this.selectedCourtCentre());
    }
  }
}
