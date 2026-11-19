import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CppHttp } from '@cpp/core';
import { SessionTimesCourt } from '../../model';
import { catchError } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

@Injectable()
export class SessionTimesService {
  constructor(private readonly api: CppHttp) {}

  recordSessionTimes(session: SessionTimesCourt): Observable<unknown> {
    return this.api.command({
      url: '/hearing-command-api/command/api/rest/hearing/record-session-time',
      requestType: 'application/vnd.hearing.record-session-time+json',
      body: session
    });
  }

  getSessionTimes(
    courtHouseId: string,
    courtRoomId: string,
    courtSessionDate: string
  ): Observable<SessionTimesCourt> {
    const httpParams = new HttpParams().set('courtSessionDate', courtSessionDate);
    return this.api
      .query<SessionTimesCourt>({
        url: `/hearing-query-api/query/api/rest/hearing/session-time/${courtHouseId}/${courtRoomId}`,
        requestType: 'application/vnd.hearing.query.session-time+json',
        params: httpParams
      })
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of(null);
          }
          throw error;
        })
      );
  }

  getAllocatedJudiciaries(
    courtHouseId: string,
    courtRoomId: string,
    courtSessionDate: string
  ): Observable<SessionTimesCourt> {
    const httpParams = new HttpParams()
      .set('courtCentreId', courtHouseId)
      .set('courtRoomId', courtRoomId)
      .set('searchDate', courtSessionDate);
    return this.api
      .query<SessionTimesCourt>({
        url: '/listing-query-api/query/api/rest/listing/judiciary',
        requestType: 'application/vnd.listing.search.judiciary+json',
        params: httpParams
      })
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of(null);
          }
          throw error;
        })
      );
  }
}
