import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PdkTypographyDirective, PdkMarginDirective } from '@cpp/pdk';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'court-location',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './court-location.component.html',
  imports: [PdkTypographyDirective, PdkMarginDirective, DatePipe]
})
export class CourtLocationComponent {
  @Input() courtName: string;
  @Input() hearingDate: string;
}
