import { Pipe, PipeTransform } from '@angular/core';
import { formatDraftResultPromptValue } from '../../core/helpers';
import { DraftResultPrompt } from '../../results.interfaces';

@Pipe({ name: 'resultPromptValue' })
export class ResultPromptValuePipe implements PipeTransform {
  transform(resultPrompt: DraftResultPrompt): string {
    if (resultPrompt.value !== undefined && resultPrompt.value !== null) {
      return formatDraftResultPromptValue(resultPrompt.type, resultPrompt.value);
    }
    return '';
  }
}
