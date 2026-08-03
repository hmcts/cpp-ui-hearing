import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  PdkBreadcrumbListComponent,
  PdkMarginDirective,
  PdkBreadcrumbListItemDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'session-times-breadcrumbs',
  template: `
    <ol pdk-breadcrumb-list pdk-margin-top="2" pdk-margin-bottom="2">
      <li pdk-breadcrumb-list-item>
        <a href="{{ appUrl }}">{{ 'HEADER.HOME' | translate }}</a>
      </li>
      <li pdk-breadcrumb-list-item>
        {{ 'SESSION_TIMES.TITLE' | translate }}
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
export class SessionTimesBreadcrumbsComponent {
  @Input() appUrl: string;
}
