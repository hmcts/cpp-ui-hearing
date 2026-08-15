import { Routes } from '@angular/router';
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { DefendantNamesPipe } from '../shared/pipes/defendant-names.pipe';
import { HearingEventsLogService } from '../hearing-events-log/core/services/hearing-events-log.service';
import { ReferenceDataService as CoreReferenceDataService } from '../core/services';
import { ProvisionalBookingService } from '../results/hearing-details/allocation/services/provisionalBooking.service';
import {
  LoadDefendantsTrackingStatusGuard,
  HearingNotLockedByOtherUserGuard,
  LoadFutureHearingsGuard
} from '../core/guards';
import { CheckFeaturesGuard } from '../core/guards/check-features';
import { EnterPleasGuard } from '../core/guards/enter-pleas';
import { LoadSelectedHearingGuard } from '../core/guards/load-selected-hearing';
import { LoadCourtOrdersGuard } from '../core/guards/load-court-orders';
import { HearingGuard } from '../core/guards/hearing-guard';
import {
  ApplicationTypesGuard,
  HearingTypesGuard,
  PleaTypesGuard,
  TrialTypesGuard
} from '@cpp/reference-data';
import { UserDetailsGuard } from '@cpp/users-groups';
import { resultsReducer } from '../results/core/store';
import { DraftResultEffects } from '../results/core/store/draft-result.effects';
import { ShareResultsEffects } from '../results/core/store/share-results.effects';
import { HearingDayEffects } from '../results/core/patch/hearing-day.effects';

export const routes: Routes = [
  {
    path: ':hearingId',
    loadComponent: () => import('./manage.container').then(m => m.ManageContainer),
    providers: [
      provideState('results', resultsReducer),
      provideEffects([DraftResultEffects, ShareResultsEffects, HearingDayEffects]),
      DefendantNamesPipe,
      HearingEventsLogService,
      CoreReferenceDataService,
      ProvisionalBookingService
    ],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    canActivate: [
      LoadSelectedHearingGuard,
      CheckFeaturesGuard,
      HearingTypesGuard,
      PleaTypesGuard,
      UserDetailsGuard,
      ApplicationTypesGuard,
      TrialTypesGuard
    ],
    canActivateChild: [LoadCourtOrdersGuard],
    data: {
      allowedFeatures: ['hearing-viewListAndManageHearings'],
      title: 'Manage hearing | Common Platform | GOV.UK'
    },
    children: [
      {
        path: '',
        canActivate: [HearingGuard, LoadFutureHearingsGuard],
        data: {
          hearingGuardRouteId: 'manage-hearing'
        },
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../manage-hearing/manage-hearing.routes').then(m => m.routes)
          },
          {
            path: 'enter-pleas',
            loadChildren: () => import('../enter-pleas/enter-pleas.routes').then(m => m.routes),
            canActivate: [HearingNotLockedByOtherUserGuard, EnterPleasGuard],
            data: {
              title: 'Enter pleas | Common Platform | GOV.UK'
            }
          },
          {
            path: 'enter-verdicts',
            loadChildren: () =>
              import('../enter-verdicts/enter-verdicts.routes').then(m => m.routes),
            canActivate: [HearingNotLockedByOtherUserGuard],
            data: {
              title: 'Enter verdicts | Common Platform | GOV.UK'
            }
          },
          {
            path: 'tier-and-list-type',
            loadChildren: () =>
              import('../tier-and-list-type/tier-and-list-type.routes').then(m => m.routes),
            data: {
              title: 'Tier and list type | Common Platform | GOV.UK'
            }
          },
          {
            path: 'enter-results',
            canActivate: [LoadDefendantsTrackingStatusGuard],
            loadChildren: () => import('../results/results.routes').then(m => m.routes),
            data: {
              title: 'Enter results | Common Platform | GOV.UK'
            }
          },
          {
            path: 'manage-hearing-error',
            loadChildren: () =>
              import('../manage-hearing-error-page/manage-hearing-error-page.routes').then(
                m => m.routes
              ),
            data: {
              title: 'Manage hearing error | Common Platform | GOV.UK'
            }
          }
        ]
      }
    ]
  }
];
