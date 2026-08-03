import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';
import { Defendant, TodaysDefendantAttendance } from '../../core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import {
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkMarginDirective,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
@Component({
  selector: 'defendant-presence',
  templateUrl: './defendant-presence.component.html',
  styleUrls: ['./defendant-presence.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkMarginDirective,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe
  ]
})
export class DefendantPresenceComponent implements OnInit {
  @Input() defendant: Defendant;
  @Input() todayDefendantAttendance: TodaysDefendantAttendance;
  @Input() participantPresent: string = '';
  @Output() onSave: EventEmitter<any> = new EventEmitter();

  selectedOption: string;
  saved: boolean;
  options: { label: string; value: string }[];
  translateSubscription: Subscription;

  constructor(private translate: TranslateService) {
    this.translateSubscription = this.translate
      .get(['COMMON.IN_PERSON', 'COMMON.BY_VIDEO', 'COMMON.NOT_PRESENT'])
      .subscribe(values => {
        this.options = [
          { label: values['COMMON.IN_PERSON'], value: 'IN_PERSON' },
          { label: values['COMMON.BY_VIDEO'], value: 'BY_VIDEO' },
          { label: values['COMMON.NOT_PRESENT'], value: 'NOT_PRESENT' }
        ];
      });
  }

  ngOnInit() {
    if (this.todayDefendantAttendance) {
      this.selectedOption = this.todayDefendantAttendance.attendanceType;
    }
  }

  onSavePresence() {
    this.onSave.emit({
      selectedOption: this.selectedOption,
      defendantId: this.defendant.id
    });
  }
}
