import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExtendedResolvedDraftResultLine } from '../../../results.interfaces';

import { PdkLinkDirective } from '@cpp/pdk';
@Component({
  selector: 'cpp-nhmc-result-line-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a
      pdk-link
      [routerLink]="[
        '/manage',
        hearingId,
        'enter-results',
        'result-lines',
        resultLine.resultLineId,
        'magistrates',
        canAllocateRelatedHearing ? 'related-hearings' : 'hearing-details'
      ]"
      [queryParams]="{ isApplication: isApplication }"
      >Find an available hearing</a
    >
  `,
  imports: [PdkLinkDirective, RouterLink]
})
export class NHMCResultLineComponent {
  @Input() resultLine: ExtendedResolvedDraftResultLine;
  @Input() isApplication?: boolean;
  @Input() canAllocateRelatedHearing: boolean;

  hearingId: string;

  constructor(route: ActivatedRoute) {
    this.hearingId = route.snapshot.paramMap.get('hearingId');
  }
}
