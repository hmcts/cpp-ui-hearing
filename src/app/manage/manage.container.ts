import { AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet, RouterLink } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import {
  filter,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import { AppConfigService } from '../config';
import {
  AppState,
  canUserAmendHearing,
  findCourCentres,
  getAllOffencesFromHearing,
  getAmendmentMessage,
  getCurrentCaseIds,
  getCurrentHearing,
  getCurrentHearingDays,
  getCurrentHearingNotes,
  getCurrentHearingUrn,
  getHasFutureHearings,
  getHearingCaseUrl,
  getHearingHasBulkCaseOnly,
  getIsGroupCaseApplication,
  getManageHearingSidebarHidden,
  getNonBulkCaseDefendants,
  getSelectedHearingDate,
  getShowFutureHearingsRemovedAlert,
  HearingCaseLink,
  HearingCaseLinkType,
  HearingCaseNotes,
  HearingDetail,
  isBoxwork,
  isCurrentHearingRestricted,
  isPleaApplicable,
  isVerdictsPageAvailable,
  loadHearingEventLogCountAction,
  LoadHearingEventsAction,
  Offence,
  RemoveFutureHearingsReset,
  SetSelectedHearingDateAction
} from '../core';
import { WofdWarningService } from '@cpp/application';
import { Breadcrumb } from '../core/model/breadcrumb';
import { ClickedMenuItemEvent, TopMenu, TopMenuItem } from '../shared/components/top-menu/top-menu';
import { getUserCourtCentreOuCodes } from '../core/selectors/user-groups';
import {
  ModalService,
  PdkGridComponent,
  PdkGridDirective,
  PdkMarginDirective,
  PdkAlertComponent,
  PdkPaddingDirective,
  PdkPageHeaderComponent,
  PdkPageHeaderContentComponent,
  PdkLinkDirective,
  PdkTextColorDirective,
  PdkTypographyDirective
} from '@cpp/pdk';
import { UnlockHearingConfirmationFormComponent } from './unlock-hearing/unlock-hearing-confirmation-form.component';
import { ShareResultsActions } from '../results/core/store';
import { DefendantNamesPipe } from '../shared/pipes/defendant-names.pipe';
import { getFeatures } from '../core/selectors/features';
import { ClearCourtOrdersAction, LoadCourtOrdersAction } from '../core/actions/court-orders';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MultiDayDropDownComponent } from './multiday-dropdown/multiday-dropdown.component';
import { ManageNavigationComponent } from './manage-navigation/manage-navigation.component';
import { TrialOutcomeContainer } from '../trial-outcome/trial-outcome.container';
import { TopMenuComponent } from '../shared/components/top-menu/top-menu.component';
import { HearingEventsLogContainer } from '../hearing-events-log/hearing-events-log.container';
import { HearingCaseLinksNotesComponent } from '../hearing-case-links-notes/hearing-case-links-notes.component';

@Component({
  selector: 'hearing',
  styleUrls: ['./manage.scss'],
  templateUrl: './manage.container.html',
  imports: [
    PdkGridComponent,
    PdkGridDirective,
    PdkMarginDirective,
    PdkAlertComponent,
    MultiDayDropDownComponent,
    PdkPaddingDirective,
    PdkPageHeaderComponent,
    PdkPageHeaderContentComponent,
    PdkLinkDirective,
    PdkTextColorDirective,
    ManageNavigationComponent,
    RouterOutlet,
    TrialOutcomeContainer,
    PdkTypographyDirective,
    RouterLink,
    TopMenuComponent,
    HearingEventsLogContainer,
    HearingCaseLinksNotesComponent,
    AsyncPipe,
    DatePipe,
    TranslatePipe
  ],
  providers: [ModalService]
})
export class ManageContainer implements OnDestroy, OnInit, AfterViewChecked {
  hearing$: Observable<HearingDetail>;
  hearingNotes$: Observable<HearingCaseNotes[]>;
  defendantsNames$: Observable<string>;
  isVerdictsPageAvailable$: Observable<boolean>;
  hearingDays$: Observable<any[]>;
  offences$: Observable<Offence[]>;
  selectedHearingDate$: Observable<string>;
  inWorkingArea$: Observable<boolean>;
  amendmentMessage: { message: string; user?: string };
  hearingHasBulkCaseOnly: boolean;
  hasFutureHearing$: Observable<boolean>;
  canAddChildApplications$: Observable<boolean>;

  urns$: Observable<string>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  sidebarHidden = false;

