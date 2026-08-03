import {
  getActiveOrdersExcludeForCurrentHearing,
  getCourtOrdersQueryParams,
  getDistinctDefendantsWithGuiltyOffence
} from './court-order';
import { CourtOrder } from '../model/court-orders';
import { Defendant, HearingDetail } from '../model';
import { mockCourtOrders } from '../../mock-data/test-mock-data';
import { HearingDay } from '../model/shared/hearing-day';
import { Offence } from '../model';

describe('Court order selectors', () => {
  it('should select the active court orders that do not match the current hearing', () => {
    const currentHearing = {
      id: 'hearingId'
    } as HearingDetail;

    const courtOrders: Record<string, CourtOrder[]> = {
      '123': [] as CourtOrder[],
      '321': mockCourtOrders
    };

    expect(
      getActiveOrdersExcludeForCurrentHearing.projector(currentHearing, courtOrders)
    ).toMatchSnapshot();
  });

  it('should return the earliest guilty offence date per master defendant', () => {
    const createOffence = (startDate: string, pleaValue: string): Offence =>
      ({
        startDate,
        plea: { pleaValue }
      } as Partial<Offence> as Offence);

    const defendants: Defendant[] = [
      {
        masterDefendantId: 'masterdefendantId1',
        offences: [createOffence('2020-02-01', 'GUILTY'), createOffence('2020-01-05', 'GUILTY')]
      } as Partial<Defendant> as Defendant,
      {
        masterDefendantId: 'masterdefendantId2',
        offences: [createOffence('2021-03-10', 'GUILTY')]
      } as Partial<Defendant> as Defendant,
      {
        masterDefendantId: 'masterdefendantId3',
        offences: [createOffence('2021-04-01', 'NOT_GUILTY')]
      } as Partial<Defendant> as Defendant
    ];

    const expected = {
      masterdefendantId1: '2020-01-05',
      masterdefendantId2: '2021-03-10'
    };

    expect(getDistinctDefendantsWithGuiltyOffence(defendants, ['GUILTY'])).toEqual(expected);
  });

  it('should evaluate indicated guilty plea', () => {
    const defendants: Defendant[] = [
      {
        masterDefendantId: 'masterdefendantId1',
        offences: [
          {
            startDate: '2021-03-10',
            indicatedPlea: {
              indicatedPleaValue: 'INDICATED_GUILTY'
            }
          }
        ]
      } as Defendant
    ];

    const expected = {
      masterdefendantId1: '2021-03-10'
    };

    expect(getDistinctDefendantsWithGuiltyOffence(defendants, ['INDICATED_GUILTY'])).toEqual(
      expected
    );
  });

  it('should build the court orders queryparams from current hearing data', () => {
    const hearing = {
      id: 'hearingId',
      prosecutionCases: [
        {
          defendants: [
            {
              masterDefendantId: 'masterdefendantId1',
              offences: [
                { startDate: '2020-02-01', plea: { pleaValue: 'GUILTY' } },
                { startDate: '2020-01-05', plea: { pleaValue: 'GUILTY' } }
              ]
            },
            {
              masterDefendantId: 'masterdefendantId2',
              offences: [{ startDate: '2021-03-10', plea: { pleaValue: 'GUILTY' } }]
            }
          ]
        }
      ]
    } as Partial<HearingDetail> as HearingDetail;

    const guiltyPleasValues = ['GUILTY'];
    const selectedHearingDate = '2023-05-01';
    const hearingDays: HearingDay[] = [
      {
        sittingDay: '2024-01-20'
      } as Partial<HearingDay> as HearingDay
    ];

    const expected = {
      hearingDate: '2024-01-20',
      defendantIds: ['masterdefendantId1', 'masterdefendantId2'],
      offenceDates: ['2020-01-05', '2021-03-10']
    };

    expect(
      getCourtOrdersQueryParams.projector(
        hearing,
        guiltyPleasValues,
        selectedHearingDate,
        hearingDays
      )
    ).toEqual(expected);
  });
});
