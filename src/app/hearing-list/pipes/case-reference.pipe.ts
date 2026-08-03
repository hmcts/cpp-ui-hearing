import { Pipe, PipeTransform } from '@angular/core';
import { HearingSummary } from '../../core/model';
import { ProsecutionCaseSummary } from '../../core/model/shared/prosecution-case-summary';

@Pipe({ name: 'caseReference' })
export class CaseReferencePipe implements PipeTransform {
  transform(hearing: HearingSummary, label = true, slice = 1): string | string[] {
    const { prosecutionCaseSummaries, courtApplicationSummaries } = hearing;

    if (prosecutionCaseSummaries && prosecutionCaseSummaries.length > 0) {
      const references = prosecutionCaseSummaries.map(this.mapReference);
      if (!label) {
        return references.slice(slice);
      }

      return references.length > 1
        ? `${references[0]} and ${references.length - 1} others`
        : references[0];
    }

    const appReferences = courtApplicationSummaries.reduce((refs, summary) => {
      if (summary.caseSummaries && summary.caseSummaries.length > 0) {
        return [...refs, ...summary.caseSummaries.map(this.mapReference)];
      }
      return [...refs, summary.applicationReference];
    }, []);

    if (!label) {
      return appReferences.slice(slice);
    }

    return appReferences.length > 1
      ? `${appReferences[0]} and ${appReferences.length - 1} others`
      : appReferences[0];
  }

  private mapReference(
    caseSummary: Pick<ProsecutionCaseSummary, 'id' | 'prosecutionCaseIdentifier'>
  ) {
    const { prosecutionCaseIdentifier } = caseSummary;
    return (
      prosecutionCaseIdentifier.caseURN || prosecutionCaseIdentifier.prosecutionAuthorityReference
    );
  }
}
