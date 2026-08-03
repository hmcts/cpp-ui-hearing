import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { JurisdictionType, Offence } from '../../../../core';
import { PdkMarginDirective, PdkPaddingDirective, PdkTypographyDirective } from '@cpp/pdk';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'offences-list-item',
  templateUrl: './offences-list-item.component.html',
  styleUrls: ['./offences-list-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkMarginDirective, PdkPaddingDirective, PdkTypographyDirective, DatePipe]
})
export class OffencesListItemComponent {
  @Input() count: number;
  @Input() offence: Offence;
  @Input() hideLegislation: boolean;
  @Input() boldTitle: boolean;
  @Input() jurisdictionType?: JurisdictionType;
}
