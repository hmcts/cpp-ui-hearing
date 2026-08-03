import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from './interfaces';
import { tap } from 'rxjs/operators';
import { CppHttpConfig } from '@cpp/core';
import { Store } from '@ngrx/store';
import { AppState } from '../core/reducers';
import { UsersGroupsActions } from '@cpp/users-groups';

// AppConfigService can be used as the provider for all configuration
// dependencies required by submodules, so long as it implements their
// interfaces

@Injectable()
export class AppConfigService implements CppHttpConfig {
  accountUrl: string;
  appUrl: string;
  baseUrl: string;
  compressionEnabled = false;
  cppHomeUrl?: string;
  logoutUrl: string;
  servicesUrl: string;
  pollingInterval: number;
  guidanceUrl: string;
  feedbackUrl: string;

  private readonly defaultFeedbackUrl = `https://forms.office.com/pages/responsepage.aspx?id=KEeHxuZx_kGp4S6MNndq2CzEj
  _HFSxpKoqBZAvjaEIRUMTRCRFpORVlPUlRHRDhDRTBTMzRWUjlFViQlQCN0PWcu`;
  private readonly defaultGuidanceUrl = `https://justiceuk.sharepoint.com/sites/HMCTSLandDHub/SitePages/Common-Platform.aspx`;

  constructor(private http: HttpClient, private store: Store<AppState>, private ngZone: NgZone) {}

  load() {
    return new Promise((resolve, reject) => {
      this.http
        .get<AppConfig>('./app.override.config.json')
        .pipe(
          tap((config: AppConfig) => {
            this.accountUrl = config.idamProfilePage;
            this.appUrl = config.appUrl;
            this.baseUrl = config.apiRoot;
            this.compressionEnabled = Boolean(config.compressionEnabled);
            this.cppHomeUrl = config.cppHomeUrl;
            this.logoutUrl = config.idamLogoutPage;
            this.servicesUrl = config.idamServicesPage;
            this.pollingInterval = config.pollingInterval;
            this.feedbackUrl = config.feedbackUrl || this.defaultFeedbackUrl;
            this.guidanceUrl = config.guidanceUrl || this.defaultGuidanceUrl;
          }),
          tap(() =>
            this.ngZone.runOutsideAngular(() => {
              this.store.dispatch(
                UsersGroupsActions.setUserFeatures({ pollingInterval: this.pollingInterval })
              );
            })
          )
        )
        .subscribe(resolve, reject);
    });
  }

  getAccountUrl(): string {
    return this.accountUrl;
  }

  getBaseUrl(): string {
    return this.appUrl;
  }

  getLogoutUrl(): string {
    return this.logoutUrl;
  }

  getServicesUrl(): string {
    return this.servicesUrl;
  }

  getFeedbackUrl(): string {
    return this.feedbackUrl;
  }

  getGuidanceUrl(): string {
    return this.guidanceUrl;
  }
}
