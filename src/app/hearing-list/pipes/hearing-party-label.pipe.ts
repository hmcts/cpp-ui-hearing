import { Pipe, PipeTransform } from '@angular/core';
import { DefendantName, HearingSummary } from '../../core/model';
import { CourtApplicationSummary } from '../../core/model/shared/court-application-summary';
import { ProsecutionCaseSummary } from '../../core/model/shared/prosecution-case-summary';

@Pipe({ name: 'hearingPartyLabel' })
export class HearingPartyLabelPipe implements PipeTransform {
  transform(hearing: HearingSummary): string {
    const { prosecutionCaseSummaries, courtApplicationSummaries } = hearing;
    if (prosecutionCaseSummaries && prosecutionCaseSummaries.length) {
      return this.getCaseDefendantsLabel(prosecutionCaseSummaries);
    }

    return this.getApplicationPartyLabel(courtApplicationSummaries);
  }

  getApplicationPartyLabel(courtApplicationSummaries: CourtApplicationSummary[]) {
    const subjects = courtApplicationSummaries.map(({ subject }) => subject);

    const partyName = !(subjects[0]?.firstName && subjects[0]?.lastName)
      ? subjects[0]?.organisationName
      : `${subjects[0]?.firstName} ${subjects[0]?.lastName}`;

    if (subjects.length > 1) {
      return `${partyName} and ${subjects.length - 1} other${subjects.length > 2 ? 's' : ''}`;
    }

    return partyName;
  }

  getCaseDefendantsLabel(prosecutionCaseSummaries: ProsecutionCaseSummary[]) {
    const defendantsMap: Record<string, DefendantName> = prosecutionCaseSummaries
      .reduce((flattened, caseDetails) => [...flattened, ...caseDetails.defendants], [])
      .sort((a, b) => {
        return new Date(a.courtProceedingsInitiated).getTime() >
          new Date(b.courtProceedingsInitiated).getTime()
          ? -1
          : 1;
      })
      .reduce((map, defendant) => {
        return map[defendant.masterDefendantId]
          ? map
          : { ...map, [defendant.masterDefendantId]: defendant };
      }, {});

    const defendants = Object.values(defendantsMap);
    const defendantName = !(defendants[0].firstName && defendants[0].lastName)
      ? defendants[0].organisationName
      : `${defendants[0].firstName} ${defendants[0].lastName}`;

    if (defendants.length > 1) {
      return `${defendantName} and ${defendants.length - 1} other${
        defendants.length > 2 ? 's' : ''
      }`;
    }

    return defendantName;
  }
}
