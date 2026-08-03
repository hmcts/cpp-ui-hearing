import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FilterOption } from '../../../core';
import { PdkForm, PdkFormFieldComponent, PdkSelectComponent } from '@cpp/pdk';

@Component({
  selector: 'delegated-powers',
  templateUrl: './delegated-powers.component.html',
  styleUrls: ['./delegated-powers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NgClass, TranslatePipe, PdkForm, PdkFormFieldComponent, PdkSelectComponent]
})
export class DelegatedPowersComponent implements OnDestroy {
  @Input()
  set delegatedPowers(delgatedPowers: string) {
    this.selectedOption = delgatedPowers ? 'POWERS_ON' : 'POWERS_OFF';
  }
  @Output() delegatedPowersChange = new EventEmitter<boolean>();

  selectedOption = 'POWERS_OFF';
  translateSubscription: Subscription;
  options: FilterOption[];

  constructor(private translate: TranslateService) {
    this.translateSubscription = this.translate
      .get(['COMMON.DELEGATED_POWERS_ON', 'COMMON.DELEGATED_POWERS_OFF'])
      .subscribe(values => {
        this.options = [
          { label: values['COMMON.DELEGATED_POWERS_OFF'], value: 'POWERS_OFF' },
          { label: values['COMMON.DELEGATED_POWERS_ON'], value: 'POWERS_ON' }
        ];
      });
  }

  onChanges(value: string) {
    this.delegatedPowersChange.emit(value === 'POWERS_ON');
  }

  ngOnDestroy() {
    if (this.translateSubscription) {
      this.translateSubscription.unsubscribe();
    }
  }
}
