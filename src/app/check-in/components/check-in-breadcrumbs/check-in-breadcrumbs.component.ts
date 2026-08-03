import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  PdkBreadcrumbListComponent,
  PdkMarginDirective,
  PdkBreadcrumbListItemDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'check-in-breadcrumbs',
  template: `
    <ol pdk-breadcrumb-list pdk-margin-top="2" pdk-margin-bottom="2">
      <li pdk-breadcrumb-list-item>
        <a href="{{ appUrl }}">{{ 'HEADER.HOME' | translate }}</a>
      </li>
      <li pdk-breadcrumb-list-item>
        {{ 'CHECK_IN.TITLE' | translate }}
      </li>
    </ol>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkBreadcrumbListComponent,
    PdkMarginDirective,
    PdkBreadcrumbListItemDirective,
    TranslatePipe
  ]
})
export class CheckInBreadcrumbsComponent {
  @Input() appUrl: string;
}
