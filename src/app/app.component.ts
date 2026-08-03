import { Component, Inject, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { getUserHasPermission } from '@cpp/users-groups';
import { TranslateService } from '@ngx-translate/core';
import { HeaderNavItem, CppApplicationLayoutComponent } from '@cpp/application';
import { combineLatest, Observable } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import {
  AppConfigService,
  EXPECTED_HEARING_USER_PERMISSIONS,
  HearingUserPermissions
} from './config';
import { AppState } from './core/reducers';
import { BootstrapService, getHasApiActivity, getOnlineStatus } from './core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [
    `
      .read-only {
        pointer-events: none;
        opacity: 0.5;
      }
    `
  ],
  imports: [CppApplicationLayoutComponent, RouterOutlet, AsyncPipe]
})
export class AppComponent implements OnInit {
  loading$: Observable<boolean>;
  online$: Observable<boolean>;
  headerNavItems$: Observable<HeaderNavItem[]>;
  hasSearchEnabled$: Observable<boolean>;

  accountUrl: string;
  baseUrl: string;
  logoutUrl: string;
  yourServicesUrl: string;

  constructor(
    private store: Store<AppState>,
    private bootstrap: BootstrapService,
    private appConfigService: AppConfigService,
    private translate: TranslateService,
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject(EXPECTED_HEARING_USER_PERMISSIONS) public expectedPermissions: HearingUserPermissions
  ) {
    this.bootstrap.startConnectivityMonitor();

    this.loading$ = combineLatest([
      this.store.pipe(select(getHasApiActivity), debounceTime(1)),
      router.events.pipe(
        filter(event => event instanceof NavigationStart || event instanceof NavigationEnd),
        map(event => event instanceof NavigationStart)
      )
    ]).pipe(map(([hasApiActivity, hasRouterActivity]) => hasApiActivity || hasRouterActivity));

    this.online$ = this.store.select(getOnlineStatus);

    this.accountUrl = appConfigService.getAccountUrl();
    this.baseUrl = appConfigService.getBaseUrl();
    this.logoutUrl = appConfigService.getLogoutUrl();
    this.yourServicesUrl = appConfigService.getServicesUrl();

    // Translate
    this.translate.addLangs(['en']);
    this.translate.setFallbackLang('en');
    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang.match(/en|cy/) ? browserLang : 'en');

    this.headerNavItems$ = this.store.pipe(
      select(getUserHasPermission([expectedPermissions.viewCpSearch])),
      map(hasSearchPermission => {
        let navItems: HeaderNavItem[] = [];

        if (hasSearchPermission) {
          navItems = [...navItems, { title: 'Detailed Search', href: this.searchUrl }];
        }

        navItems = [...navItems, { title: 'Home', href: this.baseUrl }];

        if (this.yourServicesUrl) {
          navItems = [...navItems, { title: 'Your Services', href: this.yourServicesUrl }];
        }

        if (this.accountUrl) {
          navItems = [...navItems, { title: 'Your Account', href: this.accountUrl }];
        }

        if (this.logoutUrl) {
          navItems = [...navItems, { title: 'Sign out', href: this.logoutUrl }];
        }

        return navItems;
      })
    );

    this.hasSearchEnabled$ = this.store.pipe(
      select(getUserHasPermission([expectedPermissions.viewCpSearch]))
    );
  }
  ngOnInit(): void {
    const appTitle = this.titleService.getTitle();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;
          while (child.firstChild) {
            child = child.firstChild;
          }
          if (child.snapshot.data['title']) {
            return child.snapshot.data['title'];
          }
          return appTitle;
        })
      )
      .subscribe((ttl: string) => {
        this.titleService.setTitle(ttl);
      });
  }

  get searchUrl(): string {
    return `${this.appConfigService.cppHomeUrl}/search?referrer=${encodeURIComponent(
      document.baseURI
    )}`;
  }

  handleSearch(caseReference: string | null) {
    window.location.href = `${this.searchUrl}&caseReference=${caseReference}`;
  }
}
