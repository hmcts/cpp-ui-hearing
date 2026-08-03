import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { OutstandingFinesDetails } from '../outstanding-fines.interfaces';
import { ActivatedRoute } from '@angular/router';
import { AppState, getCourtCentreId } from '../../core';
import { switchMap } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { OutstandingFinesReportDetailsComponent } from '../outstanding-fines-shared/components/outstanding-fines-report-details/outstanding-fines-report-details.component';
import { OutstandingFinesTableComponent } from '../outstanding-fines-shared/components/outstanding-fines-table/outstanding-fines-table.component';

@Component({
  selector: 'outstanding-fines-courtrooms',
  templateUrl: './outstanding-fines-courtrooms.container.html',
  imports: [
    AsyncPipe,
    TranslatePipe,
    OutstandingFinesReportDetailsComponent,
    OutstandingFinesTableComponent
  ]
})
export class OutstandingFinesCourtroomsContainer implements OnInit {
  outstandingFinesDetails$: Observable<OutstandingFinesDetails>;

  constructor(private store: Store<AppState>, private route: ActivatedRoute) {}

  ngOnInit() {
    const courtCentre$ = this.route.queryParams.pipe(
      switchMap(params => this.store.select(getCourtCentreId(params['courtCentreId'])))
    );

    this.outstandingFinesDetails$ = combineLatest(
      this.route.queryParams,
      courtCentre$,
      (params, courtCentre) => {
        if (params && courtCentre) {
          const outstandingFines = this.route.snapshot.data['outstandingFinesDetails'];
          const courtRoomIds = params['courtRoomsIds'].split(',');
          const courtRoomNames = courtCentre.courtrooms
            .filter(f => courtRoomIds.includes(f.id))
            .map(c => c.name);

          const courtRoomNamesFromOutFines: string[] = [];
          outstandingFines.courtRooms.forEach((courtRoom: any) =>
            courtRoomNamesFromOutFines.push(courtRoom.courtRoomName)
          );

          courtRoomNames
            .filter(courtRoomName => !courtRoomNamesFromOutFines.includes(courtRoomName))
            .forEach(cName =>
              outstandingFines.courtRooms.push({
                courtRoomName: cName,
                outstandingFines: []
              })
            );
          return {
            courtHouse: courtCentre.name,
            courtRooms: courtRoomNames.join(', '),
            hearingDate: params['hearingDate'],
            reportCreatedDate: new Date().toISOString(),
            createdBy: outstandingFines.createdBy,
            outstandingFinesByCourtRooms: outstandingFines.courtRooms
          };
        }
        return undefined;
      }
    );
  }
}
