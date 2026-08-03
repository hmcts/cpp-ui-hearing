import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DefaultOptions } from '../../core';
import { DatePipe } from '@angular/common';
import { PdkLinkDirective, PdkTypographyDirective } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'hearing-list-filter-summary',
  templateUrl: './hearing-list-filter-summary.component.html',
  styleUrls: ['./hearing-list-filter-summary.component.scss'],
  imports: [PdkLinkDirective, PdkTypographyDirective, DatePipe, TranslatePipe]
})
export class HearingListFilterSummaryComponent {
  @Input() options: DefaultOptions;
  @Input() showSummary: boolean;
  @Input() displayAttendeesLink: boolean;
  @Input() hasResults: boolean;
  @Output() showFilters: EventEmitter<boolean> = new EventEmitter();
  @Output() backToHearingList: EventEmitter<void> = new EventEmitter();

  onShowFilters() {
    this.showFilters.emit(true);
  }

  onBackToHearingList() {
    this.backToHearingList.emit();
  }
}
