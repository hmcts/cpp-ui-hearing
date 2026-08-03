import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CppHttp } from '@cpp/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ActiveCourtOrderByDefendantId,
  CourtOrdersQueryParams,
  CourtOrder
} from '../../model/court-orders';
import { constructApiEndPointUrl } from '../../utils/utils';

@Injectable({ providedIn: 'root' })
export class CourtOrderService {
  constructor(private api: CppHttp) {}

  getCourtOrders(defendantId: string, active = true): Observable<CourtOrder[]> {
    const params = new HttpParams().set('active', String(active));
    return this.api
      .query<{ courtOrders: CourtOrder[] }>({
        url: constructApiEndPointUrl('courtOrderQuery', 'court-order', 'defendant', defendantId),
        requestType: 'application/vnd.courtorders.query.court-order-by-defendant-id+json',
        params
      })
      .pipe(map(res => res.courtOrders));
  }

  getCourtOrdersByDefendantIdAndOffenceDate({
    hearingDate,
    defendantIds,
    offenceDates
  }: CourtOrdersQueryParams): Observable<ActiveCourtOrderByDefendantId> {
    const combinedParams = defendantIds.map((id, idx) => `${id}:${offenceDates[idx]}`).join(',');

    const params = new HttpParams()
      .set('hearingDate', hearingDate)
      .set('filterCriteria', combinedParams);

    return this.api
      .query<{ courtOrders: CourtOrder[] }>({
        url: constructApiEndPointUrl(
          'courtOrderQuery',
          'court-order',
          'defendant-id-and-offence-date'
        ),
        requestType:
          'application/vnd.courtorders.query.court-order-by-defendant-id-and-offence-date+json',
        params
      })
      .pipe(
        map(res =>
          (res.courtOrders || []).reduce<ActiveCourtOrderByDefendantId>((acc, order) => {
            const key = order.masterDefendantId;
            if (!acc[key]) acc[key] = [];
            acc[key].push(order);
            return acc;
          }, {})
        )
      );
  }
}
