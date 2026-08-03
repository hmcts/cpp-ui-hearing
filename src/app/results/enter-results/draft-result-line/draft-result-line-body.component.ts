import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from '@angular/core';
import {
  PdkDetailsSummary,
  PdkDetailsTextDirective,
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkVisuallyHiddenDirective,
  ValidationError
} from '@cpp/pdk';
import {
  DraftResultPrompt,
  ExtendedResolvedDraftResultLine,
  NgChanges,
  PromptEntry
} from '../../results.interfaces';
import { NHCCSResultLineComponent } from './result-definitions/nhccs.component';
import { NHMCResultLineComponent } from './result-definitions/nhmc.component';
import { ResultPromptsFormComponent } from '../result-prompts-form/result-prompts-form.component';

@Component({
  selector: 'cpp-draft-result-line-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="max-width: 680px" pdk-margin-top="2" pdk-margin-bottom="6">
      @switch (resultLine.shortCode.toUpperCase()) {
      <!-- custom prompts handling for shorcodes can be applied here -->

      @case ('NHCCS') {
      <cpp-nhccs-result-line-body
        [resultLine]="resultLine"
        [isApplication]="isApplication"
        (errors)="errors.emit($event)"
        (resultPromptsChange)="resultPromptsChange.emit($event)"
      >
      </cpp-nhccs-result-line-body>
      } @case ('NHMC') {
      <cpp-nhmc-result-line-body
        [resultLine]="resultLine"
        [isApplication]="isApplication"
        [canAllocateRelatedHearing]="canAllocateRelatedHearing"
      >
      </cpp-nhmc-result-line-body>
      } @default {
      <details
        pdk-details
        [open]="resultPromptsFormExpanded"
        (toggle)="handleToggleDetails($event)"
      >
        <summary pdk-summary>
          {{ required ? 'Result details' : 'Optional results' }}
          <span pdk-visually-hidden>for {{ resultLine.label }}</span>
        </summary>
        @if (resultPromptsFormDidExpand) {
        <pdk-details-text pdk-padding-bottom="0">
          <cpp-result-prompts-form
            [promptChoices]="resultLine.promptChoices"
            [resultPrompts]="resultLine.resultPrompts"
            [hasHmctsOrganisation]="hasHmctsOrganisation"
            [prosecutorToBeNotified]="prosecutorToBeNotified"
            [isExParteCase]="isExParteCase"
            [shortCode]="resultLine.shortCode"
            (errors)="errors.emit($event)"
            (formSubmit)="handleResultsPromptsChange($event)"
          >
          </cpp-result-prompts-form>
        </pdk-details-text>
        }
      </details>
      } }
    </div>
  `,
  imports: [
    PdkMarginDirective,
    NHCCSResultLineComponent,
    NHMCResultLineComponent,
    PdkVisuallyHiddenDirective,
    PdkDetailsTextDirective,
    PdkPaddingDirective,
    ResultPromptsFormComponent,
    PdkDetailsSummary
  ]
})
export class DraftResultLineBodyComponent implements OnChanges {
  @Input() required = true;
  @Input() resultLine: ExtendedResolvedDraftResultLine;
  @Input() isApplication?: boolean;
  @Input() hasHmctsOrganisation?: boolean;
  @Input() prosecutorToBeNotified?: PromptEntry[];
  @Input() isExParteCase?: boolean;
  @Input() canAllocateRelatedHearing: boolean;
  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() resultPromptsChange = new EventEmitter<DraftResultPrompt[]>();

  // Prior to first being expanded, the result prompts form is not rendered at
  // all in the DOM as a performance optimiziation
  resultPromptsFormDidExpand = false;
  resultPromptsFormExpanded = false;

  ngOnChanges(changes: NgChanges<DraftResultLineBodyComponent>) {
    if (changes.required) {
      const { valid, resultPrompts = [] } = this.resultLine;
      // Where the result line is optional, we don't expand its result prompts
      // form by default unless result prompts have been collected already (either
      // manually or from a cache) and are incomplete (i.e. invalid).
      if (this.required) {
        // If the result line is invalid upon rendering, then expand the details so
        // as to present the user with the inputs for any outstanding details
        this.resultPromptsFormExpanded = !valid;
      } else {
        this.resultPromptsFormExpanded = resultPrompts.length === 0 ? false : !valid;
      }
      if (this.resultPromptsFormExpanded) {
        this.resultPromptsFormDidExpand = true;
      }
    }
  }

  handleResultsPromptsChange = (resultPrompts: DraftResultPrompt[]) => {
    this.resultPromptsChange.emit(resultPrompts);
    this.resultPromptsFormExpanded = false;
    this.errors.emit(null);
  };

  handleToggleDetails(event: Event) {
    // Optimize performance by rendering the result prompts form only when it has
    // been expanded for editing.
    this.resultPromptsFormExpanded = (event.target as HTMLDetailsElement).open;

    if (this.resultPromptsFormExpanded) {
      this.resultPromptsFormDidExpand = true;
    }
  }
}
