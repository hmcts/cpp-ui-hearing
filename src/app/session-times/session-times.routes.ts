import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./session-times.container').then(m => m.SessionTimesContainer),
    data: {
      title: 'Session times | Common Platform | GOV.UK'
    }
  }
];
