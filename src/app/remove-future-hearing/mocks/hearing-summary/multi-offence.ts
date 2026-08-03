import { HearingSummary, Offence } from '../../../core/model';
import { mockSummary, prosecutionCaseSummaryMock } from '../../../mock-data/test-mock-data';

export const mockHearingSummaryMultiOffence: HearingSummary = {
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
            } as Offence,
            {
              id: 'offence-2',
              offenceTitle: 'Offence title'
            } as Offence
          ]
        }
      ]
    }
  ]
};
