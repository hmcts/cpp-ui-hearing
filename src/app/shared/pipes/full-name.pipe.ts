import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fullName' })
export class FullNamePipe implements PipeTransform {
  transform<T extends { firstName?: string; lastName?: string }>(
    person?: T,
    capitalize = false
  ): string {
    let { firstName = '', lastName = '' } = person;
    firstName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : firstName;
    lastName = capitalize ? lastName.toUpperCase() : lastName;

    if (!lastName) {
      return firstName;
    }

    return `${firstName} ${lastName}`;
  }
}
