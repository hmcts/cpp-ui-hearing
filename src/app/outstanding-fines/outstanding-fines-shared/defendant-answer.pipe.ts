import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'defendantAnswer' })
export class DefendantAnswerPipe implements PipeTransform {
  transform(value?: boolean | null): string {
    if (value === undefined || value === null) {
      return '–';
    }

    return value ? 'Yes' : 'No';
  }
}
