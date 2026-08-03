import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  forwardRef,
  inject
} from '@angular/core';
import { ControlContainer, NgForm, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  createDraftResultPrompt,
  getForeignKeysForTarget,
  isBooleanPromptChoice
} from '../../../core/helpers';
import { ReusableInfoService } from '../../../core/services/reusable-info.service';
import { DraftResultPrompt, OneOfPromptChoice } from '../../../results.interfaces';
import { DraftResultLineComponent } from '../../draft-result-line/draft-result-line.component';

import { ResultPromptsFormControlComponent } from '../result-prompts-form-control.component';
import { ResultPromptsFormLabelPipe } from '../result-prompts-form-label.pipe';
import {
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkRadioConditionalComponent
} from '@cpp/pdk';

@Component({
  selector: 'cpp-oneof-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pdk-form-field [label]="promptChoice | promptChoiceLabel" labelType="small">
      <pdk-radio-group
        #oneOf="ngModel"
        [name]="promptChoice.promptRef + 'ChildIndex'"
        [ngModel]="selectedChildIndex"
        (ngModelChange)="selectedChildIndexChange$.next($event)"
        [required]="promptChoice.required"
      >
        @for (child of promptChoice.children; track child.promptRef; let i = $index) { @if
        (child.type === 'BOOLEAN' && oneOf.value === i) {
        <input [name]="child.promptRef" [ngModel]="true" type="hidden" />
        }
        <pdk-radio-button [value]="i">{{ child.label }}</pdk-radio-button>
        @if (oneOf.value === i && child.type !== 'BOOLEAN') {
        <pdk-radio-conditional>
          <cpp-prompt-choice [labelHidden]="true" [promptChoice]="child" [resultPrompt]="value">
          </cpp-prompt-choice>
        </pdk-radio-conditional>
        } }
      </pdk-radio-group>
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
    forwardRef(() => ResultPromptsFormControlComponent),
    ResultPromptsFormLabelPipe,
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkRadioConditionalComponent
  ]
})
export class OneOfPromptChoiceComponent implements OnChanges {
  @Input() promptChoice: OneOfPromptChoice;
  @Input() value?: DraftResultPrompt;

  selectedChildIndex: number | null;
  selectedChildIndexChange$ = new Subject<number>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    changeDetectorRef: ChangeDetectorRef,
    { resultLine }: DraftResultLineComponent,
    reusableInfoService: ReusableInfoService,
    route: ActivatedRoute
  ) {
    // Unlike other prompt choices, where the promptRef and type is known at the
    // point of creating the result line, the child prompt choice used by ONEOF
    // is unknown until selected by the user. Consequently, we cannot acquire
    // its ROI values until this point.
    //
    // If an ROI value exists, rather than create a `resultPrompt` for the
    // prompt choice against the result line, a local result prompt is created
    // for use within this form only, so that the result-prompt-summary for the
    // result line is not updated as a consequence of switching back/forth
    // between ONEOF choices.
    this.selectedChildIndexChange$
      .pipe(
        map(index => this.promptChoice.children[index]),
        switchMap(child => {
          if (!isBooleanPromptChoice(child)) {
            return reusableInfoService
              .getValueForPromptChoice(child, {
                ...getForeignKeysForTarget(resultLine),
                orderedDate: resultLine.orderedDate,
                hearingId: route.snapshot.paramMap.get('hearingId')
              })
              .pipe(
                map(
                  reusableInfoItem =>
                    reusableInfoItem && createDraftResultPrompt(child, reusableInfoItem.value)
                ),
                catchError(() => of(undefined))
              );
          }
          return of(undefined);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        if (value !== this.value) {
          this.value = value;
          changeDetectorRef.markForCheck();
        }
      });
  }

  ngOnChanges() {
    // Determine the `selectedChildIndex` for the radio group by matching any
    // existing result prompt with the prompt choice's children.
    if (this.value) {
      this.promptChoice.children.forEach((child, index) => {
        if (this.value.promptRef === child.promptRef) {
          this.selectedChildIndex = index;
        }
      });
    }
  }
}
