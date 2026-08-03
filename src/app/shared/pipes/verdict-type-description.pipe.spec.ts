/* tslint:disable:no-unused-variable */

import { VerdictTypeDescriptionPipe } from './verdict-type-description.pipe';
import { VerdictType } from '../../core';

const verdyctType = {
  id: '1111111-111111'
};

const verdyctTypes: VerdictType[] = [
  {
    id: '1111111-111111',
    description: 'Guilty',
    category: '',
    categoryType: '',
    sequence: 0,
    validFrom: '',
    validTo: ''
  },
  {
    id: '2222222-222222',
    description: 'Not Guilty',
    category: '',
    categoryType: '',
    sequence: 0,
    validFrom: '',
    validTo: ''
  }
];

describe('Pipe: VerdictType', () => {
  it('Should return the description string when verdyctType exists', () => {
    const pipe = new VerdictTypeDescriptionPipe();
    expect(pipe.transform(verdyctType, verdyctTypes)).toBe('Guilty');
  });

  it('Should return empty string when verdyctType does not exist', () => {
    const pipe = new VerdictTypeDescriptionPipe();
    verdyctType.id = '3333333-121212121212';
    expect(pipe.transform(verdyctType, verdyctTypes)).toBe('');
  });
});
