import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OutstandingFine } from '../outstanding-fines.interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { OutstandingFinesTableComponent } from '../outstanding-fines-shared/components/outstanding-fines-table/outstanding-fines-table.component';
@Component({
  selector: 'outstanding-fines-defendant',
  templateUrl: './outstanding-fines-defendant.container.html',
  imports: [AsyncPipe, TranslatePipe, OutstandingFinesTableComponent]
})
export class OutstandingFinesDefendantContainer implements OnInit {
  outstandingFinesDefendant$: Observable<OutstandingFine[]>;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.outstandingFinesDefendant$ = this.route.data.pipe(map(data => data.outstandingFines));
  }

  get defendantNames() {
    const { defendantFirstName, defendantLastName } = this.route.snapshot.queryParams;
    if (defendantFirstName && !!defendantLastName) {
      return {
        defendantFirstName,
        defendantLastName
      };
    } else {
      return {
        defendantFirstName
      };
    }
  }
}
