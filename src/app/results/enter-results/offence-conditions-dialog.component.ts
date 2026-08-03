import { Component, Input } from '@angular/core';
import { Offence } from '../../magistrates/interfaces/magistrates-hearing.interface';
import {
  PdkGridComponent,
  PdkGridDirective,
  PdkTypographyDirective,
  PdkPaddingDirective,
  PdkTextColorDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { NgxPageScrollModule } from 'ngx-page-scroll';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'offence-conditions-dialog',
  template: `
    @if (offences?.length) {
    <pdk-grid pdk-typography="body" pdk-padding="3">
      <div class="warning">
        <p class="bold">Check offences for conditions applied in a previous hearing</p>
        <div>
          @for (offence of offences; track offence.id) {
          <p pdk-text-colour="blue" class="bold" data-test-id="conditional-offence">
            <a
              pdk-link
              unvisited
              pdk-text-colour="blue"
              role="link"
              pageScroll
              [pageScrollOffset]="100"
              routerLink="./"
              href="#offence-{{ offence.id }}"
            >
              {{ offence.offenceTitle }}
            </a>
          </p>
          }
        </div>
      </div>
    </pdk-grid>
    }
  `,
  styles: [
    `
      .warning {
        border: 4px solid #005ea5;
        padding: 20px;
      }
    `
  ],
  imports: [
    PdkGridComponent,
    PdkGridDirective,
    PdkTypographyDirective,
    PdkPaddingDirective,
    PdkTextColorDirective,
    PdkLinkDirective,
    NgxPageScrollModule,
    RouterLink
  ]
})
export class OffenceConditionsDialogComponent {
  @Input() offences: Offence[];
}
