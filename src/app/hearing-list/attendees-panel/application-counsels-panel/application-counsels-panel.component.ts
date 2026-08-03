import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ApplicationCounselsFormState,
  ApplicationCounsel,
  ApplicationCounselType,
  ApplicationCounselsFormComponent
} from './application-counsels-form.component';
import { HearingDetail } from '../../../core';
import { PdkTypographyDirective } from '@cpp/pdk';
import { PageScrollService } from 'ngx-page-scroll-core';

@Component({
  selector: 'application-counsels-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 pdk-typography="heading-medium" style="margin-top: 0">
      {{ title }}
    </h1>
    <application-counsels-form
      [attendanceDay]="attendanceDay"
      [applications]="applications"
      [initialCounsels]="counsels"
      [counselType]="counselType"
      (destroy)="destroyCounsel.emit($event)"
      (state)="formState.emit($event)"
    >
    </application-counsels-form>
  `,
  imports: [PdkTypographyDirective, ApplicationCounselsFormComponent],
  providers: [PageScrollService]
})
export class ApplicationCounselsPanelComponent {
  @Input() applications: HearingDetail['courtApplications'] = [];
  @Input() attendanceDay: string;
  @Input() counsels: ApplicationCounsel[] = [];
  @Input() counselType: ApplicationCounselType;
  @Input() applicantAppellantTitle: string;
  @Output() destroyCounsel = new EventEmitter<ApplicationCounsel>();
  @Output() formState = new EventEmitter<ApplicationCounselsFormState>();

  get title() {
    switch (this.counselType) {
      case 'applicant':
        return this.applicantAppellantTitle;

      case 'respondent':
        return 'Respondent';

      default:
        throw new Error('Unrecognised `counselType`');
    }
  }
}
