import { Pipe, PipeTransform } from '@angular/core';
import { CourtApplicationParty } from '../../core/model';
import { ApplicationPartyNamePipe } from './application-party-name.pipe';

@Pipe({ name: 'applicationParties' })
export class ApplicationPartiesPipe implements PipeTransform {
  private partyNamePipe = new ApplicationPartyNamePipe();

  constructor() {}

  transform(applicationParties: CourtApplicationParty[]): string {
    return applicationParties.map(party => this.partyNamePipe.getTranslateText(party)).join(', ');
  }
}
