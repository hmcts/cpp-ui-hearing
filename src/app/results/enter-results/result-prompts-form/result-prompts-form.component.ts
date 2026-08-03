import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import {
  PdkButtonDirective,
  PdkButtonGroupComponent,
  PdkDetailsSummary,
  PdkFormComponent,
  PdkPaddingDirective,
  ValidationError
} from '@cpp/pdk';
import { keyBy } from 'lodash-es';
import {
  createDraftResultPromptsFromValueMap,
  isOptionalPromptChoice,
  isRequiredPromptChoice
} from '../../core/helpers';
import { DraftResultPrompt, PromptChoice, PromptEntry } from '../../results.interfaces';
import { FormsModule } from '@angular/forms';
import { ResultPromptsFormControlComponent } from './result-prompts-form-control.component';

@Component({
  selector: 'cpp-result-prompts-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form
      #form="ngForm"
      pdk-form
      errorFormat="extended"
      novalidate
      (errors)="errors.emit($event)"
      (validSubmit)="handleValidSubmit(form.value)"
    >
      <!-- Required prompt choices -->

      @for (promptChoice of requiredPromptChoices; track promptChoice.promptRef) {
      <cpp-prompt-choice
        [shortCode]="shortCode"
        [promptChoice]="promptChoice"
        [hasHmctsOrganisation]="hasHmctsOrganisation"
        [prosecutorToBeNotified]="prosecutorToBeNotified"
        [isExParteCase]="isExParteCase"
        [resultPrompt]="resultPromptsKeyedByPromptRef[promptChoice.promptRef]"
      >
      </cpp-prompt-choice>
      }
      <!-- Optional prompt choices -->

      @if (optionalPromptChoices.length > 0) {
      <details pdk-details [open]="openOptionalResultPrompts">
        <summary>Optional result details</summary>
        <pdk-details-text pdk-padding-bottom="0">
          @for (promptChoice of optionalPromptChoices; track promptChoice.promptRef) {
          <cpp-prompt-choice
            [shortCode]="shortCode"
            [promptChoice]="promptChoice"
            [hasHmctsOrganisation]="hasHmctsOrganisation"
            [prosecutorToBeNotified]="prosecutorToBeNotified"
            [isExParteCase]="isExParteCase"
            [resultPrompt]="resultPromptsKeyedByPromptRef[promptChoice.promptRef]"
          >
          </cpp-prompt-choice>
          }
        </pdk-details-text>
      </details>
      }
      <pdk-button-group>
        <button pdk-button type="submit">Save result details</button>
      </pdk-button-group>
    </form>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      cpp-result-prompts-form pdk-details-text cpp-prompt-choice:last-of-type *:last-child,
      cpp-result-prompts-form form > *:last-child *:last-child {
        margin-bottom: 0 !important;
      }
    `
  ],
  imports: [
    FormsModule,
    ResultPromptsFormControlComponent,
    PdkButtonGroupComponent,
    PdkButtonDirective,
    PdkFormComponent,
    PdkPaddingDirective,
    PdkDetailsSummary
  ]
})
export class ResultPromptsFormComponent implements OnInit {
  // Prompt choices act as the schema for the form, and instruct the component
  // how to build the inputs for collecting the values required. Due to
  // associations between parent/child prompt choices (such as 'oneOf' component
  // types), prompt choices may be nested within one another.
  @Input()
  set promptChoices(promptChoices: PromptChoice[]) {
    const durationRefs = new Set(
      promptChoices.filter(pc => pc.type === 'DURATION').map(pc => pc.promptRef)
    );
    // INTM prompts that share a promptRef with a DURATION are sub-components of
    // the DURATION input — exclude them to prevent a duplicate standalone control
    // and to avoid submitting a result prompt with a mismatched value type.
    const renderablePromptChoices = promptChoices.filter(
      pc => !(pc.type === 'INTM' && durationRefs.has(pc.promptRef))
    );
    this.allPromptChoices = renderablePromptChoices;
    this.optionalPromptChoices = renderablePromptChoices.filter(isOptionalPromptChoice);
    this.requiredPromptChoices = renderablePromptChoices.filter(isRequiredPromptChoice);
  }
  // Result prompts represent a completed prompt choice (i.e. a value has been
  // collected). Besides the value, they contain a small subset of the original
  // prompt choice metadata for display purposes.
  @Input()
  set resultPrompts(resultPrompts: DraftResultPrompt[]) {
    this.resultPromptsKeyedByPromptRef = keyBy(resultPrompts, 'promptRef');
  }
  @Input() shortCode?: string;
  @Input() hasHmctsOrganisation?: boolean;
  @Input() prosecutorToBeNotified?: PromptEntry[];
  @Input() isExParteCase?: boolean;

  @Output() formSubmit = new EventEmitter<DraftResultPrompt[]>();
  @Output() errors = new EventEmitter<ValidationError[] | null>();

  openOptionalResultPrompts = false;
  optionalPromptChoices: PromptChoice[] = [];
  requiredPromptChoices: PromptChoice[] = [];
  resultPromptsKeyedByPromptRef: Record<string, DraftResultPrompt> = {};

  private allPromptChoices: PromptChoice[] = [];

  ngOnInit() {
    // If any of the optional prompt choices already have values (i.e. a
    // corresponding result prompt), then expand the optional prompt choices in
    // the UI. This is to cater for situations where an optional prompt choice
    // has a value, but if the choice were collapsed, this would not be apparent
    // to the user.
    this.openOptionalResultPrompts = this.optionalPromptChoices.some(promptChoice =>
      Boolean(this.resultPromptsKeyedByPromptRef[promptChoice.promptRef])
    );
  }

  handleValidSubmit(values: Record<string, unknown>) {
    this.formSubmit.emit(createDraftResultPromptsFromValueMap(this.allPromptChoices, values));
  }
}
