import { ApplicationPartyNamePipe } from './application-party-name.pipe';
import { CourtApplicationParty } from '../../core/model';

describe('ApplicationPartyNamePipe', () => {
  const pipe = new ApplicationPartyNamePipe();

  it('should return applicant label', () => {
    const applicationParty = {
      personDetails: {
        firstName: 'FirstName',
        lastName: 'LastName'
      }
    } as CourtApplicationParty;

    expect(pipe.transform(applicationParty)).toBe('FirstName LastName');
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

    expect(pipe.transform(applicationParty)).toBe('Harry Kane Junior');
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
