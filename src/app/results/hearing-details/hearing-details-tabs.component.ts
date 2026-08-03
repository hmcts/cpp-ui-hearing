import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { JurisdictionTypes } from '../../hearing-events-log/core/models/jurisdiction-types';
import {
  PdkTabsNavigationComponent,
  PdkTabsNavItemDirective,
  PdkTabsLinkDirective
} from '@cpp/pdk';

import { RouterLinkActive, RouterLink } from '@angular/router';
@Component({
  selector: 'cpp-hearing-details-tabs',
  template: `
    <pdk-tabs-navigation>
      @if (jurisdictionType === jurisdictionTypes.CROWN) {
      <pdk-tabs-nav-item routerLinkActive="govuk-tabs__list-item--selected">
        <a routerLink="./related-hearings" pdk-tabs-link queryParamsHandling="preserve"
          >Related hearings</a
        >
      </pdk-tabs-nav-item>
      <pdk-tabs-nav-item routerLinkActive="govuk-tabs__list-item--selected">
        <a routerLink="./court-details" pdk-tabs-link queryParamsHandling="preserve"
          >Enter hearing details</a
        >
      </pdk-tabs-nav-item>
      } @else { @if (canAllocateRelatedHearing) {
      <pdk-tabs-nav-item routerLinkActive="govuk-tabs__list-item--selected">
        <a routerLink="./related-hearings" pdk-tabs-link queryParamsHandling="preserve"
          >Related hearings</a
        >
      </pdk-tabs-nav-item>
      }
      <pdk-tabs-nav-item routerLinkActive="govuk-tabs__list-item--selected">
        <a routerLink="./hearing-details" pdk-tabs-link queryParamsHandling="preserve"
          >Find a hearing</a
        >
      </pdk-tabs-nav-item>
      }
    </pdk-tabs-navigation>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkTabsNavigationComponent,
    PdkTabsNavItemDirective,
    RouterLinkActive,
    PdkTabsLinkDirective,
    RouterLink
  ]
})
export class HearingDetailsTabsComponent {
  @Input() canAllocateRelatedHearing = true;
  @Input() jurisdictionType: JurisdictionTypes;

  jurisdictionTypes = JurisdictionTypes;
}
