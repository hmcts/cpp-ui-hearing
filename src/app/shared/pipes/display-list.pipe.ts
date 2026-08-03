import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'displayList' })
export class DisplayListPipe implements PipeTransform {
  transform(list: string[] = [], andString = 'and'): string {
    return list.length < 2
      ? list.join(', ')
      : `${list.slice(0, list.length - 1).join(', ')} ${andString} ${list[list.length - 1]}`;
  }
}
