import { Pipe, PipeTransform } from '@angular/core';
import { VerdictType } from '../../core';

@Pipe({
  name: 'verdictTypeDescription'
})
export class VerdictTypeDescriptionPipe implements PipeTransform {
  transform(verdictType: any, verdictTypes: VerdictType[]): string {
    if (!verdictType) {
      return '';
    }
    const fullVerdictType = verdictTypes.find(vt => vt.id === verdictType.id);
    return fullVerdictType ? fullVerdictType.description : '';
  }
}
