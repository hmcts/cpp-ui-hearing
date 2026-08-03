import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./outstanding-fines-create-report.container').then(
        m => m.OutstandingFinesCreateReportContainer
      )
  }
];
