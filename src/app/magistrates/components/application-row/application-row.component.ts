import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';

import {
  PdkTableCellDirective,
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkLinkDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';
import { NgClass, DatePipe } from '@angular/common';
import { ApplicationDetailsComponent } from '../application-details/application-details.component';

@Component({
  selector: 'application-row, [application-row]',
  templateUrl: './application-row.component.html',
  styleUrls: ['./application-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkTableCellDirective,
    NgClass,
    PdkMarginDirective,
    ApplicationDetailsComponent,
    PdkPaddingDirective,
    PdkLinkDirective,
    PdkVisuallyHiddenDirective,
    DatePipe
  ]
})
export class ApplicationRowComponent {
  @Input() sequence: string;
  @Input() sittingDay: string;
  @Input() reference: string;
  @Input() prosecutor: string;
  @Input() firstName: string;
  @Input() lastName: string;
  @Input() organisationName: string;
  @Input() applicationLegislation: string;
  @Input() applicationType: string;
  @Input() description: string;
  @Input() isChildApplication: boolean;
  @Input() isParentApplication: boolean;
  @Input() respondentName: string;
  @Output() select = new EventEmitter();
}
