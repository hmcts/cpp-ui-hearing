import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { OutstandingFinesDetails } from '../../../outstanding-fines.interfaces';

@Component({
  selector: 'outstanding-fines-report-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './outstanding-fines-report-details.component.html',
  styleUrls: ['./outstanding-fines-report-details.component.scss'],
  imports: [DatePipe, TranslatePipe]
})
export class OutstandingFinesReportDetailsComponent {
  @Input() outstandingFinesDetails: OutstandingFinesDetails;

  constructor() {}
}
