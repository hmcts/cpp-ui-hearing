import { TestBed } from '@angular/core/testing';

import { AppConfigService } from './config.service';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideStore } from '@ngrx/store';

// tslint:disable:no-big-function
describe('AppConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore({}, { runtimeChecks: {} })
      ],
      teardown: { destroyAfterEach: false }
    });
  });

  describe('load()', () => {
    it('should load correct data from app override config', () => {
      const httpMock = TestBed.inject(HttpTestingController);
      const service = TestBed.inject(AppConfigService);

      const sampleApiConfig = {
        apiRoot: 'apiRootValue',
        idamProfilePage: 'idamProfilePageValue',
        idamLogoutPage: 'idamLogoutPageValue',
        appUrl: 'appUrlValue',
        feedbackUrl: `https://forms.office.com/pages/responsepage.aspx?id=KEeHxuZx_kGp4S6MNndq2CzEj
        _HFSxpKoqBZAvjaEIRUMTRCRFpORVlPUlRHRDhDRTBTMzRWUjlFViQlQCN0PWcu`,
        guidanceUrl: `https://justiceuk.sharepoint.com/sites/HMCTSLandDHub/SitePages/Common-Platform.aspx`
      };

      service.load().then(() => {
        expect(service.baseUrl).toBe(sampleApiConfig.apiRoot);
        expect(service.accountUrl).toBe(sampleApiConfig.idamProfilePage);
        expect(service.logoutUrl).toBe(sampleApiConfig.idamLogoutPage);
        expect(service.appUrl).toBe(sampleApiConfig.appUrl);
        expect(service.getAccountUrl()).toBe(sampleApiConfig.idamProfilePage);
        expect(service.getLogoutUrl()).toBe(sampleApiConfig.idamLogoutPage);

        expect(service.getBaseUrl()).toBe(sampleApiConfig.appUrl);
        expect(service.getFeedbackUrl()).toBe(sampleApiConfig.feedbackUrl);
        expect(service.getGuidanceUrl()).toBe(sampleApiConfig.guidanceUrl);
      });

      const req = httpMock.expectOne('./app.override.config.json');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleApiConfig);
    });
  });

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.verify();
  });
});
