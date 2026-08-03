import { UntypedFormControl } from '@angular/forms';

import { requireCheckboxesToBeCheckedValidator } from './require-checkboxes-to-be-checked.validator';

describe('requireCheckboxesToBeCheckedValidator', () => {
  const validator = requireCheckboxesToBeCheckedValidator();
  const mockFormControl = new UntypedFormControl([]);

  it('should return an error as no checkboxes are checked', () => {
    expect(validator(mockFormControl)).toStrictEqual({
      requireCheckboxesToBeChecked: true
    });
  });

  it('should not return an error as a checkbox is checked', () => {
    mockFormControl.setValue(['SAME_CASE']);
    expect(validator(mockFormControl)).toBeNull();
  });
});
