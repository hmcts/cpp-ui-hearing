import { HearingSummary, Offence } from '../../../core/model';
import { mockSummary, prosecutionCaseSummaryMock } from '../../../mock-data/test-mock-data';

export const mockHearingSummaryForTrial: HearingSummary = {
  ...mockSummary,
  prosecutionCaseSummaries: [
    {
      ...prosecutionCaseSummaryMock,
      defendants: [
        {
          id: 'defendant-1',
          firstName: 'multi',
          lastName: 'offence',
          offences: [
            {
              id: 'offence-1',
              offenceTitle: 'Offence title'
            } as Offence
          ]
        }
      ]
    }
  ],
  type: {
    ...mockSummary.type,
    description: 'Trial'
  }
};
