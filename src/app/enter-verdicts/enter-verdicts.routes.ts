import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./enter-verdicts.container').then(m => m.EnterVerdictsContainer),
    data: {
      title: 'Enter verdicts | Common Platform | GOV.UK'
    }
  }
];
