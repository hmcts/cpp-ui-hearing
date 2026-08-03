import { provideCppFakeSession } from '@cpp/core';
import { LEGAL_ADVISER_III } from '@cpp/testing/resources';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export const environment = {
  production: false,
  providers: [
    provideCppFakeSession({
      defaultUserId: LEGAL_ADVISER_III.userId,
      queryParamInitializer: true
    }),
    provideStoreDevtools({ connectInZone: true })
  ]
};
