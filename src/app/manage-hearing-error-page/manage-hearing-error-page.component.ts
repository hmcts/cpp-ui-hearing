import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { ManageHearingPublicEventError } from './manage-hearing-error-page.interfaces';
import { PdkTypographyDirective, PdkLinkDirective } from '@cpp/pdk';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'manage-hearing-error-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 pdk-typography="heading-xlarge">
      <div>{{ 'MANAGE_HEARING_ERROR.THERE_WAS_A_PROBLEM' | translate }}</div>
      {{ 'MANAGE_HEARING_ERROR.WITH_THE_DRAFT_RESULTS' | translate }}
    </h1>
    <div class="text">
      <p pdk-typography="body-large">
        {{
          manageHearingError?.error?.code === '207'
            ? ('MANAGE_HEARING_ERROR.HEARING_ALREADY_SHARED' | translate)
            : ('MANAGE_HEARING_ERROR.YOU_CANNOT_PROCEED'
              | translate
                : {
                    userName:
                      manageHearingError?.info?.lastUpdatedByUserName ||
                      ('MANAGE_HEARING_ERROR.ANOTHER_USER' | translate),
                  })
        }}
      </p>
      <p pdk-typography="body-large">
        {{ 'MANAGE_HEARING_ERROR.CLICK_ON' | translate }}
        <a pdk-link unvisited [routerLink]="['/manage', hearingId]">manage hearing</a>
        {{ 'MANAGE_HEARING_ERROR.OR' | translate }}
        <a pdk-link unvisited [routerLink]="['/manage', hearingId, 'enter-results']"
          >enter results</a
        >
        {{ 'MANAGE_HEARING_ERROR.TO_VIEW_LATEST_CASE_RESULTS' | translate }}
      </p>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  imports: [PdkTypographyDirective, PdkLinkDirective, RouterLink, TranslatePipe]
})
export class ManageHearingErrorPageComponent {
  @Input() manageHearingError: ManageHearingPublicEventError;
  @Input() hearingId: string;
}
