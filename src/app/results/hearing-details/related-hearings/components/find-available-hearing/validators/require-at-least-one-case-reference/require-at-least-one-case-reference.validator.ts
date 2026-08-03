import { AbstractControl, ValidatorFn } from '@angular/forms';

export function requireAtLeastOneSpecificCaseReference(): ValidatorFn {
  return function validate(formGroup: AbstractControl) {
    const caseTypes = formGroup.get('caseTypes').value;
    const hasSpecificCaseType = (caseTypes || []).includes('SPECIFIC_CASE');
    if (hasSpecificCaseType) {
      const specificCasesArrayValue: string[] = formGroup.get('specificCaseUrns').value;
      if (
        specificCasesArrayValue.filter(specificCase => !!(specificCase && specificCase.trim()))
          .length === 0
      ) {
        return {
          requireAtLeastOneCaseReference: true
        };
      }
    }

    return null;
  };
}
