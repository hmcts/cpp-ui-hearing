import { HearingSummary } from '../../../core/model';
import { HearingPartyLabelPipe } from '../hearing-party-label.pipe';

describe('HearingPartyLabelPipe', () => {
  const pipe = new HearingPartyLabelPipe();

  it('should return single defendant name', () => {
    const hearing = {
      prosecutionCaseSummaries: [
        {
          defendants: [
            {
              masterDefendantId: 'm1',
              firstName: 'Issac',
              lastName: 'Newton'
            }
          ]
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('Issac Newton');
  });

  it('should return multiple defendants label', () => {
    const hearing = {
      prosecutionCaseSummaries: [
        {
          defendants: [
            {
              masterDefendantId: 'm1',
              courtProceedingsInitiated: '2020-11-11',
              firstName: 'Issac',
              lastName: 'Newton'
            },
            {
              masterDefendantId: 'm2',
              courtProceedingsInitiated: '2020-11-12',
              firstName: 'Abraham',
              lastName: 'Thomas'
            }
          ]
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('Abraham Thomas and 1 other');
  });

  it('should return application subject', () => {
    const hearing = {
      courtApplicationSummaries: [
        {
          subject: {
            firstName: 'Issac',
            lastName: 'Newton'
          }
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('Issac Newton');
  });

  it('should return multiple application subject label', () => {
    const hearing = {
      courtApplicationSummaries: [
        {
          subject: {
            organisationName: 'OrgName'
          }
        },
        {
          subject: {
            firstName: 'Issac',
            lastName: 'Newton'
          }
        }
      ]
    } as HearingSummary;

    expect(pipe.transform(hearing)).toBe('OrgName and 1 other');
  });

  it('should return organisation name if no firstName or lastName is present', () => {
    const hearing = {
      courtApplicationSummaries: [
        {
          applicant: { organisationName: 'Tech Corp' },
          subject: { organisationName: 'Tech Corp' },
          parentApplicationId: null
        }
      ]
    } as HearingSummary;

    expect(pipe.getApplicationPartyLabel(hearing.courtApplicationSummaries)).toBe('Tech Corp');
  });

  it('should handle an empty array of court application summaries', () => {
    const hearing = {
      courtApplicationSummaries: []
    } as HearingSummary;
    expect(pipe.getApplicationPartyLabel(hearing.courtApplicationSummaries)).toBeUndefined();
  });

  it('should return correct label when only firstName and lastName are available but no parentApplicationId', () => {
    const hearing = {
      courtApplicationSummaries: [
        {
          applicant: { firstName: 'Isaac', lastName: 'Newton' },
          subject: { firstName: 'Isaac', lastName: 'Newton' },
          parentApplicationId: null
        }
      ]
    } as HearingSummary;

    expect(pipe.getApplicationPartyLabel(hearing.courtApplicationSummaries)).toBe('Isaac Newton');
  });

  it('should return correct label when both firstName and lastName and parentApplicationId are available', () => {
    const hearing = {
      courtApplicationSummaries: [
        {
          applicant: { firstName: 'Isaac', lastName: 'Newton' },
          subject: { firstName: 'Isaac', lastName: 'Newton' },
          parentApplicationId: '5cd0995a-0eeb-4eec-9711-3c79da5a0e64'
        }
      ]
    } as HearingSummary;

    expect(pipe.getApplicationPartyLabel(hearing.courtApplicationSummaries)).toBe('Isaac Newton');
  });
});
