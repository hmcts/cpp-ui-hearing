import { Routes } from '@angular/router';
import { OutstandingFinesCourtroomsResolver } from './outstanding-fines-courtrooms/outstanding-fines-courtrooms.resolver';
import { OutstandingFinesDefendantResolver } from './outstanding-fines-defendant/outstanding-fines-defendant.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'defendant',
    pathMatch: 'full'
  },
  {
    path: 'defendant',
    providers: [OutstandingFinesDefendantResolver],
    loadChildren: () =>
      import('./outstanding-fines-defendant/outstanding-fines-defendant.routes').then(
        m => m.routes
      ),
    data: {
      title: 'Outstanding Fines - Defendant'
    }
  },
  {
    path: 'courtroom',
    providers: [OutstandingFinesCourtroomsResolver],
    loadChildren: () =>
      import('./outstanding-fines-courtrooms/outstanding-fines-courtrooms.routes').then(
        m => m.routes
      ),
    data: {
      title: 'Outstanding Fines - Courtrooms'
    }
  },
  {
    path: 'create-report',
    loadChildren: () =>
      import('./outstanding-fines-create-report/outstanding-fines-create-report.routes').then(
        m => m.routes
      ),
    data: {
      title: 'Outstanding Fines - Create Report'
    }
  }
];
