import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { getCPPDate } from '../../core';
import { HearingDay } from '../../core/model/shared/hearing-day';
import { FormsModule } from '@angular/forms';
import { PdkFormFieldComponent, PdkSelectComponent } from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'multiday-dropdown',
  templateUrl: './multiday-dropdown.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./multiday-dropdown.scss'],
  imports: [FormsModule, PdkFormFieldComponent, PdkSelectComponent, TranslatePipe]
})
export class MultiDayDropDownComponent implements OnInit {
  @Input() days: HearingDay[];
  @Input() selectedDay: string;
  @Output() onSelectDay: EventEmitter<string> = new EventEmitter();

  options: { label: string; value: string }[] = [];

  ngOnInit() {
    this.days.forEach((day, index) => {
      const cppDateUtil = getCPPDate();
      const localDate = cppDateUtil.localDate(day.sittingDay);

      this.options.push({
        value: cppDateUtil.format(localDate, cppDateUtil.US_DATE_FORMAT),
        label: `${cppDateUtil.format(localDate, 'DD MMMM YYYY')} - Day ${index + 1}`
      });
    });
  }
}
