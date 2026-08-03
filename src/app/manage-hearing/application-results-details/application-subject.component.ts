import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CourtApplicationParty } from '../../core';
import { PdkTypographyDirective } from '@cpp/pdk';
import { ApplicationPartyNamePipe } from '../../shared/pipes/application-party-name.pipe';

@Component({
  selector: 'application-subject',
  template: `
    <h4 data-test-id="subjectName" pdk-typography="heading-xlarge">
      {{ isGroupCaseApplicationText || (subject | applicationPartyName) }}
    </h4>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkTypographyDirective, ApplicationPartyNamePipe]
})
export class ApplicationSubjectComponent {
  @Input() subject: CourtApplicationParty;
  @Input() isGroupCaseApplicationText: string;
}
