import { AppState } from '../reducers/index';
import { createSelector } from '@ngrx/store';
import { getCurrentHearing, getGuiltyPleasValues } from './hearing';
import { ActiveCourtOrderByDefendantId, CourtOrdersQueryParams } from '../model/court-orders';
import { getSelectedHearingDate, getCurrentHearingDays } from './hearing';
import { getCPPDate } from '../utils/cpp-date';
import { Defendant, Offence } from '../model';

export const getActiveOrdersExcludeForCurrentHearing = createSelector(
  getCurrentHearing,
  (state: AppState) => state.activeCourtOrder.activeCourtOrder,
  (currentHearing, activeCourtOrders) => {
    return activeCourtOrders
      ? Object.keys(activeCourtOrders).reduce((activeOrdersByDefendantId, defendantId) => {
          return {
            ...activeOrdersByDefendantId,
            [defendantId]: activeCourtOrders[defendantId].filter(
              activeOrder => currentHearing.id !== activeOrder.orderingHearingId
            )
          };
        }, <ActiveCourtOrderByDefendantId>{})
      : {};
  }
);

export const getCourtOrdersQueryParams = createSelector(
  getCurrentHearing,
  getGuiltyPleasValues,
  getSelectedHearingDate,
  getCurrentHearingDays,
  (
    hearing,
    guiltyPleasValues: string[],
    selectedHearingDate: string,
    hearingDays
  ): CourtOrdersQueryParams => {
    if (!hearing) {
      return {
        hearingDate: undefined,
        defendantIds: [],
        offenceDates: []
      } as CourtOrdersQueryParams;
    }

    const cppDateUtil = getCPPDate();
    const hearingDate =
      hearingDays && hearingDays.length === 1
        ? cppDateUtil.format(hearingDays[0].sittingDay, 'YYYY-MM-DD')
        : selectedHearingDate;

    const defendants: Defendant[] = (hearing.prosecutionCases || []).reduce(
      (acc: Defendant[], pc) => acc.concat(pc.defendants || []),
      []
    );

    const defendantOffenceDateMap = getDistinctDefendantsWithGuiltyOffence(
      defendants,
      guiltyPleasValues
    );

    const defendantIds = Object.keys(defendantOffenceDateMap);
    const offenceDates = defendantIds.map(id => defendantOffenceDateMap[id]);

    return {
      hearingDate,
      defendantIds,
      offenceDates
    } as CourtOrdersQueryParams;
  }
);

export const getDistinctDefendantsWithGuiltyOffence = (
  defendants: Defendant[],
  guiltyPleas: string[]
): Record<string, string> =>
  defendants.reduce<Record<string, string>>((acc, def) => {
    const guiltyOffences = (def.offences || []).filter(
      (off: Offence) =>
        (!!off.plea && guiltyPleas.includes(off.plea.pleaValue) && !!off.startDate) ||
        guiltyPleas.some(guiltyPlea => guiltyPlea === off.indicatedPlea?.indicatedPleaValue)
    );

    if (guiltyOffences.length) {
      const oldest = guiltyOffences
        .map(off => off.startDate)
        .reduce((min, curr) => (Date.parse(curr) < Date.parse(min) ? curr : min));

      const currentOffenceDate = acc[def.masterDefendantId];
      if (!currentOffenceDate || Date.parse(oldest) < Date.parse(currentOffenceDate)) {
        acc[def.masterDefendantId] = oldest;
      }
    }
    return acc;
  }, {});
