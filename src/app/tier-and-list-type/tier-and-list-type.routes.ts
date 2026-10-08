import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/tier-and-list-type.container').then(m => m.TierAndListTypeContainer),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./containers/tier-and-list-type-review.container').then(
            m => m.TierAndListTypeReviewContainer
          )
      },
      {
        path: 'edit',
        loadComponent: () =>
          import('./containers/tier-and-list-type-form.container').then(
            m => m.TierAndListTypeFormContainer
          )
      }
    ]
  }
];
