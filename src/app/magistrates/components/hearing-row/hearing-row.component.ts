import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { Offence } from '../../interfaces/magistrates-hearing.interface';
import {
  PdkTableCellDirective,
  PdkPaddingDirective,
  PdkLinkDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';
import { CaseDetailsComponent } from '../case-details/case-details.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: '[hearing-row]',
  templateUrl: './hearing-row.component.html',
  styleUrls: ['./hearing-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkTableCellDirective,
    CaseDetailsComponent,
    PdkPaddingDirective,
    PdkLinkDirective,
    PdkVisuallyHiddenDirective,
    DatePipe
  ]
})
export class HearingRowComponent {
  @Input() sequence: string;
  @Input() sittingDay: string;
  @Input() caseURN: string;
  @Input() prosecutionAuthorityReference: string;
  @Input() prosecutionAuthorityCode: string;
  @Input() firstName: string;
  @Input() lastName: string;
  @Input() dateOfBirth: string;
  @Input() offences: Offence[];
  @Input() description: string;
  @Input() showNextImage = true;
  @Input() showBulkDefendant = false;
  @Input() showOffenceParticulars = true;
  @Input() showOffenceBulkDefendant = false;

  @Output() select = new EventEmitter();

  get caseMaterialLinkDetails(): string {
    const firstname = this.firstName || '';
    const lastName = this.lastName || '';
    return `View case materials for ${firstname} ${lastName}, URN ${this.caseURN}. This link opens in a new tab.`;
  }
}
