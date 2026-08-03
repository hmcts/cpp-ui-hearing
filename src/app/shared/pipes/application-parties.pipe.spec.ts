import { CourtApplicationParty } from '../../core/model';
import { ApplicationPartiesPipe } from './application-parties.pipe';

describe('ApplicationPartiesPipe', () => {
  const pipe = new ApplicationPartiesPipe();

  it('should return application parties separated by comma', () => {
    const applicationParty = {
      personDetails: {
        firstName: 'John',
        lastName: 'Honayi'
      }
    } as CourtApplicationParty;

    const defendant = {
      masterDefendant: {
        personDefendant: {
          personDetails: {
            firstName: 'Andrews',
            lastName: 'James'
          }
        }
      }
    } as CourtApplicationParty;

    const prosecution = {
      prosecutingAuthority: {
        prosecutionAuthorityCode: 'CPS'
      }
    } as CourtApplicationParty;

    expect(pipe.transform([applicationParty, defendant, prosecution])).toBe(
      'John Honayi, Andrews James, CPS'
    );
  });
});
