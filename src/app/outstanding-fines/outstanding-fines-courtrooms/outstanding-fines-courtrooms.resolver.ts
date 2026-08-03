import { Injectable } from '@angular/core';
import { Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { OutstandingFinesService } from '../outstanding-fines-shared/services';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class OutstandingFinesCourtroomsResolver implements Resolve<any> {
  constructor(private outstandingFinesService: OutstandingFinesService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot) {
    const courtCentreId = route.queryParams.courtCentreId;
    const courtRoomIds = route.queryParams.courtRoomsIds.split(',');
    const hearingDate = route.queryParams.hearingDate;

    return this.outstandingFinesService
      .getCourtroomOutstandingFines(courtCentreId, courtRoomIds, hearingDate)
      .pipe(
        catchError(error => {
          switch (error.status) {
            case 403:
              this.router.navigate(['/unauthorised-access']);
              break;
            case 404:
              this.router.navigate(['/page-not-found']);
              break;
            default:
              this.router.navigate(['/technical-error']);
              break;
          }
          return of(false);
        })
      );
  }
}
