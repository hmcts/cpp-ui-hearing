import { Pipe, PipeTransform } from '@angular/core';
import { Defendant, MasterDefendant } from '../../../core';
import { TargetSubject } from '../../core/helpers';

export interface FormatNameOptions {
  capitalized?: boolean;
}

@Pipe({
  name: 'targetSubjectName'
})
export class TargetSubjectNamePipe implements PipeTransform {
  transform(targetSubject: TargetSubject, options?: FormatNameOptions): string {
    if ('masterDefendantId' in targetSubject) {
      return getDefendantName(targetSubject, options);
    }
    if ('masterDefendant' in targetSubject) {
      return getDefendantName(targetSubject.masterDefendant, options);
    }
    if ('prosecutingAuthority' in targetSubject) {
      return targetSubject.prosecutingAuthority.name;
    }
    if ('organisation' in targetSubject) {
      return targetSubject.organisation.name;
    }
    if ('representationOrganisation' in targetSubject) {
      return targetSubject.representationOrganisation.name;
    }
    if ('personDetails' in targetSubject) {
      return getDisplayName(targetSubject.personDetails, options);
    }
    return 'Unknown';
  }
}

const getDefendantName = (defendant: Defendant | MasterDefendant, options?: FormatNameOptions) => {
  return 'legalEntityDefendant' in defendant
    ? defendant.legalEntityDefendant.organisation.name
    : 'personDefendant' in defendant
    ? getDisplayName(defendant.personDefendant.personDetails, options)
    : getDisplayName(defendant);
};

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
