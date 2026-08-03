import {
  ApplicationConfig,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  InjectionToken
} from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideCppCoreHttpServices, withCppHttpOverrides, GENERATE_UNIQUE_KEY } from '@cpp/core';
import { provideStore } from '@ngrx/store';
import { provideRouterStore, RouterState } from '@ngrx/router-store';
import { provideEffects } from '@ngrx/effects';
import { provideCPPApplicationEnvironment } from '@cpp/application';
import { provideUserGroupsEnvironmentContext } from '@cpp/users-groups';
import { provideReferenceDataEnvironmentContext } from '@cpp/reference-data';
import { ListingNotesService, provideSchedulingEnvironmentContext } from '@cpp/scheduling';
import { provideProtractorTestingSupport, Title } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideModalServices } from '@cpp/pdk';
import { NgxPageScrollCoreModule } from 'ngx-page-scroll-core';
import { ModalModule } from 'ngx-bootstrap/modal';
import { v4 as uuid } from 'uuid';

import { AppConfigService } from './app/config';
import { environment } from './environments/environment';
import { appRoutes } from './app/app-routes';
import {
  BootstrapService,
  ConnectionService,
  reducers,
  ListingService,
  ReferenceDataService as HearingReferenceDataService,
  SessionTimesService,
  UserGroupsService as HearingUserGroupsService,
  FutureHearingsService,
  HearingGuard,
  LoadSelectedHearingGuard,
  CheckFeaturesGuard,
  EnterPleasGuard,
  HearingNotLockedByOtherUserGuard,
  LoadCourtOrdersGuard,
  LoadDefendantsTrackingStatusGuard,
  LoadAmendmentReasonsGuard,
  LoadVerdictTypesGuard,
  LoadFutureHearingsGuard,
  CustomRouterStateSerializer,
  HearingService,
  CourtOrderService
} from './app/core';
import { UserGroupsGuard } from '@cpp/users-groups';
import { TrialTypesGuard } from '@cpp/reference-data';
import { BailStatusCodeForParsedResultDefinitionInterceptor } from './app/results/core/patch/bail-status-code.interceptor';
import { CheckFutureHearingsGuard } from './app/remove-future-hearing/guards/check-future-hearings';
import { LoadMagistratesHearingGuard } from './app/magistrates/store/load-magistrates-hearings.guard';
import { CPPMonitorHttp } from './app/core/services/http/http-service';
import { PROMPT_HANDLERS } from './app/results/core/services/reusable-info.service';
import { FullNamePipe } from './app/shared/pipes/full-name.pipe';
import { CtlDatePromptHandler } from './app/results/core/services/prompt-handlers/ctldate';
import { ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler } from './app/results/core/services/prompt-handlers/prosecutorsEmailAddressUsedSummonsNotification';
import { OutstandingFinesService } from './app/outstanding-fines/outstanding-fines-shared/services';

export const REDIRECT_TOKEN = new InjectionToken<(url: string) => void>('RedirectFunction');

export function redirect(url: string): void {
  window.location.href = url;
}

export const bootstrapAppConfig: ApplicationConfig = {
  providers: [
    AppConfigService,
    ConnectionService,
    BootstrapService,
    ListingService,
    HearingReferenceDataService,
    SessionTimesService,
    HearingUserGroupsService,
    FutureHearingsService,
    HearingService,
    CourtOrderService,
    ListingNotesService,
    OutstandingFinesService,
    Title,
    UserGroupsGuard,
    TrialTypesGuard,
    HearingGuard,
    LoadSelectedHearingGuard,
    CheckFeaturesGuard,
    EnterPleasGuard,
    HearingNotLockedByOtherUserGuard,
    LoadCourtOrdersGuard,
    LoadDefendantsTrackingStatusGuard,
    LoadAmendmentReasonsGuard,
    LoadVerdictTypesGuard,
    LoadFutureHearingsGuard,
    CheckFutureHearingsGuard,
    LoadMagistratesHearingGuard,
    {
      provide: GENERATE_UNIQUE_KEY,
      useValue: uuid
    },
    {
      provide: 'Window',
      useValue: window
    },
    {
      provide: REDIRECT_TOKEN,
      useValue: redirect
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BailStatusCodeForParsedResultDefinitionInterceptor,
      multi: true
    },
    CtlDatePromptHandler,
    ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler,
    {
      provide: PROMPT_HANDLERS,
      useFactory: (
        ctlHandler: CtlDatePromptHandler,
        emailHandler: ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler
      ) => [ctlHandler, emailHandler],
      deps: [CtlDatePromptHandler, ProsecutorsEmailAddressUsedSummonsNotificationPromptHandler]
    },
    FullNamePipe,
    provideProtractorTestingSupport(),
    provideRouter(
      appRoutes,
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always'
      })
    ),
    provideAppInitializer(async () => await inject(AppConfigService).load()),
    provideStore(reducers, {
      runtimeChecks: {
        strictActionImmutability: true,
        strictStateImmutability: true
      }
    }),
    provideRouterStore({
      routerState: RouterState.Minimal,
      serializer: CustomRouterStateSerializer
    }),
    provideEffects([]),
    provideCppCoreHttpServices(withCppHttpOverrides(AppConfigService, CPPMonitorHttp)),
    provideUserGroupsEnvironmentContext(),
    provideCPPApplicationEnvironment(environment),
    provideSchedulingEnvironmentContext(),
    provideReferenceDataEnvironmentContext(),
    provideModalServices(),
    ...environment.providers,
    provideAnimations(),
    importProvidersFrom(ModalModule.forRoot(), NgxPageScrollCoreModule.forRoot()),
    provideTranslateService({
      lang: 'en',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: 'i18n/',
        suffix: '.json'
      })
    })
  ]
};
