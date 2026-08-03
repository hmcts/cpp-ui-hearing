import { Pipe, PipeTransform } from '@angular/core';
import { ProsecutionCaseIdentifier } from '../../core';

@Pipe({ name: 'caseReference' })
export class CaseReferencePipe implements PipeTransform {
  transform(prosecutionCase: { prosecutionCaseIdentifier: ProsecutionCaseIdentifier }): string {
    return (
      prosecutionCase.prosecutionCaseIdentifier.prosecutionAuthorityReference ||
      prosecutionCase.prosecutionCaseIdentifier.caseURN
    );
  }
}
