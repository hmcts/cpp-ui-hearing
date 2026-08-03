import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'replaceNewLinesWithCommas' })
export class ReplaceNewLinesWithCommasPipe implements PipeTransform {
  transform(str: string): string {
    return str ? str.split('\n').join(', ') : '';
  }
}
