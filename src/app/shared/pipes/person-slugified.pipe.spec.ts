import { PersonSlugifiedPipe } from './person-slugified.pipe';

describe('Pipe: PersonSlugifiedPipe', () => {
  it('Should return the expected string with the names', () => {
    const pipe = new PersonSlugifiedPipe();

    expect(pipe.transform({ firstName: 'Patrick', lastName: 'Gallagher' })).toEqual(
      'patrickgallagher'
    );
    expect(pipe.transform({ firstName: 'España', lastName: 'Maé' })).toEqual('espanamae');
  });
});
