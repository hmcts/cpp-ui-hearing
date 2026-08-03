import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PdkLinkDirective } from '@cpp/pdk';

@Component({
  selector: 'select-all',
  template: `
    <div class="select-unselect-all">
      <a
        style="font-weight: normal"
        pdk-link
        [attr.alt]="hasSelected ? unSelectText : selectText"
        href="javascript:void(0);"
        (click)="onToggle.emit(!hasSelected)"
      >
        {{ hasSelected ? unSelectText : selectText }}
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkLinkDirective]
})
export class SelectAllComponent {
  @Input() hasSelected = false;
  @Input() selectText: string;
  @Input() unSelectText: string;

  @Output() onToggle = new EventEmitter<boolean>();
}
