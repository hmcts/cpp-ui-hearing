import { Routes } from '@angular/router';
import { CheckFutureHearingsGuard } from './guards/check-future-hearings';
import { TrialTypesGuard } from '@cpp/reference-data';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./remove-future-hearing.container').then(m => m.RemoveFutureHearingContainer),
    canActivate: [TrialTypesGuard, CheckFutureHearingsGuard],
    data: {
      title: 'Remove future hearing | Common Platform | GOV.UK'
    }
  }
];
