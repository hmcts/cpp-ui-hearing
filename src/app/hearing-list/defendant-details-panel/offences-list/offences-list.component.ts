import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Defendant, JurisdictionType } from '../../../core';
import { ProsecutionCaseDetails } from '../../../core/model/shared/prosecution-case-details';
import {
  PdkPaddingDirective,
  PdkVisuallyHiddenDirective,
  PdkTypographyDirective,
  PdkMarginDirective
} from '@cpp/pdk';
import { OffencesListItemComponent } from './offences-list-item/offences-list-item.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'offences-list',
  templateUrl: './offences-list.component.html',
  styleUrls: ['./offences-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkPaddingDirective,
    PdkVisuallyHiddenDirective,
    PdkTypographyDirective,
    PdkMarginDirective,
    OffencesListItemComponent,
    TranslatePipe
  ]
})
export class OffencesListComponent {
  @Input() defendantCase: ProsecutionCaseDetails;
  @Input() defendant: Defendant;
  @Input() numberOfCases: number;
  @Input() caseIndex: number;
  @Input() jurisdictionType: JurisdictionType;

  resolveBailStatusDisplay() {
    if (
      this.defendant &&
      this.defendant.personDefendant &&
      this.defendant.personDefendant.bailStatus
    ) {
      return this.defendant.personDefendant.bailStatus.description;
    }

    return null;
  }

  hasBorderBottomSolid(offenceIndex: number): boolean {
    return (
      offenceIndex < this.defendantCase.offences.length - 1 ||
      this.caseIndex === this.numberOfCases - 1
    );
  }

  isBulkCase() {
    return this.defendantCase && !!this.defendantCase.isGroupMaster;
  }
}
