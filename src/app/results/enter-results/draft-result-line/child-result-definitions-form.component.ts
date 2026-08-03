import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import {
  ValidationError,
  PdkFormComponent,
  PdkFormFieldComponent,
  PdkFieldsetLegendDirective,
  PdkVisuallyHiddenDirective,
  PdkRadioGroupComponent,
  PdkRadioButtonComponent,
  PdkAutosuggestLiteComponent
} from '@cpp/pdk';
import { intersection, map } from 'lodash-es';
import { ChildResultDefinition } from '../../results.interfaces';
import { DraftResultComponent } from '../draft-result/draft-result.component';

@Component({
  selector: 'cpp-child-result-definitions-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form #form="ngForm" pdk-form novalidate (errors)="errors = $event">
      <!-- oneOf -->

      @if (pendingOneOf.length > 0) {
      <pdk-form-field
        [errorMessages]="[{ rule: 'required', message: 'Select a result' }]"
        [labelForErrorSummary]="resultDefinitionLabel + ' - Select a result'"
      >
        <legend pdk-legend="small">
          Select result <span pdk-visually-hidden>for {{ resultDefinitionLabel }}</span>
        </legend>
        <pdk-radio-group
          name="oneOf"
          ngModel
          [required]="required"
          (ngModelChange)="childResultDefinitionSelected.emit(form.value.oneOf)"
        >
          @for (childResultDefinition of pendingOneOf; track $index) {
          <pdk-radio-button [value]="childResultDefinition">
            {{ childResultDefinition.label }}
          </pdk-radio-button>
          }
        </pdk-radio-group>
      </pdk-form-field>
      }
      <!-- atLeastOneOf -->

      @if (pendingAtLeastOneOf.length > 0) {
      <pdk-form-field
        label="Additional result(s) required, please select one OR more"
        labelType="small"
        [errorMessages]="[{ rule: 'required', message: 'Select one or more results' }]"
        [labelForErrorSummary]="
          resultDefinitionLabel + ' - Additional result(s) required, please select one OR more'
        "
      >
        <pdk-autosuggest-lite
          name="atLeastOneOf"
          ngModel
          [required]="required && pendingAtLeastOneOf.length === atLeastOneOf.length"
          [suggestions]="atLeastOneOfSuggestions"
          suggestionKey="code"
          suggestionTitle="label"
          (inputText)="handleAtLeastOneOfSuggestions($event)"
          (ngModelChange)="handleAtLeastOneOfSuggestionSelected($event)"
        >
        </pdk-autosuggest-lite>
      </pdk-form-field>
      }
    </form>
  `,
  imports: [
    FormsModule,
    PdkFormComponent,
    PdkFormFieldComponent,
    PdkFieldsetLegendDirective,
    PdkVisuallyHiddenDirective,
    PdkRadioGroupComponent,
    PdkRadioButtonComponent,
    PdkAutosuggestLiteComponent
  ]
})
export class ChildResultDefinitionsFormComponent implements OnChanges, OnInit, OnDestroy {
  @Input() atLeastOneOf: ChildResultDefinition[] = [];
  @Input() oneOf: ChildResultDefinition[] = [];
  // The individual required behaviour of the child result definitions can be
  // overriden by this input. This is typically done when a result line belongs
  // to an optional branch of the draft result. For example, where a pristine
  // optional child requires a `oneOf` choice, this `oneOf` choice is therefore
  // not required while this optional branch remains pristine.
  @Input() required = true;
  @Input() resultDefinitionLabel: string;
  @Input() selectedChildResultDefinitionIds: string[] = [];
  @Output() childResultDefinitionSelected = new EventEmitter<ChildResultDefinition>();
  @ViewChild(NgForm) private form: NgForm;

  atLeastOneOfSuggestions: ChildResultDefinition[] = [];
  errors: ValidationError[] | null;
  pendingAtLeastOneOf: ChildResultDefinition[] = [];
  pendingOneOf: ChildResultDefinition[] = [];

  constructor(private draftResultComponent: DraftResultComponent) {}

  ngOnChanges() {
    this.pendingAtLeastOneOf = this.atLeastOneOf.filter(
      ({ code }) => !this.selectedChildResultDefinitionIds.includes(code)
    );
    // The 'oneof' rule type can exist only once within the result lines that
    // this offence is grouped with, so check for any of its child result
    // definitions already existing.
    this.pendingOneOf =
      intersection(map(this.oneOf, 'code'), this.selectedChildResultDefinitionIds).length > 0
        ? []
        : this.oneOf;
  }

  ngOnInit() {
    this.draftResultComponent.registerResultLineChildForm(this);
  }

  ngOnDestroy() {
    this.draftResultComponent.deregisterResultLineChildForm(this);
  }

  handleAtLeastOneOfSuggestions(text: string) {
    this.atLeastOneOfSuggestions = this.pendingAtLeastOneOf
      .filter(value => value.label.toLowerCase().includes(text.toLowerCase()))
      .slice(0, 8);
  }

  handleAtLeastOneOfSuggestionSelected(childResultDefinition?: ChildResultDefinition) {
    if (childResultDefinition) {
      this.form.resetForm();
      this.childResultDefinitionSelected.emit(childResultDefinition);
    }
  }

  submit() {
    this.errors = null;
    this.form.ngSubmit.emit(this.form.value);
  }
}
