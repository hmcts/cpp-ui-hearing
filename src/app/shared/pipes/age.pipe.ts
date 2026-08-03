import { Pipe, PipeTransform } from '@angular/core';
import { getCPPDate } from '../../core';

@Pipe({
  name: 'age'
})
export class AgePipe implements PipeTransform {
  transform(value?: Date | string): number {
    if (!value) {
      return null;
    }

    const cppDateUtil = getCPPDate();
    const localDate = cppDateUtil.localDate(cppDateUtil.getCurrentDate());
    const localDateValue = cppDateUtil.localDate(value);
    return cppDateUtil.diff(localDate, localDateValue, 'years');
  }
}
