import {
  ERROR_PAGES_ROUTES,
  ERROR_ROUTE_PATHS,
  SYSTEM_ANNOUNCEMENT_ROUTES
} from '@cpp/application';
import { Routes } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import {
  HearingEffects,
  CourtOrderEffects,
  HearingEventsLogEffects,
  RouterEffects,
  HearingReferenceDataEffects,
  SessionTimesEffects,
  RemoveFutureHearingEffects
} from './core/effects';
import { HearingTypesGuard, OrganisationUnitsGuard, TrialTypesGuard } from '@cpp/reference-data';
import {
  UserDetailsGuard,
  UserGroupsGuard,
  UserServicesGuard,
  UserPermissionsGuard,
  UserRolesGuard,
  UserFeaturesGuard
} from '@cpp/users-groups';
import {
  CheckFeaturesGuard,
  LoadAmendmentReasonsGuard,
  LoadVerdictTypesGuard
} from './core/guards';
import { CheckInGuard } from './check-in/guards/check-in';
// It is important to load the User related guards first as Service availability anchors on these guards.
export const appRoutes: Routes = [
  {
    path: '',
    providers: [
      // Effects
      provideEffects(
        HearingEffects,
        CourtOrderEffects,
        HearingEventsLogEffects,
        RouterEffects,
        HearingReferenceDataEffects,
        SessionTimesEffects,
        RemoveFutureHearingEffects
      )
    ],
    canActivate: [
      UserGroupsGuard,
      UserServicesGuard,
      UserPermissionsGuard,
      UserRolesGuard,
      UserFeaturesGuard
    ],
    data: {
      userPermissionsErrorRedirectTo: `/${ERROR_ROUTE_PATHS.technicalError}`,
      userNoPermissionsRedirectTo: `/${ERROR_ROUTE_PATHS.unauthorised}`,
      userServicesErrorRedirectTo: `/${ERROR_ROUTE_PATHS.unauthorised}`,
      serviceUnavailableRedirectTo: `/${ERROR_ROUTE_PATHS.serviceUnavailable}`
    },
    children: [
      {
        path: '',
        canActivate: [OrganisationUnitsGuard, LoadVerdictTypesGuard, LoadAmendmentReasonsGuard],
        children: [
          {
            path: '',
            redirectTo: 'list',
            pathMatch: 'full'
          },
          {
            path: 'check-and-challenge',
            loadChildren: () =>
              import('./check-and-challenge/check-and-challenge.routes').then(m => m.routes),
            data: {
              title: 'Check and challenge | Common Platform | GOV.UK'
            }
          },
          {
            path: 'list',
            loadChildren: () => import('./hearing-list/hearing-list.routes').then(m => m.routes),
            canActivate: [CheckFeaturesGuard, HearingTypesGuard, UserDetailsGuard, TrialTypesGuard],
            data: {
              allowedFeatures: ['hearing-viewList', 'hearing-viewListAndManageHearings'],
              title: 'My hearing list | Common Platform | GOV.UK'
            }
          },
          {
            path: 'check-in',
            loadChildren: () => import('./check-in/check-in.routes').then(m => m.routes),
            canActivate: [OrganisationUnitsGuard, UserGroupsGuard, UserDetailsGuard, CheckInGuard],
            data: {
              allowedFeatures: ['hearing-viewList', 'hearing-viewListAndManageHearings'],
              title: 'Check in | Common Platform | GOV.UK'
            }
          },
          {
            path: 'magistrates-list',
            loadChildren: () =>
              import('./magistrates/magistrates-hearing-list.routes').then(m => m.routes),
            canActivate: [CheckFeaturesGuard],
            data: {
              allowedFeatures: ['magistrates-list'],
              title: 'Magistrates list | Common Platform | GOV.UK'
            }
          },
          {
            path: 'session-times',
            loadChildren: () => import('./session-times/session-times.routes').then(m => m.routes),
            data: {
              title: 'Session times | Common Platform | GOV.UK'
            }
          },
          {
            path: 'manage',
            loadChildren: () => import('./manage/manage.routes').then(m => m.routes)
          },
          {
            path: 'outstanding-fines',
            loadChildren: () =>
              import('./outstanding-fines/outstanding-fines.routes').then(m => m.routes),
            data: {
              title: 'Outstanding fines | Common Platform | GOV.UK'
            }
          },
          {
            path: 'remove-future-hearing/:hearingId',
            loadChildren: () =>
              import('./remove-future-hearing/remove-future-hearing.routes').then(m => m.routes),
            data: {
              title: 'Remove future hearing | Common platform | GOV.UK'
            }
          }
        ]
      }
    ]
  },
  ...SYSTEM_ANNOUNCEMENT_ROUTES,
  ...ERROR_PAGES_ROUTES
];
