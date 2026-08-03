import { UntypedFormGroup, UntypedFormControl, UntypedFormArray } from '@angular/forms';
import { requireAtLeastOneSpecificCaseReference } from './require-at-least-one-case-reference.validator';
describe('requireAtLeastOneCaseReference', () => {
  const validator = requireAtLeastOneSpecificCaseReference();
  const mockFormGroup = new UntypedFormGroup({
    caseTypes: new UntypedFormControl(['SPECIFIC_CASE']),
    specificCaseUrns: new UntypedFormArray([new UntypedFormControl(null)])
  });
  it('should return an error as the specific case input is not completed', () => {
    expect(validator(mockFormGroup)).toStrictEqual({
      requireAtLeastOneCaseReference: true
    });
  });
  it('should return an error as the specific case input contains only white spaces', () => {
    mockFormGroup.get('specificCaseUrns').get([0]).setValue('   ');
    expect(validator(mockFormGroup)).toStrictEqual({
      requireAtLeastOneCaseReference: true
    });
  });
  it('should not return an error as the specific case input is valid', () => {
    mockFormGroup.get('specificCaseUrns').get([0]).setValue('test-case-urn');
    expect(validator(mockFormGroup)).toBeNull();
  });
});
