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
          if ((error.statusCode = 404)) {
            return of(null);
          } else {
            throw error;
          }
        })
      );
  }

  // TODO: the backend endpoint is not ready yet. Replace this mock with the real query.
  // The response has the same shape as the saved session times but only carries judiciary ids.
  getAllocatedJudiciaries(
    courtHouseId: string,
    courtRoomId: string,
    courtSessionDate: string
  ): Observable<SessionTimesCourt> {
    return of({
      courtHouseId,
      courtRoomId,
      courtSessionDate,
      amCourtSession: {
        judiciaries: [
          { judiciaryId: '792f8e61-a6c4-3c26-876d-191daf185a31' },
          { judiciaryId: '303d09a4-81bc-3164-b789-fd69627aaf49' },
          { judiciaryId: '310cb5a7-d908-3e1e-a9b9-5472d94575de' }
        ]
      },
      pmCourtSession: {
        judiciaries: [
          { judiciaryId: '77415b52-8fea-3a76-b341-80a6f6412e77' },
          { judiciaryId: '79ee9d25-b9de-38d3-a33b-3cdb9338dc23' }
        ]
      }
    });
  }
}
