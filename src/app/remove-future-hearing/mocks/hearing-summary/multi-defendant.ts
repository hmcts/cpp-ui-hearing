import { HearingSummary, Offence } from '../../../core/model';
import { mockSummary, prosecutionCaseSummaryMock } from '../../../mock-data/test-mock-data';

export const mockHearingSummaryMultiDefendant: HearingSummary = {
  ...mockSummary,
  prosecutionCaseSummaries: [
    {
      ...prosecutionCaseSummaryMock,
      defendants: [
        {
          id: 'defendant-1',
          firstName: 'def',
          lastName: 'one',
          offences: [
            {
              id: 'offence-1',
              offenceTitle: 'Offence title'
            } as Offence
          ]
        },
        {
          id: 'defendant-2',
          firstName: 'def',
          lastName: 'two',
          offences: [
            {
              id: 'offence-1',
              offenceTitle: 'Offence title'
            } as Offence
          ]
        },
        {
          id: 'defendant-3',
          firstName: 'def',
          lastName: 'three',
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
