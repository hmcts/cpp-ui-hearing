import { Pipe, PipeTransform } from '@angular/core';
import { CourtApplicationParty } from '../../core';
import { FullNamePipe } from './full-name.pipe';

@Pipe({ name: 'partyName' })
export class PartyNamePipe implements PipeTransform {
  private fullNamePipe = new FullNamePipe();

  constructor() {}

  transform(applicationParty: CourtApplicationParty): string {
    const translateText = this.getTranslateText(applicationParty);
    return translateText ? translateText : '';
  }

  getTranslateText(applicationParty: CourtApplicationParty) {
    if (!applicationParty) {
      return null;
    }

    const { personDetails, organisation, masterDefendant, prosecutingAuthority } = applicationParty;
    if (personDetails && personDetails.firstName) {
      return this.fullNamePipe.transform(personDetails, true);
    }

    if (organisation) {
      return organisation.name;
    }

    if (masterDefendant) {
      const { personDefendant, legalEntityDefendant } = masterDefendant;

      if (personDefendant) {
        return this.fullNamePipe.transform(personDefendant.personDetails, true);
      }

      if (legalEntityDefendant) {
        return legalEntityDefendant.organisation.name;
      }
    }

    if (prosecutingAuthority) {
      return prosecutingAuthority.prosecutionAuthorityCode;
    }

    return null;
  }
}
