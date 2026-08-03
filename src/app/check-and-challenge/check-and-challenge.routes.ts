import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { CheckAndChallengeEffects } from './check-and-challenge.effects';
import { UserGroupsService } from '../core/services/usergroups/usergroups.service';

export const routes: Routes = [
  {
    path: ':hearingId/:type',
    providers: [provideEffects(CheckAndChallengeEffects), UserGroupsService],
    loadComponent: () =>
      import('./check-and-challenge.container').then(m => m.CheckAndChallengeContainer),
    data: {
      title: 'Check and Challenge | Common Platform | GOV.UK'
    }
  }
];
