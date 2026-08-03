import { Routes } from '@angular/router';
import { LoadMagistratesHearingGuard } from './store/load-magistrates-hearings.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./magistrates-hearing-list.container').then(m => m.MagistratesHearingListContainer),
    canActivate: [LoadMagistratesHearingGuard],
    data: {
      title: 'Magistrates list | Common Platform | GOV.UK'
    }
  }
];
