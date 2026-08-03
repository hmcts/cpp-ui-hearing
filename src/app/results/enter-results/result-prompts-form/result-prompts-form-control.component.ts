import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DraftResultPrompt, PromptChoice, PromptEntry } from '../../results.interfaces';
import { AddressPromptChoiceComponent } from './prompt-choices/address.component';
import { BooleanPromptChoiceComponent } from './prompt-choices/boolean.component';
import { CurrPromptChoiceComponent } from './prompt-choices/curr.component';
import { DatePromptChoiceComponent } from './prompt-choices/date.component';
import { DurationPromptChoiceComponent } from './prompt-choices/duration.component';
import { FixlPromptChoiceComponent } from './prompt-choices/fixl.component';
import { FixlmPromptChoiceComponent } from './prompt-choices/fixlm.component';
import { FixloPromptChoiceComponent } from './prompt-choices/fixlo.component';
import { FixlomPromptChoiceComponent } from './prompt-choices/fixlom.component';
import { CourtroomPromptChoiceComponent } from './prompt-choices/hcroom.component';
import { IntPromptChoiceComponent } from './prompt-choices/int.component';
import { NameAddressPromptChoiceComponent } from './prompt-choices/nameaddress.component';
import { OneOfPromptChoiceComponent } from './prompt-choices/oneof.component';
import { TimePromptChoiceComponent } from './prompt-choices/time.component';
import { TxtPromptChoiceComponent } from './prompt-choices/txt.component';
import { YesboxPromptChoiceComponent } from './prompt-choices/yesbox.component';

@Component({
  selector: 'cpp-prompt-choice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [attr.data-test-id]="promptChoice.promptRef">
      @switch (promptChoice.type) {
      <!-- ADDRESS -->

      @case ('ADDRESS') {
      <cpp-address-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt">
      </cpp-address-prompt-choice>
      }
      <!-- BOOLEAN -->

      @case ('BOOLEAN') {
      <cpp-boolean-prompt-choice
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
        [isExParteCase]="isExParteCase"
      >
      </cpp-boolean-prompt-choice>
      }
      <!-- CURR -->

      @case ('CURR') {
      <cpp-curr-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-curr-prompt-choice>
      }
      <!-- DATE -->

      @case ('DATE') {
      <cpp-date-prompt-choice
        [labelHidden]="labelHidden"
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
      >
      </cpp-date-prompt-choice>
      }
      <!-- DURATION -->

      @case ('DURATION') {
      <cpp-duration-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-duration-prompt-choice>
      }
      <!-- FIXL -->

      @case ('FIXL') {
      <cpp-fixl-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-fixl-prompt-choice>
      }
      <!-- FIXLM -->

      @case ('FIXLM') {
      <cpp-fixlm-prompt-choice
        [labelHidden]="labelHidden"
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
      >
      </cpp-fixlm-prompt-choice>
      }
      <!-- FIXLO -->

      @case ('FIXLO') {
      <cpp-fixlo-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-fixlo-prompt-choice>
      }
      <!-- FIXLOM -->

      @case ('FIXLOM') {
      <cpp-fixlom-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-fixlom-prompt-choice>
      }
      <!-- HCROOM -->

      @case ('HCROOM') {
      <cpp-hcroom-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-hcroom-prompt-choice>
      }
      <!-- INT -->

      @case ('INT') {
      <cpp-int-prompt-choice
        [labelHidden]="labelHidden"
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
      >
      </cpp-int-prompt-choice>
      }
      <!-- INTC -->

      @case ('INTC') {
      <cpp-int-prompt-choice
        [labelHidden]="labelHidden"
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
      >
      </cpp-int-prompt-choice>
      }
      <!-- INTM -->

      @case ('INTM') {
      <cpp-int-prompt-choice
        [labelHidden]="labelHidden"
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
      >
      </cpp-int-prompt-choice>
      }
      <!-- NAMEADDRESS -->

      @case ('NAMEADDRESS') {
      <cpp-nameaddress-prompt-choice
        [shortCode]="shortCode"
        [hasHmctsOrganisation]="hasHmctsOrganisation"
        [prosecutorToBeNotified]="prosecutorToBeNotified"
        [promptChoice]="promptChoice"
        [value]="resultPrompt"
      >
      </cpp-nameaddress-prompt-choice>
      }
      <!-- ONEOF -->

      @case ('ONEOF') {
      <cpp-oneof-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-oneof-prompt-choice>
      }
      <!-- TIME -->

      @case ('TIME') {
      <cpp-time-prompt-choice [promptChoice]="promptChoice" [value]="resultPrompt?.value">
      </cpp-time-prompt-choice>
      }
      <!-- TXT -->

      @case ('TXT') {
      <cpp-txt-prompt-choice
        [labelHidden]="labelHidden"
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
      >
      </cpp-txt-prompt-choice>
      }
      <!-- YESBOX -->

      @case ('YESBOX') {
      <cpp-yesbox-prompt-choice
        [labelHidden]="labelHidden"
        [promptChoice]="promptChoice"
        [value]="resultPrompt?.value"
      >
      </cpp-yesbox-prompt-choice>
      } }
    </div>
  `,
  imports: [
    AddressPromptChoiceComponent,
    BooleanPromptChoiceComponent,
    CurrPromptChoiceComponent,
    DatePromptChoiceComponent,
    DurationPromptChoiceComponent,
    FixlPromptChoiceComponent,
    FixlmPromptChoiceComponent,
    FixloPromptChoiceComponent,
    FixlomPromptChoiceComponent,
    CourtroomPromptChoiceComponent,
    IntPromptChoiceComponent,
    NameAddressPromptChoiceComponent,
    OneOfPromptChoiceComponent,
    TimePromptChoiceComponent,
    TxtPromptChoiceComponent,
    YesboxPromptChoiceComponent
  ]
})
export class ResultPromptsFormControlComponent {
  @Input() labelHidden = false;
  @Input() promptChoice: PromptChoice;
  @Input() shortCode?: string;
  @Input() resultPrompt?: DraftResultPrompt;
  @Input() hasHmctsOrganisation?: boolean;
  @Input() prosecutorToBeNotified?: PromptEntry[];
  @Input() isExParteCase?: boolean;
}
