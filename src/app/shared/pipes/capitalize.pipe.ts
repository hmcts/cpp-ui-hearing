import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'capitalize' })
export class CapitalizePipe implements PipeTransform {
  transform(str: string, onlyFirst = true): string {
    if (!str || str === '') {
      return '';
    }
    return str[0].toUpperCase() + (onlyFirst ? str.slice(1) : str.slice(1).toLowerCase());
  }
}
