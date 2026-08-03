import { Routes } from '@angular/router';
import {
  ClustersGuard,
  SpecialRequirementsGuard,
  LocalJusticeAreasGuard,
  HearingTypesGuard,
  RotaBusinessTypesGuard
} from '@cpp/reference-data';
import { ExtendedDraftResultGuard } from './core';
import { ReusableInfoGuard } from './core/guards/reusable-info.guard';
import { AllocationGuard } from './hearing-details/allocation/guards/allocation.guard';
import { ProvisionalBookingService } from './hearing-details/allocation/services/provisionalBooking.service';
import { hmctsOrganisationResolver } from '../core/resolvers/hmctsOrganisation.resolver';

export const routes: Routes = [
  {
    path: '',
    canActivate: [ExtendedDraftResultGuard, ReusableInfoGuard],
    children: [
      {
        path: '',
        resolve: {
          isHmctsOrganisation: hmctsOrganisationResolver
        },
        loadComponent: () =>
          import('./enter-results/enter-results.container').then(
            m => m.EnterResultsContainerComponent
          )
      },
      {
        path: 'copy-results/:targetId',
        loadComponent: () =>
          import('./copy-results/copy-results.container').then(m => m.CopyResultsContainerComponent)
      },
      {
        path: 'result-lines/:resultLineId/magistrates',
        loadComponent: () =>
          import('./hearing-details/hearing-details.container').then(
            m => m.HearingDetailsContainer
          ),
        runGuardsAndResolvers: 'always',
        data: { jurisdictionType: 'MAGISTRATES' },
        canActivate: [
          ClustersGuard,
          HearingTypesGuard,
          LocalJusticeAreasGuard,
          SpecialRequirementsGuard
        ],
        children: [
          {
            path: 'related-hearings',
            loadComponent: () =>
              import('./hearing-details/related-hearings/related-hearings.container').then(
                m => m.RelatedHearingsContainer
              )
          },
          {
            path: 'hearing-details',
            loadComponent: () =>
              import('./hearing-details/allocation/containers/magistrates.container').then(
                m => m.MagistratesSchedulingContainer
              ),
            providers: [AllocationGuard, ProvisionalBookingService],
            canActivate: [AllocationGuard, RotaBusinessTypesGuard, HearingTypesGuard],
            runGuardsAndResolvers: 'always'
          },
          {
            path: '**',
            redirectTo: 'hearing-details'
          }
        ]
      },
      {
        path: 'result-lines/:resultLineId/crown',
        loadComponent: () =>
          import('./hearing-details/hearing-details.container').then(
            m => m.HearingDetailsContainer
          ),
        data: { jurisdictionType: 'CROWN' },
        canActivate: [
          ClustersGuard,
          HearingTypesGuard,
          LocalJusticeAreasGuard,
          SpecialRequirementsGuard
        ],
        children: [
          {
            path: 'related-hearings',
            loadComponent: () =>
              import('./hearing-details/related-hearings/related-hearings.container').then(
                m => m.RelatedHearingsContainer
              )
          },
          {
            path: 'court-details',
            loadComponent: () =>
              import('./hearing-details/court-details/court-details.container').then(
                m => m.CourtDetailsContainer
              ),
            canActivate: [RotaBusinessTypesGuard]
          }
        ]
      }
    ]
  }
];
