import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideStore, Store } from '@ngrx/store';
import { AppComponent } from './app.component';
import { ConnectionService, BootstrapService } from './core/services';
import { AppConfigService } from './config';
import { AppState, reducers } from './core/reducers';
import { UsersGroupsActions, RolePermission, SystemAnnouncementsService } from '@cpp/users-groups';
import { provideCPPApplicationEnvironment } from '@cpp/application';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

describe('App page component', () => {
  const getAccountUrl = jest.fn();
  const getBaseUrl = jest.fn();
  const getLogoutUrl = jest.fn();
  const getServicesUrl = jest.fn();

  let fixture: ComponentFixture<AppComponent>;
  let store: Store<AppState>;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideCPPApplicationEnvironment({ production: false }),
        provideStore(reducers, { runtimeChecks: {} }),
        provideRouter([]),
        provideTranslateService(),
        {
          provide: ConnectionService,
          useValue: {
            startConnectivityMonitor: jest.fn()
          }
        },
        {
          provide: AppConfigService,
          useValue: {
            getAccountUrl,
            getBaseUrl,
            getLogoutUrl,
            getServicesUrl
          }
        },
        { provide: Title, useValue: { getTitle: jest.fn(), setTitle: jest.fn() } },
        {
          provide: SystemAnnouncementsService,
          useValue: {
            getSystemAnnouncements: jest.fn().mockReturnValue(of([]))
          }
        },
        {
          provide: BootstrapService,
          useValue: {
            startConnectivityMonitor: jest.fn()
          }
        }
      ],
      teardown: { destroyAfterEach: false }
    }).configureCompiler({ preserveWhitespaces: false } as any);
    store = TestBed.inject<Store<AppState>>(Store);
    getAccountUrl.mockReturnValue('http://account-url');
    getBaseUrl.mockReturnValue('http://base-url');
    getLogoutUrl.mockReturnValue('http://logout-url');
    getServicesUrl.mockReturnValue('http://services-url');
  });

  it('should compile correctly with all header urls', () => {
    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture).toMatchSnapshot();
  });

  describe('when search is available', () => {
    beforeEach(() => {
      store.dispatch(
        UsersGroupsActions.setUserPermissions({
          permissions: [
            {
              object: 'CP Search',
              action: 'View'
            }
          ] as RolePermission[]
        })
      );
    });

    it('should compile correctly ', () => {
      TestBed.inject(AppConfigService).cppHomeUrl = 'https://cpp.home';
      fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();
      expect(fixture).toMatchSnapshot();
    });
  });
});
