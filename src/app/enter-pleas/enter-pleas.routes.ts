import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./enter-pleas.container').then(m => m.EnterPleasContainer),
    data: {
      title: 'Enter pleas | Common Platform | GOV.UK'
    }
  }
];
