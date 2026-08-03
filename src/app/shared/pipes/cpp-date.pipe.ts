import { Pipe, PipeTransform } from '@angular/core';
import { CPPDate, getCPPDate } from '../../core';

@Pipe({ name: 'cppDate' })
export class CPPDatePipe implements PipeTransform {
  private readonly cppDateUtil: CPPDate;

  constructor() {
    this.cppDateUtil = getCPPDate();
  }

  transform(utcDate: Date | string, format = 'D MMMM YYYY'): string {
    if (!utcDate) {
      return '';
    }

    const localDate = this.cppDateUtil.localDate(utcDate);

    return this.cppDateUtil.format(localDate, format);
  }
}
