import { Component, Input, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { HearingSummary, HearingDetail } from '../../core';
import { PdkMarginDirective } from '@cpp/pdk';
import { PanelItemComponent } from '../panel-item/panel-item.component';
import { HearingSummaryItemComponent } from './hearing-summary-item/hearing-summary-item.component';

@Component({
  selector: 'hearing-list-panel',
  templateUrl: './hearing-list-panel.component.html',
  styleUrls: ['./hearing-list-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PdkMarginDirective, PanelItemComponent, HearingSummaryItemComponent]
})
export class HearingListPanelComponent {
  @Input() hearingList: HearingSummary[];
  @Input() activeHearing: HearingDetail;
  @Input() selectedHearingDate: string;
  @Output() onSelectHearing: EventEmitter<HearingSummary> = new EventEmitter();

  select(hearing: HearingSummary) {
    this.onSelectHearing.emit(hearing);
  }
}
