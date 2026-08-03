import { Component } from '@angular/core';
import { OutstandingFineCreateReportFormValues } from '../outstanding-fines.interfaces';
import { AppConfigService } from '../../config';
import { OutstandingFinesCreateReportFormComponent } from './components/outstanding-fines-create-report-form/outstanding-fines-create-report-form.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'outstanding-fines-create-report',
  templateUrl: './outstanding-fines-create-report.container.html',
  imports: [OutstandingFinesCreateReportFormComponent, TranslatePipe]
})
export class OutstandingFinesCreateReportContainer {
  constructor(private appConfigService: AppConfigService) {}

  createReport(selectedOptions: OutstandingFineCreateReportFormValues) {
    const { courtCentreFilter, dateFilter } = selectedOptions;
    const courtRoomsFilter = selectedOptions.courtRoomsFilter.filter(
      courtRoom => courtRoom !== 'all-courtrooms'
    );
    window.open(
      `${this.appConfigService.getBaseUrl()}/hearing/outstanding-fines/` +
        `courtroom?courtCentreId=${courtCentreFilter.id}&courtRoomsIds=${courtRoomsFilter.join(
          ','
        )}&hearingDate=${dateFilter}`,
      '_blank'
    );
  }
}
