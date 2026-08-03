import { Routes } from '@angular/router';
import { ExtendedDraftResultGuard } from '../results/core';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./manage-hearing.container').then(m => m.ManageHearingContainer),
    canActivate: [ExtendedDraftResultGuard]
  }
];
