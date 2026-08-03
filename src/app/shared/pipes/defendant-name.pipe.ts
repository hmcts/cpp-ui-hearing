import { Pipe, PipeTransform } from '@angular/core';
import { Defendant } from '../../core';

export interface FormatNameOptions {
  capitalized?: boolean;
}

@Pipe({ name: 'defendantName' })
export class DefendantNamePipe implements PipeTransform {
  transform(defendant: Defendant, options?: FormatNameOptions): string {
    return 'legalEntityDefendant' in defendant
      ? defendant.legalEntityDefendant.organisation.name
      : 'personDefendant' in defendant
      ? getDisplayName(defendant.personDefendant.personDetails, options)
      : getDisplayName(defendant);
  }
}

interface DisplayNameOptions1 {
  firstName?: string;
  lastName?: string;
}

interface DisplayNameOptions2 {
  forenames: string;
  surname: string;
}

const getDisplayName = (
  variant: DisplayNameOptions1 | DisplayNameOptions2,
  { capitalized = true }: FormatNameOptions = {}
): string => {
  const firstName = 'forenames' in variant ? variant.forenames : variant.firstName;
  const lastName = 'surname' in variant ? variant.surname : variant.lastName || '';
  const formattedLastName = capitalized ? lastName.toUpperCase() : lastName;

  return firstName ? `${firstName} ${formattedLastName}` : formattedLastName;
};
