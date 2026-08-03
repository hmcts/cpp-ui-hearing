import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { ProsecutionCaseIdentifier } from '../../../core/model/shared/prosecution-case-identifier';
import { ProsecutionCaseDetails } from '../../../core/model';
import { SlicePipe } from '@angular/common';
import {
  PdkMarginDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkVisuallyHiddenDirective,
  PdkTypographyDirective,
  PdkTextColorDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { ReportingRestrictionsComponent } from '../../../shared/components/reporting-restrictions/reporting-restrictions.component';

@Component({
  selector: 'case-markers',
  templateUrl: './case-markers.component.html',
  styleUrls: ['./case-markers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlicePipe,
    PdkMarginDirective,
    PdkGridComponent,
    PdkGridDirective,
    PdkVisuallyHiddenDirective,
    PdkTypographyDirective,
    PdkTextColorDirective,
    PdkLinkDirective,
    ReportingRestrictionsComponent
  ]
})
export class CaseMarkersComponent {
  @Input() prosecutionCaseDetails: ProsecutionCaseDetails;
  @Input() markers: string[];
  @Input() prosecutionCaseIdentifier: ProsecutionCaseIdentifier;
  @Input() isStandAloneApplication: boolean;

  @Output() onGoToCaseMarkers: EventEmitter<void> = new EventEmitter();
  showFirst = true;

  showAllMarkers(): void {
    this.showFirst = !this.showFirst;
  }

  goToCaseMarker(): void {
    this.onGoToCaseMarkers.emit();
  }

  adjustCase(text: string): string {
    return text[0].toUpperCase() + text.substr(1).toLowerCase();
  }

  get caseReference(): string {
    return this.prosecutionCaseDetails &&
      this.prosecutionCaseDetails.prosecutionCaseIdentifier &&
      this.prosecutionCaseDetails.prosecutionCaseIdentifier.caseURN
      ? this.prosecutionCaseDetails.prosecutionCaseIdentifier.caseURN
      : this.prosecutionCaseDetails.prosecutionCaseIdentifier.prosecutionAuthorityReference;
  }
}
