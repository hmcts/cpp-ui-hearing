import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { JurisdictionTypes } from '../../hearing-events-log/core/models/jurisdiction-types';
import {
  PdkTabsNavigationComponent,
  PdkTabsNavItemDirective,
  PdkTabsLinkDirective
} from '@cpp/pdk';

@Component({
  selector: 'cpp-hearing-details-tabs',
  template: `
    <pdk-tabs-navigation>
      @if (jurisdictionType() === jurisdictionTypes.CROWN) {
      <pdk-tabs-nav-item [selected]="isActive('related-hearings')">
        <a href="javascript:void(0)" pdk-tabs-link (click)="navigateTab('related-hearings')"
          >Related hearings</a
        >
      </pdk-tabs-nav-item>
      <pdk-tabs-nav-item [selected]="isActive('court-details')">
        <a href="javascript:void(0)" pdk-tabs-link (click)="navigateTab('court-details')">{{
          weekCommencingType() === 'WEEK_COMMENCING' ? 'Enter hearing details' : 'Find a hearing'
        }}</a>
      </pdk-tabs-nav-item>
      } @else { @if (canAllocateRelatedHearing()) {
      <pdk-tabs-nav-item [selected]="isActive('related-hearings')">
        <a href="javascript:void(0)" pdk-tabs-link (click)="navigateTab('related-hearings')"
          >Related hearings</a
        >
      </pdk-tabs-nav-item>
      }
      <pdk-tabs-nav-item [selected]="isActive('hearing-details')">
        <a href="javascript:void(0)" pdk-tabs-link (click)="navigateTab('hearing-details')"
          >Find a hearing</a
        >
      </pdk-tabs-nav-item>
      }
    </pdk-tabs-navigation>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkTabsNavigationComponent, PdkTabsNavItemDirective, PdkTabsLinkDirective]
})
export class HearingDetailsTabsComponent {
  canAllocateRelatedHearing = input(true);
  jurisdictionType = input<JurisdictionTypes>();
  weekCommencingType = input<'FIXED' | 'WEEK_COMMENCING' | 'DATE_TO_BE_FIXED'>();

  jurisdictionTypes = JurisdictionTypes;

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private activeChildPath = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.route.firstChild?.snapshot.url[0]?.path ?? ''),
      startWith(this.route.firstChild?.snapshot.url[0]?.path ?? '')
    )
  );

  navigateTab(path: string): void {
    this.router.navigate([path], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      replaceUrl: true
    });
  }

  isActive(path: string): boolean {
    return this.activeChildPath() === path;
  }
}
