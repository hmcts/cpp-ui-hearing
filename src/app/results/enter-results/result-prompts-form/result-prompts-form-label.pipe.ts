import { Pipe, PipeTransform } from '@angular/core';
import { PromptChoice, PromptChoiceChild } from '../../results.interfaces';

@Pipe({ name: 'promptChoiceLabel' })
export class ResultPromptsFormLabelPipe implements PipeTransform {
  transform(promptChoiceLike: PromptChoice | PromptChoiceChild): string {
    if ('listLabel' in promptChoiceLike) {
      return promptChoiceLike.listLabel;
    }
    if ('partName' in promptChoiceLike) {
      return promptChoiceLike.required
        ? promptChoiceLike.label
        : `${promptChoiceLike.label} (optional)`;
    }
    return promptChoiceLike.label;
  }
}
