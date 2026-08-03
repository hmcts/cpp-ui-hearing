import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { ControlContainer, NgForm, NgModel, FormsModule } from '@angular/forms';
import { SelectOption, PdkFormFieldComponent, PdkSelectComponent } from '@cpp/pdk';
import { getOrganisationUnits } from '@cpp/reference-data';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, withLatestFrom } from 'rxjs/operators';
import { ResultsState } from '../../../core/store';
import { PromptChoice } from '../../../results.interfaces';
import { AsyncPipe } from '@angular/common';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import { PromptChoiceValidatorDirective } from '../prompt-choice-validator.directive';

const hCHOUSEOrganisationName = 'hCHOUSEOrganisationName';

@Component({
  selector: 'cpp-hcroom-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field [label]="promptChoice | promptChoiceLabel" labelType="small">
      <pdk-select
        [ngModel]="value"
        [name]="promptChoice.promptRef"
        [options]="options$ | async"
        justified
        placeholder="Select a courtroom"
        [promptChoiceValidator]="promptChoice"
      >
      </pdk-select>
    </pdk-form-field>
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: NgForm
    }
  ],
  imports: [
    FormsModule,
    AsyncPipe,
    PdkFormFieldComponent,
    PdkSelectComponent,
    ResultPromptsFormLabelPipe,
    PromptChoiceValidatorDirective
  ]
})
export class CourtroomPromptChoiceComponent {
  @Input() promptChoice: PromptChoice;
  @Input() value?: string;
  @ViewChild(NgModel) ngModel: NgModel;

  options$: Observable<SelectOption<string>[]>;

  constructor(controlContainer: ControlContainer, store: Store<ResultsState>) {
    this.options$ = controlContainer.valueChanges.pipe(
      select(values => values[hCHOUSEOrganisationName] as string | null),
      withLatestFrom(store.pipe(select(getOrganisationUnits))),
      map(([courtCentreName, organisationUnits]) => {
        if (courtCentreName) {
          const { courtrooms = [] } = organisationUnits.find(
            organisationUnit => organisationUnit.oucodeL3Name === courtCentreName
          );

          return courtrooms.map(courtroom => ({
            label: courtroom.courtroomName,
            value: courtroom.courtroomName
          }));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }
}
