import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Offence } from '../../../core/model';
import { AppConfigService } from '../../../config';
import { PdkLinkDirective, PdkBorderColorDirective, PdkTextColorDirective } from '@cpp/pdk';

@Component({
  selector: 'reporting-restrictions',
  templateUrl: './reporting-restrictions.component.html',
  styleUrls: ['./reporting-restrictions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    PdkLinkDirective,
    PdkBorderColorDirective,
    PdkTextColorDirective
  ]
})
export class ReportingRestrictionsComponent {
  @Input() caseId: string;
  @Input() isActive: boolean;
  @Input() isWarning: boolean;
  @Input() offences: Offence[];

  public appUrl: string;

  constructor(private appConfigService: AppConfigService) {
    this.appUrl = this.appConfigService.appUrl;
  }

  get colour(): string {
    return this.isActive ? 'white' : this.isWarning ? 'red' : 'black';
  }

  get hasReportingRestrictions(): boolean {
    return (this.offences || []).some(
      offence => offence.reportingRestrictions && offence.reportingRestrictions.length
    );
  }

  get href(): string {
    return this.appUrl && this.caseId
      ? `${this.appUrl}/prosecution-casefile/edit-case/${this.caseId}#hearings-and-decisions`
      : '';
  }
}
