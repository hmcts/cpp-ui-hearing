import { HearingSummary, Offence } from '../../../core/model';
import { mockSummary, prosecutionCaseSummaryMock } from '../../../mock-data/test-mock-data';

export const mockHearingSummary: HearingSummary = {
  ...mockSummary,
  prosecutionCaseSummaries: [
    {
      ...prosecutionCaseSummaryMock,
      defendants: [
        {
          id: 'defendant-1',
          firstName: 'single',
          lastName: 'def',
          offences: [
            {
              id: 'offence-1',
              offenceTitle: 'Offence title'
            } as Offence
          ]
        }
      ]
    }
  ]
};
