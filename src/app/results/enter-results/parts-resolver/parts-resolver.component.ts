import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { UnresolvedPart, UnresolvedPartChoice } from '../../results.interfaces';
import {
  PdkInteractionContainerComponent,
  PdkListDirective,
  PdkMarginDirective,
  PdkBorderColorDirective,
  PdkLinkDirective
} from '@cpp/pdk';
import { PartsResolverOptionsComponent } from './parts-resolver-options.component';

@Component({
  selector: 'cpp-parts-resolver',
  template: `
    <pdk-interaction-container (blur)="selectedPart = null">
      <ul class="parts-resolver" pdk-list pdk-margin="0">
        @for (part of parts; track part; let partIndex = $index) {
        <li pdk-margin-right="2" pdk-border-colour="red">
          <a
            data-test-id="unresolvedPart"
            role="button"
            href="javascript:void(0)"
            pdk-link
            pdk-border-colour="red"
            text
            (click)="handleClickPart(part)"
            >{{ getPartValue(part) }}</a
          >
          @if (selectedPart === part) {
          <cpp-parts-resolver-options
            [part]="part"
            (destroy)="handleDestroyPart(partIndex)"
            (resolve)="handleResolvePart(partIndex, $event)"
          >
          </cpp-parts-resolver-options>
          }
        </li>
        }
      </ul>
    </pdk-interaction-container>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./parts-resolver.scss'],
  imports: [
    PdkInteractionContainerComponent,
    PdkListDirective,
    PdkMarginDirective,
    PdkBorderColorDirective,
    PdkLinkDirective,
    PartsResolverOptionsComponent
  ]
})
export class PartsResolverComponent {
  @Input() parts: UnresolvedPart[] = [];
  @Output() destroyPart = new EventEmitter<number>();
  @Output() resolvePart = new EventEmitter<{ partIndex: number; choice: UnresolvedPartChoice }>();

  selectedPart: UnresolvedPart | null = null;

  getPartValue(part: UnresolvedPart) {
    return 'originalText' in part && part.originalText ? part.originalText : part.value;
  }

  handleClickPart(part: UnresolvedPart) {
    this.selectedPart = part === this.selectedPart ? null : part;
  }

  handleDestroyPart(partIndex: number) {
    this.destroyPart.emit(partIndex);
    this.selectedPart = null;
  }

  handleResolvePart(partIndex: number, choice: UnresolvedPartChoice) {
    this.resolvePart.emit({ partIndex, choice });
    this.selectedPart = null;
  }
}
