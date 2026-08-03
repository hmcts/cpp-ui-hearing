import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { timer } from 'rxjs';
import {
  ValidationError,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent
} from '@cpp/pdk';
import { ExtendedResolvedDraftResultLine, NgChanges } from '../../results.interfaces';
import { DraftResultChildForm, DraftResultComponent } from '../draft-result/draft-result.component';

@Component({
  selector: 'cpp-conditional-mandatory-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      #form="ngForm"
      pdk-form
      novalidate
      (errors)="errors = $event"
      (validSubmit)="valueChange.emit(form.value.conditionalMandatory)"
    >
      <pdk-form-field [label]="label" labelType="small">
        <pdk-radio-group
          name="conditionalMandatory"
          inline
          required
          [disabled]="disabled || !!resultLine.disabled"
          [(ngModel)]="internalValue"
          (ngModelChange)="submit()"
        >
          <pdk-radio-button [value]="true">Yes</pdk-radio-button>
          <pdk-radio-button [value]="false">No</pdk-radio-button>
        </pdk-radio-group>
      </pdk-form-field>
    </form>
  `,
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent
  ]
})
export class ConditionalMandatoryFormComponent
  implements DraftResultChildForm, OnDestroy, OnChanges
{
  @Input() resultLine: ExtendedResolvedDraftResultLine;
  @Input() disabled = false;
  @Input() set resultDefinitionLabel(label: string) {
    this.label = label.endsWith('?') ? label : `${label}?`;
  }
  @Input() value: boolean | null;
  @Output() valueChange = new EventEmitter<boolean>();
  @ViewChild(NgForm) private ngForm: NgForm;

  errors: ValidationError[] | null = null;
  label: string;
  suppressNextSubmit = false;
  internalValue: boolean | null;

  constructor(private draftResultComponent: DraftResultComponent) {}

  ngOnChanges(changes: NgChanges<ConditionalMandatoryFormComponent>) {
    if (changes.value) {
      this.internalValue = this.value;

      // Register this form as a child form while no 'Yes' or 'No' selection has
      // yet been made, so that its validation is triggered by the 'Save and
      // continue' behavior of the containing page. Once a selection is made, it
      // cannot be undone (due to the radio buttons), so there is no further
      // need to register this as a child form.
      if (this.value === null) {
        this.draftResultComponent.registerResultLineChildForm(this);
      } else {
        this.draftResultComponent.deregisterResultLineChildForm(this);

        // If the value is set programmatically, and the form had errors,
        // we need to suppress the next submit and remove the errors.
        const formInvalid = this.ngForm ? this.ngForm.invalid : false;
        if (this.errors || formInvalid) {
          this.suppressNextSubmit = true;
          timer(0).subscribe(() => {
            this.ngForm.resetForm({ conditionalMandatory: this.value });
            this.errors = null;
            this.suppressNextSubmit = false;
          });
        }
      }
    }
  }

  ngOnDestroy() {
    this.draftResultComponent.deregisterResultLineChildForm(this);
  }

  submit() {
    // Skip submission if this change originated programmatically
    if (this.suppressNextSubmit) {
      this.suppressNextSubmit = false;
      return;
    }

    this.ngForm.ngSubmit.emit(this.ngForm.value);
  }
}
