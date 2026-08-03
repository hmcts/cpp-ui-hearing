import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  PdkGridComponent,
  PdkGridDirective,
  PdkFillColorDirective,
  PdkPaddingDirective,
  PdkMarginDirective,
  PdkDividerComponent,
  PdkFocusableDirective
} from '@cpp/pdk';
import { CPPDatePipe } from '../../shared/pipes/cpp-date.pipe';

@Component({
  selector: 'judiciary-search-filter-summary',
  templateUrl: './judiciary-search-filter-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkGridComponent,
    PdkGridDirective,
    PdkFillColorDirective,
    PdkPaddingDirective,
    PdkMarginDirective,
    PdkDividerComponent,
    PdkFocusableDirective,
    CPPDatePipe
  ]
})
export class JudiciarySearchFilterSummaryComponent {
  @Input() selectedCourtCentre: string;
  @Input() selectedCourtRoom: string;
  @Input() sessionDate: string;
}
