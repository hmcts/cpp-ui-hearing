import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { OutstandingFinesService, CaseType } from '../outstanding-fines-shared/services';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
@Injectable()
export class OutstandingFinesDefendantResolver implements Resolve<any> {
  constructor(private outstandingFinesService: OutstandingFinesService, private router: Router) {}
  resolve(route: ActivatedRouteSnapshot) {
    const caseType = route.queryParams.isSJPCase === 'true' ? CaseType.SJP : CaseType.CC;

    return this.outstandingFinesService
      .getDefendantOutstandingFines(route.params.defendantId, caseType)
      .pipe(
        map(data => data.outstandingFines),
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
