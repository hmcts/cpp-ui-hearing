import { Pipe, PipeTransform } from '@angular/core';
import { PromptChoice, PromptChoiceChild } from '../../results.interfaces';

@Pipe({
  name: 'promptChoiceFormat'
})
export class PromptChoiceFormatPipe implements PipeTransform {
  transform(promptChoice: PromptChoiceChild | PromptChoice) {
    if ('partName' in promptChoice) {
      switch (promptChoice.partName) {
        case 'AddressLine1':
        case 'AddressLine2':
        case 'AddressLine3':
        case 'AddressLine4':
        case 'AddressLine5':
          return 'addressLine';

        case 'EmailAddress1':
        case 'EmailAddress2':
          return 'email';

        case 'PostCode':
          return 'postcode';
      }
    }
    return null;
  }
}
