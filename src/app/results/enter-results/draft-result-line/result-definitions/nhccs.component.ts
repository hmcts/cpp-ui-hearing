import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PdkLinkDirective, PdkDetailsSummary, ValidationError } from '@cpp/pdk';
import { uniqBy } from 'lodash-es';
import {
  DraftResultPrompt,
  ExtendedResolvedDraftResultLine,
  NgChanges,
  PromptChoice
} from '../../../results.interfaces';
import { ResultPromptsFormComponent } from '../../result-prompts-form/result-prompts-form.component';

const EXISTING_HEARING_PROMPT_REF = 'existingHearingId';

@Component({
  selector: 'cpp-nhccs-result-line-body',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!hasRemandStatus) {
    <p>
      <a
        pdk-link
        [routerLink]="[
          '/manage',
          hearingId,
          'enter-results',
          'result-lines',
          resultLine.resultLineId,
          'crown',
          'related-hearings'
        ]"
        [queryParams]="{ isApplication: isApplication }"
        >Find an available hearing</a
      >
    </p>
    } @if (hasRemandStatus) {
    <details
      pdk-details
      [open]="resultPromptsFormExpanded"
      (toggle)="resultPromptsFormExpanded = $event.target.open"
    >
      <summary pdk-summary>Result details</summary>
      <pdk-details-text>
        <cpp-result-prompts-form
          [promptChoices]="promptChoices"
          [resultPrompts]="resultPrompts"
          (errors)="errors.emit($event)"
          (formSubmit)="handleSubmitResultPrompts($event)"
        >
        </cpp-result-prompts-form>
      </pdk-details-text>
    </details>
    }
  `,
  imports: [PdkLinkDirective, RouterLink, ResultPromptsFormComponent, PdkDetailsSummary]
})
export class NHCCSResultLineComponent implements OnInit, OnChanges {
  @Input() resultLine: ExtendedResolvedDraftResultLine;
  @Input() isApplication?: boolean;
  @Output() errors = new EventEmitter<ValidationError[] | null>();
  @Output() resultPromptsChange = new EventEmitter<DraftResultPrompt[]>();

  hearingId: string;
  promptChoices: PromptChoice[] = [];
  resultPromptsFormExpanded = false;
  resultPrompts: DraftResultPrompt[] = [];

  constructor(route: ActivatedRoute) {
    this.hearingId = route.snapshot.paramMap.get('hearingId');
  }

  get hasRelatedHearing(): boolean {
    return this.resultLine.resultPrompts.some(
      resultPrompt => resultPrompt.promptRef === EXISTING_HEARING_PROMPT_REF
    );
  }

  get hasRemandStatus(): boolean {
    return this.resultLine.promptChoices.some(
      resultPrompt => resultPrompt.promptRef === 'remandStatus'
    );
  }

  ngOnInit() {
    // If the result line is invalid upon rendering, then expand the details so
    // as to present the user with the inputs for any outstanding details
    this.resultPromptsFormExpanded = !this.resultLine.valid;
  }

  ngOnChanges(changes: NgChanges<NHCCSResultLineComponent>) {
    if (changes.resultLine) {
      this.promptChoices = this.hasRelatedHearing
        ? this.resultLine.promptChoices.filter(
            promptChoice => promptChoice.promptRef === 'remandStatus'
          )
        : this.resultLine.promptChoices;

      this.resultPrompts = this.resultLine.resultPrompts.filter(
        promptChoice => promptChoice.promptRef !== EXISTING_HEARING_PROMPT_REF
      );
    }
  }

  handleSubmitResultPrompts(resultPrompts: DraftResultPrompt[]) {
    this.resultPromptsFormExpanded = false;
    this.resultPromptsChange.emit(
      this.hasRelatedHearing
        ? uniqBy([...this.resultLine.resultPrompts, ...resultPrompts], 'promptRef')
        : resultPrompts
    );
  }
}
