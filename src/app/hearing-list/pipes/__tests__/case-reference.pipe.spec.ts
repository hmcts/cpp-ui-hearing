import { CaseReferencePipe } from '../case-reference.pipe';
import { HearingSummary } from '../../../core/model';

describe('CaseReferencePipe', () => {
  const pipe = new CaseReferencePipe();

  it('should return single case reference', () => {
    const hearing = {
      prosecutionCaseSummaries: [
        {
          prosecutionCaseIdentifier: {
            caseURN: 'URN',
            prosecutionAuthorityReference: 'REF12'
          }
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('URN');
    expect(pipe.transform(hearing, false, 0)).toEqual(['URN']);
  });

  it('should return multiple case reference', () => {
    const hearing = {
      prosecutionCaseSummaries: [
        {
          prosecutionCaseIdentifier: {
            caseURN: 'URN',
            prosecutionAuthorityReference: 'REF12'
          }
        },
        {
          prosecutionCaseIdentifier: {
            prosecutionAuthorityReference: 'REF12'
          }
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('URN and 1 others');
    expect(pipe.transform(hearing, false)).toEqual(['REF12']);
  });

  it('should return single application reference', () => {
    const hearing = {
      courtApplicationSummaries: [
        {
          applicationReference: 'APP_REF'
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('APP_REF');
    expect(pipe.transform(hearing, false, 0)).toEqual(['APP_REF']);
  });

  it('should return single application reference', () => {
    const hearing = {
      courtApplicationSummaries: [
        {
          caseSummaries: [
            {
              prosecutionCaseIdentifier: {
                caseURN: 'URN',
                prosecutionAuthorityReference: 'REF12'
              }
            },
            {
              prosecutionCaseIdentifier: {
                prosecutionAuthorityReference: 'REF12'
              }
            }
          ]
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('URN and 1 others');
    expect(pipe.transform(hearing, false)).toEqual(['REF12']);
  });
});
