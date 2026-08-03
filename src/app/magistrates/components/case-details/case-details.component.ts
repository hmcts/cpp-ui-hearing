import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Offence } from '../../../core';
import { DatePipe } from '@angular/common';
import { OffenceDetailsComponent } from '../offence-details/offence-details.component';
import { TranslatePipe } from '@ngx-translate/core';
import { AgePipe } from '../../../shared/pipes/age.pipe';

@Component({
  selector: 'case-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-details.component.html',
  imports: [OffenceDetailsComponent, TranslatePipe, DatePipe, AgePipe]
})
export class CaseDetailsComponent {
  @Input() firstname: string;
  @Input() lastname: string;
  @Input() dateOfBirth: string;
  @Input() offences: Offence[];
  @Input() showBulkDefendant = false;
  @Input() showOffenceParticulars = false;
  @Input() showOffenceBulkDefendant = false;
}
