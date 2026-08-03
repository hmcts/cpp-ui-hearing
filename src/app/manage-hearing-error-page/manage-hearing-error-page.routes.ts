import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./manage-hearing-error-page.container').then(m => m.ManageHearingErrorPageContainer),
    data: {
      title: 'Manage hearing error | Common Platform | GOV.UK'
    }
  }
];