  hearingId: string;
  breadcrumbs: Breadcrumb[] = [];
  translations: any;
  today = new Date();
  topMenu: TopMenu;
  caseIds: string[];
  isBoxwork$: Observable<boolean>;
  isCurrentUserAuthorisedToSeeThisHearing$: Observable<boolean>;
  isPleaApplicableFlag$: Observable<boolean>;
  showFutureHearingsRemoved$: Observable<boolean>;
  displayUnlockHearingLink: boolean;

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private cdRef: ChangeDetectorRef,
    private modalService: ModalService,
    private configService: AppConfigService,
    private defendantNamesPipe: DefendantNamesPipe,
    private wofdWarningService: WofdWarningService
  ) {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.hearingId = params['hearingId'];
    });

    this.isBoxwork$ = this.store.select(isBoxwork);
    this.translate
      .get([
        'MANAGE.HEARING_LIST',
        'MANAGE.MANAGE_HEARING',
        'MANAGE.ENTER_PLEAS',
        'MANAGE.ENTER_VERDICTS',
        'MANAGE.ENTER_RESULTS',
        'MANAGE.EVENT_LOG',
        'MANAGE.REFERENCE'
      ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        this.translations = values;
        this.topMenu = [
          [
            {
              text: this.translations['MANAGE.EVENT_LOG'],
              active: true
            },
            {
              text: this.translations['MANAGE.REFERENCE']
            }
          ]
        ];
      });

    this.hasFutureHearing$ = this.store.select(getHasFutureHearings);
  }

  ngOnInit(): void {
    this.isCurrentUserAuthorisedToSeeThisHearing$ = this.store.select(isCurrentHearingRestricted);
    if (this.router.url.indexOf('applications') > -1) {
      this.router.navigate([`/manage/${this.hearingId}`]);
    }

    this.hearing$ = this.store.select(getCurrentHearing);
    this.offences$ = this.store.select(getAllOffencesFromHearing);
    this.urns$ = this.store.select(getCurrentHearingUrn);
    this.hearingDays$ = this.store.select(getCurrentHearingDays);
    this.isPleaApplicableFlag$ = this.store.select(isPleaApplicable);
    this.isVerdictsPageAvailable$ = this.store.select(isVerdictsPageAvailable);
    this.hearingNotes$ = this.store.select(getCurrentHearingNotes);
    this.canAddChildApplications$ = this.store
      .select(getFeatures)
      .pipe(map(services => services.includes('childApplication')));

    this.selectedHearingDate$ = this.store.select(getSelectedHearingDate);
    this.defendantsNames$ = combineLatest([
      this.store.select(getNonBulkCaseDefendants),
      this.translate.get('COMMON.BULK_DEFENDANT')
    ]).pipe(
      take(1),
      map(
        ([{ defendants, hasBulkDefendant }, bulkDefendantName]) =>
          `${
            hasBulkDefendant ? bulkDefendantName + ',' : ''
          } ${this.defendantNamesPipe.transformDefendants(defendants)}`
      )
    );
    this.store
      .select(getHearingHasBulkCaseOnly)
      .pipe(
        takeUntil(this.destroy$),
        tap(bulkCaseOnly => (this.hearingHasBulkCaseOnly = bulkCaseOnly))
      )
      .subscribe();
    this.showFutureHearingsRemoved$ = this.store.select(getShowFutureHearingsRemovedAlert);
    this.store.select(getAmendmentMessage).subscribe(message => (this.amendmentMessage = message));

    combineLatest([
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.router.url),
        startWith(this.router.url)
      ),
      this.store.select(canUserAmendHearing)
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([fullPath, canAmend]) => {
        this.displayUnlockHearingLink = fullPath.includes('manage-hearing-error')
          ? false
          : !canAmend;
      });

    // As route hierarchy is not ordered correctly, child routes are forced to
    // trigger hiding elements from their parent's view. Unfortunately, this
    // means that for transitions which are asynchronous and display the
    // activity indicator during navigation, the `sidebarHidden` will react to
    // the incoming route immediately and manipulate the page behind the
    // indicator. As a workaround for this ugliness, we defer updating the
    // update of this container only when a route transition completes and not
    // when it begins.
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        withLatestFrom(this.store.select(getManageHearingSidebarHidden)),
        map(([, sidebarHidden]) => sidebarHidden),
        startWith(false),
        takeUntil(this.destroy$)
      )
      .subscribe(sidebarHidden => {
        this.sidebarHidden = sidebarHidden;
      });

    this.store
      .select(getCurrentCaseIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe(caseIds => {
        this.caseIds = caseIds;
      });

    const userCourtCentreOuCodes$ = this.store.select(getUserCourtCentreOuCodes);
    const userCourtCentres$ = userCourtCentreOuCodes$.pipe(
      switchMap(ouCodes => this.store.select(findCourCentres(...ouCodes)))
    );
    const courtCentreIds$ = userCourtCentres$.pipe(
      map(courtCentres => courtCentres.map(({ id }) => id))
    );

    this.inWorkingArea$ = combineLatest([
      this.store.select(getCurrentHearing),
      courtCentreIds$,
      userCourtCentreOuCodes$
    ]).pipe(
      map(
        ([currentHearing, courtCentreIds, userCourtCentreOuCodes]) =>
          courtCentreIds.includes((<HearingDetail>currentHearing).courtCentre.id) ||
          userCourtCentreOuCodes.length === 0
      )
    );
    // Dispatch the action to get Hearing event log count
    this.store.dispatch(loadHearingEventLogCountAction({ hearingId: this.hearingId }));
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  onMenuItemClick(event: ClickedMenuItemEvent) {
    if (event.item && !event.item.active) {
      this.activateItem(event);
    }
  }

  activateItem(event: ClickedMenuItemEvent) {
    event.menu.forEach((subMenu: Array<TopMenuItem>) => {
      subMenu.forEach((subMenuItem: TopMenuItem) => {
        subMenuItem.active = subMenuItem.text === event.item.text;
      });
    });
  }

  selectedDay(hearingDate: string): void {
    if (hearingDate) {
      this.store.dispatch(new SetSelectedHearingDateAction(hearingDate));
      this.store.dispatch(new LoadHearingEventsAction({ hearingId: this.hearingId }));
      this.store.dispatch(loadHearingEventLogCountAction({ hearingId: this.hearingId }));
      this.store.dispatch(new ClearCourtOrdersAction());
      this.store.dispatch(new LoadCourtOrdersAction({ hearingDate }));
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  get isStandaloneApplication(): boolean {
    return this.caseIds && this.caseIds.length === 0;
  }

  onDeactivated(): void {
    this.store.dispatch(new RemoveFutureHearingsReset());
  }

  goToCaseLink(hearingCaseLink: HearingCaseLink) {
    const url = getHearingCaseUrl(this.hearingId, hearingCaseLink);
    const navigate = () =>
      window.open(`${this.configService.appUrl}/prosecution-casefile/${url}`, '_blank');

    if (hearingCaseLink.type !== HearingCaseLinkType.APPLICATION_AT_A_GLANCE) {
      navigate();
      return;
    }

    this.hearing$.pipe(take(1)).subscribe(hearing => {
      const appType = hearing?.courtApplications?.find(
        a => a.id === hearingCaseLink.applicationId
      )?.type;

      if (appType && this.wofdWarningService.isWofdApplication([appType])) {
        this.wofdWarningService.showModal({ onProceed: navigate });
      } else {
        navigate();
      }
    });
  }

  goToCreateTask({ caseUrn, courtCentreId }: { caseUrn: string; courtCentreId: string }): void {
    const url = `${this.configService.getBaseUrl()}/work-management/create?caseURN=${caseUrn}&courtCentreId=${courtCentreId}`;
    window.open(url, '_blank');
  }

  get topMenuDetails(): TopMenu {
    return this.topMenu
      ? this.hearingHasBulkCaseOnly
        ? [[this.topMenu[0][0]]]
        : [...this.topMenu]
      : [];
  }

  get isGroupCaseApplication$(): Observable<boolean> {
    return this.store.pipe(
      select(getIsGroupCaseApplication),
      map(
        isGroupCaseApplication => isGroupCaseApplication && this.router.url.startsWith('/manage/')
      )
    );
  }

  handleUnlockHearing = async () => {
    const unlockHearing = await this.requestUnlockHearing();
    if (unlockHearing) {
      this.store.dispatch(ShareResultsActions.unlockHearing());
    }
  };

  private requestUnlockHearing(): Promise<boolean> {
    return new Promise(resolve => {
      const modalRef = this.modalService.open(UnlockHearingConfirmationFormComponent, {
        width: 480,
        data: {
          onSubmit: () => {
            modalRef.dispose();
            resolve(true);
          },
          onCancel: () => {
            modalRef.dispose();
            resolve(false);
          }
        }
      });
    });
  }
}
