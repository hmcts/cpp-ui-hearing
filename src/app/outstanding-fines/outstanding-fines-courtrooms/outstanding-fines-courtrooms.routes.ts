import { Routes } from '@angular/router';
import { OutstandingFinesCourtroomsResolver } from './outstanding-fines-courtrooms.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./outstanding-fines-courtrooms.container').then(
        m => m.OutstandingFinesCourtroomsContainer
      ),
    resolve: { outstandingFinesDetails: OutstandingFinesCourtroomsResolver }
  }
];
