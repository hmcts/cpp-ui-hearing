import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { UnresolvedDraftResultLine } from '../../results.interfaces';
import { PartsResolverContainerComponent } from '../parts-resolver/parts-resolver.container';
import { PdkLinkDirective, PdkVisuallyHiddenDirective } from '@cpp/pdk';
import { LinkGroupComponent } from '../../../shared/components/link-group.component';

@Component({
  selector: 'cpp-unresolved-draft-result-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cpp-parts-resolver-container
      [parts]="resultLine.unresolvedParts"
      [resultLineId]="resultLine.resultLineId"
    ></cpp-parts-resolver-container>

    <pdk-link-group>
      <a
        data-test-id="change-result-line"
        pdk-link
        href="javascript:void(0)"
        (click)="showResultLineParser.emit()"
        >Change<span pdk-visually-hidden> original text</span></a
      >
      <a
        data-test-id="delete-result-line"
        pdk-link
        href="javascript:void(0)"
        (click)="destroy.emit()"
        >Delete<span pdk-visually-hidden> result line</span></a
      >
    </pdk-link-group>
  `,
  imports: [
    PartsResolverContainerComponent,
    PdkLinkDirective,
    PdkVisuallyHiddenDirective,
    LinkGroupComponent
  ]
})
export class UnresolvedDraftResultLineComponent {
  @Input() resultLine: UnresolvedDraftResultLine;
  @Output() destroy = new EventEmitter();
  @Output() showResultLineParser = new EventEmitter();
}
