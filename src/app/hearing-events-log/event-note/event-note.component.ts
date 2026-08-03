import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import {
  PdkFormFieldComponent,
  PdkInputComponent,
  PdkInputDirective,
  PdkTextInputDirective,
  PdkMaxCountValidatorDirective,
  PdkCharacterCountComponent,
  PdkResizeDirective
} from '@cpp/pdk';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'event-note',
  templateUrl: './event-note.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslatePipe,
    PdkFormFieldComponent,
    PdkInputComponent,
    PdkInputDirective,
    PdkTextInputDirective,
    PdkMaxCountValidatorDirective,
    PdkCharacterCountComponent,
    PdkResizeDirective
  ]
})
export class EventNoteComponent {
  @Input() eventNoteCharacterLimit = 3000;
  @Input() eventNote: string;

  @Output() eventNoteChange: EventEmitter<string> = new EventEmitter<string>();
}
