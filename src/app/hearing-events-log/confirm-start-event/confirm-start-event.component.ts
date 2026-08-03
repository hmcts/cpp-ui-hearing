import { Component, Output, EventEmitter } from '@angular/core';
import { PdkAlertComponent, PdkMarginDirective, PdkTypographyDirective } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  templateUrl: './confirm-start-event.component.html',
  selector: 'confirm-start-event',
  imports: [PdkAlertComponent, PdkMarginDirective, PdkTypographyDirective, TranslatePipe]
})
export class ConfirmStartEventComponent {
  @Output()
  cancelStartEvent: EventEmitter<void>;

  @Output()
  confirmStartEvent: EventEmitter<void>;

  constructor() {
    this.cancelStartEvent = new EventEmitter();
    this.confirmStartEvent = new EventEmitter();
  }

  cancel(): void {
    this.cancelStartEvent.emit();
  }

  confirm(): void {
    this.confirmStartEvent.emit();
  }
}
