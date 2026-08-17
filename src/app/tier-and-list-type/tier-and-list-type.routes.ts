import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./tier-and-list-type.container').then(m => m.TierAndListTypeContainer),
    data: {
      title: 'Tier and list type | Common Platform | GOV.UK'
    }
  }
];
