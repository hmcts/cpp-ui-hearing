import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'age' })
export class AgeMockPipe implements PipeTransform {
  transform(): number {
    return 30;
  }
}
