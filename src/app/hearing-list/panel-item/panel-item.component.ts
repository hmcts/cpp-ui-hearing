import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  PdkButtonComponent,
  PdkButtonDirective,
  PdkFillColorDirective,
  PdkTextColorDirective
} from '@cpp/pdk';

@Component({
  selector: 'panel-item',
  templateUrl: './panel-item.component.html',
  styleUrls: ['./panel-item.component.scss'],
  imports: [PdkButtonComponent, PdkButtonDirective, PdkFillColorDirective, PdkTextColorDirective]
})
export class PanelItemComponent {
  @Input() active: boolean;
  @Output() select = new EventEmitter();
}
