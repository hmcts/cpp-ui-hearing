import { Routes } from '@angular/router';
import { IdpcIngestionComponentStore } from './component-store/idpc-ingestion-store';
import { UserGroupsService } from '../core/services/usergroups/usergroups.service';

export const routes: Routes = [
  {
    path: '',
    providers: [IdpcIngestionComponentStore, UserGroupsService],
    loadComponent: () => import('./hearing-list.container').then(m => m.HearingListContainer),
    data: {
      title: 'My hearing list | Common Platform | GOV.UK'
    }
  }
];
