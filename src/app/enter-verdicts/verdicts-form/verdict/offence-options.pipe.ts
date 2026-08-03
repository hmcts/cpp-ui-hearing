import { Pipe, PipeTransform } from '@angular/core';
import { OffenceMap } from '../../../core';

@Pipe({
  name: 'offenceOptions'
})
export class OffenceOptionsPipe implements PipeTransform {
  transform(offences: OffenceMap = {}): { value: string; label: string }[] {
    return Object.values(offences)
      .sort((a, b) => (a.title > b.title ? 1 : b.title > a.title ? -1 : 0))
      .map(offence => ({
        value: offence.cjsOffenceCode,
        label: offence.title
      }));
  }
}
