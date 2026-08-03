import { DefendantNamesPipe } from './defendant-names.pipe';
import { HearingPersonDetails, Person } from '../../core';

describe('Pipe: DefendantNamesPipe', () => {
  let pipe: DefendantNamesPipe;

  beforeEach(() => {
    pipe = new DefendantNamesPipe();
  });

  describe('transform (simple array with firstName, lastName)', () => {
    it('should format names correctly with commas and "and"', () => {
      expect(
        pipe.transform([
          { firstName: 'Fabio', lastName: 'Tisci' },
          { firstName: 'Patrick', lastName: 'Gallagher' }
        ])
      ).toEqual('Fabio TISCI and Patrick GALLAGHER');

      expect(
        pipe.transform([
          { firstName: 'Fabio', lastName: 'Tisci' },
          { firstName: 'Patrick', lastName: 'Gallagher' },
          { firstName: 'LLoyd', lastName: 'Lane' }
        ])
      ).toEqual('Fabio TISCI, Patrick GALLAGHER and Lloyd LANE');

      expect(pipe.transform([{ lastName: 'gallagher' }])).toEqual('GALLAGHER');
    });
  });

  describe('transformDefendants (array of HearingPersonDetails or objects with personDefendant)', () => {
    it('should format HearingPersonDetails correctly', () => {
      const defendants: HearingPersonDetails[] = [
        { firstName: 'Alice', lastName: 'Smith', masterDefendantId: '1' },
        { firstName: 'Bob', lastName: 'Jones', masterDefendantId: '2' }
      ];
      expect(pipe.transformDefendants(defendants)).toEqual('Alice SMITH and Bob JONES');
    });

    it('should format defendants with personDefendant correctly', () => {
      const defendants = [
        {
          personDefendant: { firstName: 'Charlie', lastName: 'Brown' } as Person
        },
        {
          personDefendant: { firstName: 'Diana', lastName: 'Prince' } as Person
        }
      ];
      expect(pipe.transformDefendants(defendants)).toEqual('Charlie BROWN and Diana PRINCE');
    });

    it('should handle mixed defendants array', () => {
      const defendants = [
        { firstName: 'Emily', lastName: 'Clark' } as HearingPersonDetails,
        {
          personDefendant: { firstName: 'Frank', lastName: 'Miller' } as Person
        }
      ];
      expect(pipe.transformDefendants(defendants)).toEqual('Emily CLARK and Frank MILLER');
    });

    it('should handle missing firstName by using lastName uppercase', () => {
      const defendants = [
        { lastName: 'Anderson' } as HearingPersonDetails,
        {
          personDefendant: { lastName: 'Baker', firstName: '' } as Person
        }
      ];
      expect(pipe.transformDefendants(defendants)).toEqual('BAKER');
    });

    it('should return empty string if input is not an array', () => {
      expect(pipe.transformDefendants(null as any)).toEqual('');
      expect(pipe.transformDefendants(undefined as any)).toEqual('');
    });
  });
});
