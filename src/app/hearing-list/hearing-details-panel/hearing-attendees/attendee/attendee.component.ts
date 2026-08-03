import { Component, Input } from '@angular/core';
import { PdkMarginDirective, PdkTypographyDirective, PdkTextColorDirective } from '@cpp/pdk';

@Component({
  selector: 'attendee',
  templateUrl: './attendee.component.html',
  styleUrls: ['./attendee.component.scss'],
  imports: [PdkMarginDirective, PdkTypographyDirective, PdkTextColorDirective]
})
export class AttendeeComponent {
  @Input() name: string;
  @Input() type?: string;
}
