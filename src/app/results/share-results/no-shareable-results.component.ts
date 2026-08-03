import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PdkMarginDirective, PdkLinkDirective } from '@cpp/pdk';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'cpp-no-shareable-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <b>Results</b>
    <div class="no-shareable-results">
      <p pdk-margin="0">No results found</p>
      @if (!isHearingLockedBySomeoneElse) {
      <a pdk-link routerLink="./enter-results">Enter results</a>
      }
    </div>
  `,
  styles: [
    `
      .no-shareable-results {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    `
  ],
  imports: [PdkMarginDirective, PdkLinkDirective, RouterLink]
})
export class NoShareableResultsComponent {
  @Input() isHearingLockedBySomeoneElse: boolean;
}
