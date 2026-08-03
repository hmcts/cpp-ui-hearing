import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  ValidationError,
  PdkForm,
  PdkFormFieldComponent,
  PdkCheckboxComponent,
  PdkCheckboxGroupComponent,
  PdkGrid,
  PdkGridComponent,
  PdkTypographyDirective,
  PdkMarginDirective,
  PdkTextColorDirective,
  PdkButtonDirective
} from '@cpp/pdk';
import { TranslatePipe } from '@ngx-translate/core';
import { Offence, SelectOption, Defendant } from '../../core';
import { cloneDeep } from 'lodash-es';

import { FullNamePipe } from '../../shared/pipes/full-name.pipe';
@Component({
  selector: 'apply-decision',
  templateUrl: './apply-decision.component.html',
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    PdkForm,
    PdkFormFieldComponent,
    PdkCheckboxComponent,
    PdkCheckboxGroupComponent,
    PdkGrid,
    PdkGridComponent,
    PdkTypographyDirective,
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkButtonDirective,
    FullNamePipe
  ]
})
export class ApplyDecisionComponent implements OnInit {
  @Input() currentOffence: Offence;
  @Input() defendant: Defendant;
  @Input() hearingId: string;
  @Output() onUpdate: EventEmitter<Defendant> = new EventEmitter();
  @Output() cancel: EventEmitter<void> = new EventEmitter();

  errors: ValidationError[];
  defendantOffenceOptions: SelectOption[];
  pleaOptions: { [key: string]: string };
  selectedOffences: string[] = [];

  ngOnInit() {
    this.pleaOptions = {
      GUILTY: 'Guilty',
      NOT_GUILTY: 'Not guilty',
      INDICATED_GUILTY: 'Indicated guilty'
    };
    this.defendantOffenceOptions = [
      ...this.defendant.offences
        .filter(
          ({ id, modeOfTrial }) => id !== this.currentOffence.id && modeOfTrial === 'Either Way'
        )
        .map(({ offenceTitle, id }) => ({
          label: offenceTitle,
          value: id,
          id
        }))
    ];
  }

  onSelection(evt: Event) {
    if ((evt.target as HTMLInputElement).checked) {
      this.selectedOffences = this.selectedOffences.filter(value => value);

      this.selectedOffences =
        this.selectedOffences.length === this.defendantOffenceOptions.length - 1
          ? [...this.selectedOffences, 'all']
          : this.selectedOffences;
    } else {
      this.selectedOffences = this.selectedOffences.filter(value => value && value !== 'all');
    }
  }

  addRemoveAllOffences(evt: Event) {
    if ((evt.target as HTMLInputElement).checked) {
      this.selectedOffences = [
        ...this.defendantOffenceOptions.map(({ value: offenceId }) => offenceId)
      ];
    } else {
      this.selectedOffences = [undefined];
    }
  }
  onSubmit() {
    const selectedOffences = this.selectedOffences.filter(offence => offence !== 'all');
    const defendantCopy = cloneDeep(this.defendant);
    if (selectedOffences.length) {
      defendantCopy.offences.forEach(offence => {
        if (selectedOffences.includes(offence.id)) {
          offence.allocationDecision = {
            ...offence.allocationDecision,
            ...this.currentOffence.allocationDecision,
            offenceId: offence.id
          };

          offence.plea = {
            ...offence.plea,
            ...this.currentOffence.plea,
            offenceId: offence.id
          };

          offence.indicatedPlea = {
            ...offence.indicatedPlea,
            ...this.currentOffence.indicatedPlea,
            offenceId: offence.id
          };
        }
      });
    }
    this.onUpdate.emit(defendantCopy);
  }
}
