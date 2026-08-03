import { Component, Input } from '@angular/core';
import { AvailableHearing } from '../../../core';
import { OrganisationUnit } from '@cpp/reference-data';
import { JurisdictionTypes } from '../../../hearing-events-log/core/models/jurisdiction-types';
import { PdkTypographyDirective, PdkNotificationBannerComponent } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { CPPDatePipe } from '../../../shared/pipes/cpp-date.pipe';

@Component({
  selector: 'cpp-change-of-jurisdiction',
  template: `
    @if (hasSameJurisdiction) {
    <pdk-notification-banner [title]="'RELATED_HEARINGS.CHANGE_OF_JURISDICTION' | translate">
      <div>
        <p pdk-typography="body">
          {{ 'RELATED_HEARINGS.OFFENCE_INFO' | translate }}
        </p>
        @for (hearing of hearings; track hearing.id) {
        <p>
          @if (hearing?.jurisdictionType !== jurisdictionType) {
          <span pdk-typography="body-small" class="bold">
            {{ hearing?.type?.description }} at
            {{ mapOrganisationUnits[hearing.courtCentreId]?.oucodeL3Name }} on
            {{
              hearing?.hearingDays?.length
                ? ((hearing?.hearingDays)[0]?.hearingDate | cppDate : 'DD MMM YYYY')
                : ''
            }}
          </span>
          }
        </p>
        }
      </div>
    </pdk-notification-banner>
    }
  `,
  imports: [PdkTypographyDirective, PdkNotificationBannerComponent, TranslatePipe, CPPDatePipe]
})
export class ChangeOfJurisdictionComponent {
  @Input() hasSameJurisdiction?: boolean;
  @Input() hearings?: AvailableHearing[];
  @Input() mapOrganisationUnits: Record<string, OrganisationUnit>;
  @Input() jurisdictionType: JurisdictionTypes;
}
