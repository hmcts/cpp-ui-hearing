import { Routes } from '@angular/router';
import { CheckInGuard } from './guards/check-in';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./check-in.container').then(m => m.CheckInContainer)
  },
  {
    path: 'outcome',
    loadComponent: () => import('./components').then(m => m.CheckInOutcomeComponent),
    canActivate: [CheckInGuard]
  }
];
