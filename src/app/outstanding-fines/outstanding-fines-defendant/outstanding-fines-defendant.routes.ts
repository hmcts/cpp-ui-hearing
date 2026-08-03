import { Routes } from '@angular/router';
import { OutstandingFinesDefendantResolver } from './outstanding-fines-defendant.resolver';

export const routes: Routes = [
  {
    path: ':defendantId',
    loadComponent: () =>
      import('./outstanding-fines-defendant.container').then(
        m => m.OutstandingFinesDefendantContainer
      ),
    resolve: { outstandingFines: OutstandingFinesDefendantResolver }
  }
];
