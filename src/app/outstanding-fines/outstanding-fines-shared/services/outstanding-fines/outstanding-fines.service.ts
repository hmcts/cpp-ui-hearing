import { Injectable } from '@angular/core';
import { OutstandingFine } from '../../../outstanding-fines.interfaces';
import { switchMap, map, catchError } from 'rxjs/operators';
import { CppHttp } from '@cpp/core';
import { UserDetails, UsersGroupsService } from '@cpp/users-groups';
import { of } from 'rxjs';

export enum CaseType {
  SJP = 'SJP',
  CC = 'CC'
}

@Injectable()
export class OutstandingFinesService {
  constructor(private http: CppHttp, private usersGroupsService: UsersGroupsService) {}

  getDefendantOutstandingFines(defendantId: string, caseType: CaseType) {
    const url =
      caseType === CaseType.CC
        ? `/hearing-query-api/query/api/rest/hearing/defendant/${defendantId}/outstanding-fines`
        : `/sjp-query-api/query/api/rest/sjp/defendant/${defendantId}/outstanding-fines`;

    const requestType =
      caseType === CaseType.CC
        ? `application/vnd.hearing.defendant.outstanding-fines+json`
        : `application/vnd.sjp.query.defendant-outstanding-fines+json`;

    return this.http.query<{ outstandingFines: OutstandingFine[] }>({ url, requestType });
  }

  getCourtroomOutstandingFines(courtCentreId: string, courtRoomIds: string[], hearingDate: string) {
    return this.usersGroupsService.fetchLoggedInUserDetails().pipe(
      switchMap((userDetails: UserDetails) => {
        return this.http
          .command({
            url: `/hearing-query-api/query/api/rest/hearing/outstanding-fines`,
            requestType: 'application/vnd.hearing.query.outstanding-fines+json',
            body: {
              courtCentreId,
              courtRoomIds,
              hearingDate
            }
          })
          .pipe(
            map(response => {
              const res = JSON.parse(response.body);
              res['createdBy'] = `${userDetails.firstName} ${userDetails.lastName}`;
              return res;
            }),
            catchError(error => {
              return of({
                courtRooms: [],
                createdBy: `${userDetails.firstName} ${userDetails.lastName}`
              });
            })
          );
      })
    );
  }
}
