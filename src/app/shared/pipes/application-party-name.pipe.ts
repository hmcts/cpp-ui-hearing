import { Pipe, PipeTransform } from '@angular/core';
import { CourtApplicationParty } from '../../core/model';
import { FullNamePipe } from './full-name.pipe';

@Pipe({ name: 'applicationPartyName' })
export class ApplicationPartyNamePipe implements PipeTransform {
  private fullNamePipe = new FullNamePipe();

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
      return this.fullNamePipe.transform(personDetails);
    }

    if (organisation) {
      return organisation.name;
    }

    if (masterDefendant) {
      const { personDefendant, legalEntityDefendant } = masterDefendant;

      if (personDefendant) {
        return this.fullNamePipe.transform(personDefendant.personDetails);
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
