import { CourtApplicationParty } from '../../core';
import { PartyNamePipe } from './party-name.pipe';

describe('PartyNamePipe', () => {
  const pipe = new PartyNamePipe();

  it('should return applicant label', () => {
    const applicationParty = {
      personDetails: {
        firstName: 'FirstName',
        lastName: 'LastName'
      }
    } as CourtApplicationParty;

    expect(pipe.transform(applicationParty)).toBe('FirstName LASTNAME');
  });

  it('should return defendant name', () => {
    const applicationParty = {
      masterDefendant: {
        personDefendant: {
          personDetails: {
            title: 'MR',
            firstName: 'Harry',
            lastName: 'Kane Junior'
          }
        }
      }
    } as CourtApplicationParty;

    expect(pipe.transform(applicationParty)).toBe('Harry KANE JUNIOR');
  });

  it('should return prosecution authority name', () => {
    const applicationParty = {
      prosecutingAuthority: {
        prosecutionAuthorityId: 'test-prosecution-authority-id',
        prosecutionAuthorityCode: 'TFL'
      }
    } as CourtApplicationParty;

    expect(pipe.transform(applicationParty)).toBe('TFL');
  });
});
