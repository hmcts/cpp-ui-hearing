import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { PdkDateInput, PdkDateInputComponent, PdkFormFieldComponent } from '@cpp/pdk';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { getSelectedHearingDate } from '../../../../core';
import { ResultsState } from '../../../core/store';
import { DatePromptChoice } from '../../../results.interfaces';
import { HearingDayDateValidatorDirective } from '../hearing-day-date-validator.directive';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

@Component({
  selector: 'cpp-date-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field
      [label]="promptChoice | promptChoiceLabel"
      [labelType]="labelHidden ? 'none' : 'small'"
      [errorMessages]="errorMessages"
    >
      <pdk-date-input
        [ngModel]="value"
        [name]="promptChoice.promptRef"
        [promptChoiceValidator]="promptChoice"
        [hearingDayDateValidator]="promptChoice.futureDate ? (hearingDay$ | async) : null"
      ></pdk-date-input>
    </pdk-form-field>
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: NgForm
    }
  ],
  imports: [
    AsyncPipe,
    FormsModule,
    PdkFormFieldComponent,
    PdkDateInput,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective,
    HearingDayDateValidatorDirective,
    PdkDateInputComponent
  ]
})
export class DatePromptChoiceComponent {
  @Input() labelHidden = false;
  @Input() promptChoice: DatePromptChoice;
  @Input() value?: string;

  readonly hearingDay$: Observable<string>;

  readonly errorMessages = [
    { rule: 'required', message: 'Enter a date' },
    { rule: 'dateFormat', message: 'Enter a date in the correct format' },
    { rule: 'pastDate', message: 'Enter a date in the future' }
  ];

  constructor(store: Store<ResultsState>) {
    this.hearingDay$ = store.pipe(select(getSelectedHearingDate));
  }
}
