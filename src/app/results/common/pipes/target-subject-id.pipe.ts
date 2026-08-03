import { Pipe, PipeTransform } from '@angular/core';
import { getSubjectId, TargetSubject } from '../../core/helpers';

@Pipe({
  name: 'targetSubjectId'
})
export class TargetSubjectIdPipe implements PipeTransform {
  transform(targetSubject: TargetSubject): string {
    return getSubjectId(targetSubject);
  }
}
