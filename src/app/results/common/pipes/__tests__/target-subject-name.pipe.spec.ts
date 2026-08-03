import { CourtApplicationParty, Defendant } from '../../../../core';
import { TargetSubjectNamePipe } from '../target-subject-name.pipe';

describe('TargetSubjectNamePipe', () => {
  const pipe = new TargetSubjectNamePipe();

  it('should format a person defendant', () => {
    const defendant = {
      masterDefendantId: '*',
      personDefendant: {
        personDetails: {
          firstName: 'James',
          lastName: 'Gray'
        }
      }
    } as Defendant;

    expect(pipe.transform(defendant)).toMatchInlineSnapshot(`"James GRAY"`);
    expect(pipe.transform(defendant, { capitalized: false })).toMatchInlineSnapshot(`"James Gray"`);
  });

  it('should format a legal entity defendant', () => {
    const defendant = {
      masterDefendantId: '*',
      legalEntityDefendant: {
        organisation: {
          name: 'HMCTS'
        }
      }
    } as Defendant;

    expect(pipe.transform(defendant)).toMatchInlineSnapshot(`"HMCTS"`);
  });

  it('should format a master defendant (person)', () => {
    const party = {
      masterDefendant: {
        personDefendant: {
          personDetails: {
            firstName: 'James',
            lastName: 'Gray'
          }
        }
      }
    } as CourtApplicationParty;

    expect(pipe.transform(party)).toMatchInlineSnapshot(`"James GRAY"`);
    expect(pipe.transform(party, { capitalized: false })).toMatchInlineSnapshot(`"James Gray"`);
  });

  it('should format a master defendant (organisation)', () => {
    const party = {
      masterDefendant: {
        legalEntityDefendant: {
          organisation: {
            name: 'HMCTS'
          }
        }
      }
    } as CourtApplicationParty;

    expect(pipe.transform(party)).toMatchInlineSnapshot(`"HMCTS"`);
  });

  it('should format a prosecuting authority', () => {
    const party = {
      prosecutingAuthority: {
        name: 'TFL'
      }
    } as CourtApplicationParty;

    expect(pipe.transform(party)).toMatchInlineSnapshot(`"TFL"`);
  });

  it('should format person details', () => {
    const party = {
      personDetails: {
        firstName: 'James',
        lastName: 'Gray'
      }
    } as CourtApplicationParty;

    expect(pipe.transform(party)).toMatchInlineSnapshot(`"James GRAY"`);
  });

  it('should format a organisation', () => {
    const party = {
      organisation: {
        name: 'Barclays'
      }
    } as CourtApplicationParty;

    expect(pipe.transform(party)).toMatchInlineSnapshot(`"Barclays"`);
  });
});
