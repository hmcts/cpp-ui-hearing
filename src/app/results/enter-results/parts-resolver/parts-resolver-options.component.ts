import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { UnresolvedPart, UnresolvedPartChoice } from '../../results.interfaces';
import { PdkLinkDirective, PdkPaddingDirective } from '@cpp/pdk';

@Component({
  selector: 'cpp-parts-resolver-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul pdk-list pdk-margin-vertical="1">
      @for (choice of choices; track choice.label) {
      <li>
        <a
          data-test-id="choice"
          pdk-padding-vertical="1"
          pdk-padding-horizontal="3"
          role="button"
          pdk-link
          text
          href="javascript:void(0)"
          (click)="resolve.emit(choice)"
        >
          {{ choice.label }}
        </a>
      </li>
      }
      <li>
        <a
          data-test-id="deleteChoice"
          role="button"
          pdk-padding-vertical="1"
          pdk-padding-horizontal="3"
          pdk-link
          text
          href="javascript:void(0)"
          (click)="destroy.emit(part)"
        >
          Delete
        </a>
      </li>
    </ul>
  `,
  imports: [PdkLinkDirective, PdkPaddingDirective]
})
export class PartsResolverOptionsComponent {
  @Input() part: UnresolvedPart;
  @Output() destroy = new EventEmitter();
  @Output() resolve = new EventEmitter<UnresolvedPartChoice>();

  get choices(): UnresolvedPartChoice[] {
    if ('resultPrompts' in this.part) {
      return this.part.resultPrompts;
    }
    return 'resultChoices' in this.part ? this.part.resultChoices : [];
  }
}
