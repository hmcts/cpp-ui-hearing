import { FullNamePipe } from './full-name.pipe';

describe('FullNamePipe', () => {
  const person = {
    firstName: 'jean claude',
    lastName: 'van Damme'
  };

  const personWithFirstNameOnly = {
    firstName: 'FirstNameTest',
    lastName: ''
  };

  const personWithLastNameOnly = {
    firstName: '',
    lastName: 'LastNameTest'
  };

  let pipe: FullNamePipe;

  beforeEach(() => {
    pipe = new FullNamePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns the full name for the person', () => {
    expect(pipe.transform(person)).toBe('Jean claude van Damme');
  });

  it('returns the full name with lastName in uppercase for the person', () => {
    expect(pipe.transform(person, true)).toBe('Jean claude VAN DAMME');
  });

  it('returns only first name for the person', () => {
    expect(pipe.transform(personWithFirstNameOnly)).toBe('FirstNameTest');
  });

  it('returns only last name for the person', () => {
    expect(pipe.transform(personWithLastNameOnly)).toBe(' LastNameTest');
  });

  it('returns only last name in uppercase for the person', () => {
    expect(pipe.transform(personWithLastNameOnly, true)).toBe(' LASTNAMETEST');
  });
});
