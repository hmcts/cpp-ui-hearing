import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { isUndefined } from 'lodash-es';
import {
  PdkMarginDirective,
  PdkPaddingDirective,
  PdkTextColorDirective,
  PdkVisuallyHiddenDirective
} from '@cpp/pdk';
import { DraftResultPrompt } from '../../results.interfaces';
import { ResultPromptValuePipe } from '../pipes/result-prompt-value.pipe';

@Component({
  selector: 'cpp-result-prompts-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl class="result-prompts-summary" [class.result-prompts-summary--inline]="inline">
      @for (resultPrompt of resultPromptsForDisplay; track resultPrompt.promptId) {
      <div
        [class.result-prompts-summary__row]="highlighted"
        [pdk-padding-left]="highlighted ? 1 : null"
        [pdk-padding-right]="highlighted ? 1 : 2"
      >
        @switch (resultPrompt.type) { @case ('BOOLEAN') { @if (resultPrompt.value !== undefined) {
        <dt pdk-margin-right="1" class="result-prompt--boolean">
          {{ resultPrompt.label }}{{ resultPrompt.value === false ? ': No ' : '' }}
        </dt>
        <dd pdk-visually-hidden>
          {{ resultPrompt | resultPromptValue }}
        </dd>
        } } @case ('YESBOX') { @if (resultPrompt.value) {
        <dt pdk-margin-right="1" pdk-text-colour="black" tint="25">
          {{ resultPrompt.label }}
        </dt>
        } } @default {
        <dt pdk-margin-right="1" pdk-text-colour="black" tint="25">
          {{ resultPrompt.label }}
        </dt>
        <dd>{{ resultPrompt | resultPromptValue }}</dd>
        } }
      </div>
      }
    </dl>
  `,
  styles: [
    `
      dl.result-prompts-summary {
        margin: 0;
      }
      dl.result-prompts-summary--inline {
        display: flex;
        flex-wrap: wrap;
      }
      dl.result-prompts-summary--inline > div {
        display: inline-block;
        margin: 0;
        line-height: 1.5;
      }
      dt,
      dd {
        display: inline;
        margin: 0;
      }
      dt:not(.result-prompt--boolean) {
        font-weight: bold;
      }
      div.result-prompts-summary__row {
        background-color: #d5d7ed;
      }
    `
  ],
  imports: [
    ResultPromptValuePipe,
    PdkPaddingDirective,
    PdkMarginDirective,
    PdkTextColorDirective,
    PdkVisuallyHiddenDirective
  ]
})
export class ResultPromptsSummaryComponent {
  @Input() inline = true;
  @Input() highlighted = true;
  @Input()
  set resultPrompts(resultPrompts: DraftResultPrompt[]) {
    this.resultPromptsForDisplay = resultPrompts
      .filter(resultPrompt => resultPrompt.type !== 'HIDDEN' && !isUndefined(resultPrompt.value))
      .map(resultPrompt =>
        resultPrompt.type === 'ONEOF' ? (resultPrompt.value as DraftResultPrompt) : resultPrompt
      );
  }
  @HostBinding('style.display') display = 'block';

  resultPromptsForDisplay: DraftResultPrompt[] = [];
}
