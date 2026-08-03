import { Pipe, PipeTransform } from '@angular/core';
import { HearingPersonDetails } from '../../core';
import { Person } from '../../core';

type Defendant = HearingPersonDetails | { personDefendant: Person };

@Pipe({
  name: 'defendantNames'
})
export class DefendantNamesPipe implements PipeTransform {
  transform(people: { firstName?: string; lastName: string }[], args?: any): string {
    return people
      .map(person => {
        const { firstName = '', lastName = '' } = person;
        const fName =
          firstName.charAt(0).toUpperCase() +
          firstName.substr(1, firstName.length - 1).toLowerCase();

        if (!fName) {
          return lastName.toUpperCase();
        }

        return `${fName} ${lastName.toUpperCase()}`;
      })
      .join(', ')
      .replace(/,(?=[^,]*$)/, ' and');
  }

  transformDefendants(defendants: Defendant[]): string {
    if (!Array.isArray(defendants)) return '';

    const names = defendants
      .map(def => {
        let firstName = '';
        let lastName = '';

        if ('personDefendant' in def && def.personDefendant) {
          // Standalone Application Type when prosecutionCases not present (from courtApplication subject)
          firstName = def.personDefendant.firstName || '';
          lastName = def.personDefendant.lastName || '';
        } else if ('firstName' in def && 'lastName' in def) {
          // Existing Application Type when prosecutionCases are present (HearingPersonDetails)
          firstName = def.firstName || '';
          lastName = def.lastName || '';
        }

        const fName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

        if (!fName.trim()) {
          return lastName.toUpperCase();
        }

        return `${fName} ${lastName.toUpperCase()}`;
      })
      .filter(name => name.trim().length > 0);

    return names.join(', ').replace(/,(?=[^,]*$)/, ' and');
  }
}
