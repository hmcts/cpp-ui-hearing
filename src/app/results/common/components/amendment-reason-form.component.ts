import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PDK_MODAL_DATA_TOKEN,
  SelectOption,
  PdkForm,
  PdkFormFieldComponent,
  PdkSelectComponent,
  PdkButtonGroupComponent,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkLinkDirective,
  PdkFillColorDirective,
  PdkPaddingDirective
} from '@cpp/pdk';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AmendmentReason, getAmendmentReasons } from '../../../core';
import { ResultsState } from '../../core/store';
import { AsyncPipe } from '@angular/common';

export interface AmendmentsReasonData extends Record<string, unknown> {
  initialValue?: AmendmentReason;
  onSubmit: (amendmentReason: AmendmentReason) => void;
  onCancel: () => void;
}

@Component({
  selector: 'cpp-amendment-reason-form',
  template: `
    <form
      #form="ngForm"
      pdk-form
      pdk-fill-colour="white"
      pdk-padding-top="6"
      pdk-padding-bottom="2"
      pdk-padding-horizontal="6"
      (validSubmit)="handleSubmit(form.value.amendmentReasonId)"
    >
      <pdk-form-field
        label="You must enter a reason to add, change or delete this result"
        labelType="small"
      >
        <pdk-select
          justified
          [ngModel]="initialValue"
          [name]="'amendmentReasonId'"
          [options]="options$ | async"
          placeholder="State reason"
          required
        >
        </pdk-select>
      </pdk-form-field>
      <pdk-button-group>
        <button pdk-button>Save reason</button>
        <a role="button" pdk-link href="javascript:void(0)" (click)="modalData.onCancel()"
          >Cancel</a
        >
      </pdk-button-group>
    </form>
  `,
  imports: [
    FormsModule,
    AsyncPipe,
    PdkForm,
    PdkFormFieldComponent,
    PdkSelectComponent,
    PdkButtonGroupComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    PdkLinkDirective,
    PdkFillColorDirective,
    PdkPaddingDirective
  ]
})
export class AmendmentReasonFormComponent {
  initialValue?: string;
  options$: Observable<SelectOption<string>[]>;

  constructor(
    @Inject(PDK_MODAL_DATA_TOKEN) public modalData: AmendmentsReasonData,
    private store: Store<ResultsState>
  ) {
    this.options$ = this.store.pipe(
      select(getAmendmentReasons),
      map(amendmentReasons =>
        amendmentReasons.map(amendmentReason => ({
          value: amendmentReason.id,
          label: amendmentReason.reasonDescription
        }))
      )
    );
    this.initialValue = this.modalData.initialValue && this.modalData.initialValue.id;
  }

  handleSubmit(amendmentReasonId: string) {
    this.store.pipe(select(getAmendmentReasons), take(1)).subscribe(amendmentReasons => {
      this.modalData.onSubmit(
        amendmentReasons.find(amendmentReason => amendmentReason.id === amendmentReasonId)
      );
    });
  }
}
