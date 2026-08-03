import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { sortBy, uniqBy } from 'lodash-es';
import { CourtApplication, Offence } from '../../../../../core';
import { PdkMarginDirective, PdkDetailsSummary } from '@cpp/pdk';

@Component({
  selector: 'hearing-offences',
  templateUrl: './hearing-offences.component.html',
  imports: [PdkMarginDirective, PdkDetailsSummary]
})
export class HearingOffencesComponent implements OnInit, OnChanges {
  @Input() offences: Offence[];
  @Input() applications: CourtApplication[];
  @Input() hearingType: string;
  constructor() {}

  ngOnInit(): void {
    this.offences = this.sortUniqueOffences(this.offences);
  }

  ngOnChanges() {
    this.offences = this.sortUniqueOffences(this.offences);
  }

  sortUniqueOffences(offences: Offence[]): Offence[] {
    const uniqueOffences = this.uniqueOffences(offences);
    return this.sortOffences(uniqueOffences);
  }

  uniqueOffences(offences: Offence[]): Offence[] {
    return uniqBy(offences, offence => offence.statementOfOffence.title);
  }

  sortOffences(offences: Offence[]): Offence[] {
    return sortBy(offences, ['statementOfOffence.title']);
  }

  greaterThanOne(offences: Offence[]): boolean {
    return offences.length >= 2;
  }
}
