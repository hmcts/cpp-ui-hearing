import { HearingCaseLink, HearingCaseLinkType } from './../core/model/hearing-case-link';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Inject,
  OnDestroy,
  ViewChild
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { combineLatest, Observable, Subject } from 'rxjs';
import {
  getUserDetails,
  getUserHasPermission,
  PermissionOperator,
  RolePermission,
  UserDetails,
  CppUserHasPermissionDirective
} from '@cpp/users-groups';
import {
  ApplicantCounsel,
  AppState,
  AttendantType,
  CompanyRepresentative,
  CounselsCache,
  CourtApplication,
  CourtCentre,
  DefaultOptions,
  DefenceCounsel,
  Defendant,
  DefendantCasesApplications,
  getApplicationsFromCurrentHearing,
  getCasesAndApplicationsGroupedByDefendant,
  getCounselsCache,
  getCourtCentres,
  getCurrentHearing,
  getCurrentHearingCompanyRepresentatives,
  getCurrentHearingDefenceCounsels,
  getCurrentHearingIntermediaries,
  getCurrentHearingNotes,
  getCurrentHearingProsecutionCounsels,
  getCurrentHearingUrnList,
  getHasApiActivity,
  getHearingCaseUrl,
  getHearingHasBulkCaseOnly,
  getHearingList,
  getIsSelectedCaseBulk,
  getSelectedHearingDate,
  getSubjectsFromCurrentHearing,
  getTodayHearingListIds,
  getTotalNumberOfCases,
  HearingCaseNotes,
  HearingDetail,
  HearingSummary,
  IntermediaryCounsel,
  isCurrentHearingRestricted,
  isHearingEventLogEnded,
  LoadHearingDetailAction,
  loadHearingEventLogCountAction,
  LoadHearingListAction,
  ProsecutionCounsel,
  resolveProceedingsConcluded,
  RespondentCounsel,
  SaveApplicantCounselsAction,
  SaveRespondentCounselsAction,
  setIsSelectedCaseBulk,
  SetSelectedHearingDateAction,
  setSelectedOptions
} from '../core';
import { AppConfigService } from '../config';
import {
  SaveCompanyRepresentativesAction,
  SaveDefenceCounselsAction,
  SaveIntermediaryCounselsAction,
  SaveProsecutionCounselsAction
} from '../core/actions/hearing';
import { ApplicationCounselsFormState } from './attendees-panel/application-counsels-panel/application-counsels-form.component';
import { filter, map, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { PageScrollInstance, PageScrollService } from 'ngx-page-scroll-core';
import { DOCUMENT, Location, AsyncPipe } from '@angular/common';
import { CPPDate, getCPPDate } from '../core/utils/cpp-date';
import { Breadcrumb } from '../core/model/breadcrumb';
import { ClickedMenuItemEvent, TopMenu, TopMenuItem } from '../shared/components/top-menu/top-menu';
import { cloneDeep } from 'lodash-es';
import { counselEntities } from './attendees-panel/model/counsel-model-group';
import { ProsecutionCaseSummary } from '../core/model/shared/prosecution-case-summary';
import { CaseAccessAlertService } from '../case-access-alert/case-access-alert.service';
import { WofdWarningService } from '@cpp/application';
import {
  ValidationError,
  PdkPaddingDirective,
  PdkAlertComponent,
  PdkMarginDirective,
  PdkErrorSummaryComponent,
  PdkTypographyDirective,
  PdkBorderColorDirective,
  PdkWarningTextComponent,
  PdkGridComponent,
  PdkGridDirective,
  PdkButtonComponent,
  PdkButtonDirective,
  PdkCollapsable
} from '@cpp/pdk';
import { getUserCourtCentreOuCodes } from '../core/selectors/user-groups';
import { findCourCentres } from '../core/selectors/reference-data';
import { getCurrentCaseIds } from '../core/selectors/hearing';
import {
  EXPECTED_HEARING_USER_PERMISSIONS,
  HearingUserPermissions
} from '../config/user-permissions';
import {
  ApplicationSubject,
  deriveApplicationCaseSummaries,
  isConcludedLinkedApplication,
  isStandAloneApplication
} from '../core/selectors/application';
import { getFeatures } from '../core/selectors/features';
import { HearingListFilterComponent } from './hearing-list-filter/hearing-list-filter.component';
import { HearingListFilterSummaryComponent } from './hearing-list-filter-summary/hearing-list-filter-summary.component';
import { CaseAccessAlertComponent } from '../case-access-alert/case-access-alert.component';
import { HearingListPanelComponent } from './hearing-list-panel/hearing-list-panel.component';
import { HearingDetailsPanelComponent } from './hearing-details-panel/hearing-details-panel.component';
import { DefendantDetailsPanelComponent } from './defendant-details-panel/defendant-details-panel.component';
import { ApplicationOverviewComponent } from './defendant-details-panel/application-overview/application-overview.component';
import { AttendeesPanelComponent } from './attendees-panel/attendees-panel.component';
import { TrialOutcomeContainer } from '../trial-outcome/trial-outcome.container';
import { TopMenuComponent } from '../shared/components/top-menu/top-menu.component';
import { HearingEventsLogContainer } from '../hearing-events-log/hearing-events-log.container';
import { HearingCaseLinksNotesComponent } from '../hearing-case-links-notes/hearing-case-links-notes.component';
import { HearingListFeedbackPanelComponent } from './hearing-list-feedback-panel/hearing-list-feedback-panel.component';
import { IdpcIngestionComponentStore } from './component-store/idpc-ingestion-store';
import { IdpcIngestionStatusComponent } from './idpc-ingestion-status/idpc-ingestion-status.component';

@Component({
  selector: 'hearing-list',
  templateUrl: './hearing-list.container.html',
  styleUrls: ['./hearing-list.container.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkPaddingDirective,
    PdkAlertComponent,
    PdkMarginDirective,
    PdkErrorSummaryComponent,
    PdkTypographyDirective,
    HearingListFilterComponent,
    HearingListFilterSummaryComponent,
    PdkBorderColorDirective,
    PdkWarningTextComponent,
    PdkGridComponent,
    PdkGridDirective,
    CaseAccessAlertComponent,
    HearingListPanelComponent,
    HearingDetailsPanelComponent,
    DefendantDetailsPanelComponent,
    ApplicationOverviewComponent,
    AttendeesPanelComponent,
    PdkButtonComponent,
    PdkButtonDirective,
    TranslatePipe,
    TrialOutcomeContainer,
    TopMenuComponent,
    HearingEventsLogContainer,
    HearingCaseLinksNotesComponent,
    HearingListFeedbackPanelComponent,
    AsyncPipe,
    PdkCollapsable,
    IdpcIngestionStatusComponent,
    CppUserHasPermissionDirective
  ]
})
export class HearingListContainer implements OnDestroy {
  courtCentres$: Observable<CourtCentre[]>;
  hasHearingResults$: Observable<boolean>;
  hearings$: Observable<HearingSummary[]>;
  hearingNotes$: Observable<HearingCaseNotes[]>;
  hearingHasBulkCaseOnly: boolean;
  counselsCacheOptions$: Observable<CounselsCache>;
  hasApiActivity$: Observable<boolean>;
  inWorkingArea$: Observable<boolean>;
  isCurrentUserAuthorisedToSeeThisHearing$: Observable<boolean>;
  userHasHearingPermission$: Observable<boolean>;
  canAddChildApplications$: Observable<boolean>;
  applicationSubjects$: Observable<ApplicationSubject[]>;
  courtApplicationsMap$: Observable<Record<string, CourtApplication>>;

  prosecutionCounsels$: Observable<ProsecutionCounsel[]>;
  defenceCounsels$: Observable<DefenceCounsel[]>;
  companyRepresentatives$: Observable<CompanyRepresentative[]>;
  intermediariesCounsel$: Observable<IntermediaryCounsel[]>;

  casesAndApplicationsGroupedByDefendant: DefendantCasesApplications[];
  caseIds: string[];
  parentApplicationIds: string[];
  breadcrumbs: Breadcrumb[] = [];
  selectedHearing: HearingDetail;
  selectedhearingDate: string;
  selectedSubject: ApplicationSubject;
  selectedDefendant: Omit<Defendant, 'offences'>;
  selectedOptions: DefaultOptions = {};
  searchedOptions: DefaultOptions;
  showFilters = true;
  topMenu: TopMenu;
  get changeJudiciaryLink(): string {
    return this.selectedHearing
      ? this.configService.getBaseUrl() +
          '/listing/court-calendar/change-hearing-details/' +
          this.selectedHearing.id
      : null;
  }
  destroy$: Subject<boolean> = new Subject<boolean>();
  attendeesMenuItems = ['DEFENCE', 'PROSECUTION'];
  selectedAttendeeItem: string;
  showAttendeesPanel = false;
  prosecutionCounselsIds: string[] = [];
  defenceCounselIds: string[] = [];
  companyRepresentativeIds: string[] = [];
  editedProsecution = false;
  editedDefence = false;
  editedIntemediaries = false;
  editedCompanyRepresentative = false;
  prosecutionCasesSummary: ProsecutionCaseSummary[];
  defendantsCurrentHearing: Defendant[];
  prosecutionCounsels: ProsecutionCounsel[] = [];
  defenceCounsels: DefenceCounsel[] = [];
  companyRepresentatives: CompanyRepresentative[] = [];
  usesApplicationAttendeeFlow: boolean;
  isStandAloneApplication: boolean;
  proceedingsConcluded: boolean;
  intermediariesCounsel: IntermediaryCounsel[] = [];
  intermediariesCounselIds: string[] = [];
  counselValid = false;
  urns: string[];
  loggedInUser: UserDetails;
  todayHearingListIds: string[];
  totalCasesForHearing$: Observable<number>;
  feedbackUrl: string;
  guidanceUrl: string;

  // Application attendees

  applicantCounsels: ApplicantCounsel[] = [];
  applicantCounselsFormState: ApplicationCounselsFormState<ApplicantCounsel>;
  respondentCounsels: RespondentCounsel[] = [];
  respondentCounselsFormState: ApplicationCounselsFormState<RespondentCounsel>;
  errors: ValidationError[] = [];
  hearingEventLogEnded: boolean;
  private readonly dateUtil: CPPDate;

  @ViewChild('scrollablePanel', { read: ElementRef })
  private scrollablePanel: ElementRef;
  private readonly IdpcIngestionStore = inject(IdpcIngestionComponentStore);
  private readonly wofdWarningService = inject(WofdWarningService);
  readonly idpcIngestionPhase$ = this.IdpcIngestionStore.ingestionPhase$;

  constructor(
    private store: Store<AppState>,
    private caseAlertService: CaseAccessAlertService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    @Inject('Window') private window: Window,
    private translate: TranslateService,
    private configService: AppConfigService,
    private pageScrollService: PageScrollService,
    private cd: ChangeDetectorRef,
    private location: Location,
    @Inject(DOCUMENT) private document: Document,
    @Inject(EXPECTED_HEARING_USER_PERMISSIONS) public expectedPermissions: HearingUserPermissions
  ) {
    this.dateUtil = getCPPDate();
    this.courtCentres$ = this.store.select(getCourtCentres);
    this.hearings$ = this.store.select(getHearingList);

    this.hasHearingResults$ = this.hearings$.pipe(
      map(hearings => {
        return (
          hearings &&
          hearings.length > 0 &&
          (!!hearings[0].courtApplicationSummaries || !!hearings[0].prosecutionCaseSummaries)
        );
      })
    );

    this.hearingNotes$ = this.store.select(getCurrentHearingNotes);
    this.counselsCacheOptions$ = this.store.select(getCounselsCache);
    this.hasApiActivity$ = this.store.select(getHasApiActivity);
    this.isCurrentUserAuthorisedToSeeThisHearing$ = this.store.select(isCurrentHearingRestricted);
    this.totalCasesForHearing$ = this.store.select(getTotalNumberOfCases);
    this.canAddChildApplications$ = this.store.pipe(
      select(getFeatures),
      map(services => services.includes('childApplication'))
    );

    this.applicationSubjects$ = this.store.pipe(
      select(getCasesAndApplicationsGroupedByDefendant),
      switchMap(defendants => {
        return this.store.select(getSubjectsFromCurrentHearing).pipe(
          tap(subjects => {
            if (defendants.length === 0) {
              this.selectedSubject = subjects[0];
            }
          })
        );
      })
    );
    this.courtApplicationsMap$ = this.store.select(getApplicationsFromCurrentHearing);

    this.prosecutionCounsels$ = this.store.select(getCurrentHearingProsecutionCounsels);
    this.defenceCounsels$ = this.store.select(getCurrentHearingDefenceCounsels);
    this.companyRepresentatives$ = this.store.select(getCurrentHearingCompanyRepresentatives);
    this.intermediariesCounsel$ = this.store.select(getCurrentHearingIntermediaries);

    this.store
      .select(getCurrentHearing)
      .pipe(takeUntil(this.destroy$))
      .subscribe(hearing => {
        this.selectedHearing = hearing;

        this.usesApplicationAttendeeFlow =
          isStandAloneApplication(hearing) || isConcludedLinkedApplication(hearing);

        this.isStandAloneApplication = isStandAloneApplication(hearing);
        this.proceedingsConcluded = resolveProceedingsConcluded(this.selectedHearing);

        if (hearing && hearing.prosecutionCases?.length > 0 && !this.usesApplicationAttendeeFlow) {
          let lastCaseUrn = '';
          const allCases = this.selectedHearing.prosecutionCases;

          this.caseIds = hearing.prosecutionCases.map(kase => kase.id);
          this.prosecutionCounsels = this.selectedHearing.prosecutionCounsels
            ? [...this.selectedHearing.prosecutionCounsels]
            : [];
          this.defenceCounsels = this.selectedHearing.defenceCounsels
            ? cloneDeep(this.selectedHearing.defenceCounsels)
            : [];

          if (this.defenceCounsels) {
            this.defenceCounsels.sort((a, b) =>
              a.defendants[0] > b.defendants[0] ? 1 : b.defendants[0] > a.defendants[0] ? -1 : 0
            );

            this.defenceCounsels.forEach(defenceCoun => {
              const caseForDefenceCoun = allCases.find(cs =>
                cs.defendants.some(def => def.id === defenceCoun.defendants[0])
              );
              const caseIdentifier = caseForDefenceCoun.prosecutionCaseIdentifier;
              const caseUrn =
                caseIdentifier.caseURN || caseIdentifier.prosecutionAuthorityReference || '';

              if (lastCaseUrn !== caseUrn) {
                defenceCoun.caseUrn = caseUrn;
              }

              lastCaseUrn = caseUrn;
            });
          }

          this.intermediariesCounsel = this.selectedHearing.intermediaries
            ? cloneDeep(this.selectedHearing.intermediaries)
            : [];

          if (this.selectedHearing.companyRepresentatives) {
            lastCaseUrn = '';

            this.companyRepresentatives = cloneDeep(this.selectedHearing.companyRepresentatives);

            this.companyRepresentatives.sort((a, b) =>
              a.defendants[0] > b.defendants[0] ? 1 : b.defendants[0] > a.defendants[0] ? -1 : 0
            );

            this.companyRepresentatives.forEach(companyRep => {
              const caseForCompanyRep = allCases.find(cs =>
                cs.defendants.some(def => def.id === companyRep.defendants[0])
              );
              const caseIdentifier = caseForCompanyRep.prosecutionCaseIdentifier;
              const caseUrn =
                caseIdentifier.caseURN || caseIdentifier.prosecutionAuthorityReference || '';

              if (lastCaseUrn !== caseUrn) {
                companyRep.caseUrn = caseUrn;
              }

              lastCaseUrn = caseUrn;
            });
          } else {
            this.companyRepresentatives = [];
          }

          if (this.selectedhearingDate) {
            this.prosecutionCounsels = this.prosecutionCounsels.filter(pc =>
              pc.attendanceDays.some(ad => ad === this.selectedhearingDate)
            );
            this.defenceCounsels = this.defenceCounsels.filter(dc =>
              dc.attendanceDays.some(ad => ad === this.selectedhearingDate)
            );

            this.intermediariesCounsel = this.intermediariesCounsel.filter(ic =>
              ic.attendanceDays.some(ad => ad === this.selectedhearingDate)
            );
            this.companyRepresentatives = this.companyRepresentatives.filter(dc =>
              dc.attendanceDays.some(ad => ad === this.selectedhearingDate)
            );
          }

          this.prosecutionCounselsIds = this.prosecutionCounsels.map(pc => pc.id);
          this.defenceCounselIds = this.defenceCounsels.map(dc => dc.id);
          this.intermediariesCounselIds = this.intermediariesCounsel.map(ic => ic.id);
          this.companyRepresentativeIds = this.companyRepresentatives.map(dc => dc.id);

          const totalDefendants = hearing.prosecutionCases
            .map(x =>
              x.defendants.map(i => {
                return {
                  ...i,
                  isGroupMaster: x.isGroupMaster
                };
              })
            )
            .reduce((a, b) => a.concat(b), []);
          this.defendantsCurrentHearing = totalDefendants;

          this.prosecutionCasesSummary = this.selectedHearing.prosecutionCases.map(kase => {
            return {
              id: kase.id,
              prosecutionCaseIdentifier: kase.prosecutionCaseIdentifier,
              defendants: [] as any[],
              isGroupMaster: kase.isGroupMaster || undefined
            };
          });

          this.editedDefence = false;
          this.editedProsecution = false;
          this.editedCompanyRepresentative = false;
        } else if (this.usesApplicationAttendeeFlow) {
          this.caseIds = (this.selectedHearing.courtApplications || [])
            .map(application => application.linkedCaseId)
            .filter(Boolean);
          this.defendantsCurrentHearing = [];
          this.prosecutionCasesSummary = deriveApplicationCaseSummaries(
            this.selectedHearing.courtApplications || []
          );
        }

        // Reset application attendees data when hearing changes

        if (hearing && hearing.courtApplications) {
          this.applicantCounsels = hearing.applicantCounsels || [];
          this.respondentCounsels = hearing.respondentCounsels || [];
          this.parentApplicationIds = this.selectedHearing.courtApplications
            .map(application => application.parentApplicationId)
            .filter(Boolean);

          this.intermediariesCounsel = hearing.intermediaries
            ? cloneDeep(hearing.intermediaries)
            : [];

          // If there are no explicit parentApplicationIds, then the applicationId would act as parent
          // Refactor this when BE ready to flag which application is parent and which is child
          if (this.parentApplicationIds.length === 0) {
            this.parentApplicationIds = this.selectedHearing.courtApplications.map(
              application => application.id
            );
          }
        }
        this.applicantCounselsFormState = null;
        this.respondentCounselsFormState = null;
        this.cd.markForCheck();
      });

    combineLatest([
      this.store.select(getHearingHasBulkCaseOnly),
      this.store.select(getIsSelectedCaseBulk)
    ]).subscribe(([hearingHasBulkCaseOnly, isSelectedCaseBulk]) => {
      if (hearingHasBulkCaseOnly) {
        this.hearingHasBulkCaseOnly = true;
      }

      if (!isSelectedCaseBulk) {
        this.hearingHasBulkCaseOnly = false;
      }

      if (isSelectedCaseBulk) {
        this.hearingHasBulkCaseOnly = isSelectedCaseBulk;
      }
    });

    this.store
      .select(getSelectedHearingDate)
      .pipe(takeUntil(this.destroy$))
      .subscribe(selectedDay => {
        this.selectedhearingDate = selectedDay;
        this.cd.markForCheck();
      });

    this.store
      .select(getCasesAndApplicationsGroupedByDefendant)
      .pipe(takeUntil(this.destroy$))
      .subscribe(casesAndApplicationsGrouped => {
        this.casesAndApplicationsGroupedByDefendant = casesAndApplicationsGrouped;

        if (
          !!this.casesAndApplicationsGroupedByDefendant &&
          this.casesAndApplicationsGroupedByDefendant.length === 1
        ) {
          this.defendantSelected(this.casesAndApplicationsGroupedByDefendant[0]);
        }
        this.cd.markForCheck();
      });

    this.translate
      .get(['HEARING_LIST.BREADCRUMB', 'MANAGE.EVENT_LOG', 'MANAGE.REFERENCE'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(values => {
        this.breadcrumbs = [{ title: values['HEARING_LIST.BREADCRUMB'], routerLink: ['/'] }];

        this.topMenu = [
          [
            {
              text: values['MANAGE.EVENT_LOG'],
              active: true
            },
            {
              text: values['MANAGE.REFERENCE']
            }
          ]
        ];
      });

    const {
      hearingDate,
      courtCentreName,
      courtCentreId,
      courtRoomName,
      courtRoomId,
      hearingId,
      startTimeFilter,
      endTimeFilter
    } = this.activatedRoute.snapshot.queryParams;

    if (
      hearingDate ||
      courtCentreName ||
      courtCentreId ||
      courtRoomName ||
      courtRoomId ||
      hearingId ||
      startTimeFilter ||
      endTimeFilter
    ) {
      this.controlsChanged({
        dateFilter: hearingDate,
        courtCentreFilter: {
          id: courtCentreId,
          name: courtCentreName
        },
        courtRoomFilter: {
          id: courtRoomId,
          name: courtRoomName
        },
        startTimeFilter,
        endTimeFilter
      });

      this.loadHearings(hearingId);

      this.location.replaceState(this.location.path().split('?')[0], '');
    }

    this.store
      .select(getTodayHearingListIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe(todayHearingListIds => {
        this.todayHearingListIds = todayHearingListIds;
      });

    this.store
      .select(getUserDetails)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loggedInUser => {
        this.loggedInUser = loggedInUser;
      });

    this.store
      .select(getCurrentHearingUrnList)
      .pipe(takeUntil(this.destroy$))
      .subscribe(urns => {
        this.urns = urns;
      });

    const userCourtCentreOuCodes$ = this.store.select(getUserCourtCentreOuCodes);
    const userCourtCentres$ = userCourtCentreOuCodes$.pipe(
      switchMap(ouCodes => this.store.select(findCourCentres(...ouCodes)))
    );
    const courtCentreIds$ = userCourtCentres$.pipe(
      map(courtCentres => courtCentres.map(({ id }) => id))
    );

    this.userHasHearingPermission$ = combineLatest([
      this.store.select(getUserDetails),
      this.store.select(getCurrentHearing)
    ]).pipe(
      filter(([_, currentHearing]) => !!currentHearing),
      switchMap(([{ userId }, { id }]) => {
        const viewHearingPermission = {
          ...this.expectedPermissions.viewHearing,
          target: id,
          source: userId
        } as RolePermission;

        return this.store.select(getUserHasPermission([viewHearingPermission]));
      })
    );

    const userHasCasePermission$ = combineLatest([
      this.store.select(getUserDetails),
      this.store.select(getCurrentCaseIds)
    ]).pipe(
      filter(([userDetails]) => !!userDetails),
      switchMap(([{ userId }, caseIds]) => {
        const permissionChecks = caseIds.map(caseId => {
          return {
            ...this.expectedPermissions.viewHearing,
            target: caseId,
            source: userId
          } as RolePermission;
        });
        return this.store.select(getUserHasPermission(permissionChecks, PermissionOperator.or));
      })
    );

    this.inWorkingArea$ = combineLatest([
      this.store.select(getCurrentHearing),
      courtCentreIds$
    ]).pipe(
      filter(([currentHearing]) => !!currentHearing),
      map(([currentHearing, courtCentreIds]) =>
        courtCentreIds.includes((<HearingDetail>currentHearing).courtCentre.id)
      ),
      withLatestFrom(
        this.userHasHearingPermission$,
        userHasCasePermission$,
        this.store.select(getCurrentHearing),
        userCourtCentreOuCodes$,
        this.isCurrentUserAuthorisedToSeeThisHearing$
      ),
      tap(
        ([
          inWorkingArea,
          userHasHearingPermission,
          userHasCasePermission,
          currenthearing,
          userCourtCentreOuCodes,
          isUserAuthorisedToSeeThisHearing
        ]) =>
          userCourtCentreOuCodes.length !== 0 &&
          !inWorkingArea &&
          !userHasHearingPermission &&
          !userHasCasePermission &&
          isUserAuthorisedToSeeThisHearing &&
          this.router.navigate(['check-and-challenge', currenthearing.id, 'hearing-list'])
      ),
      map(
        ([inWorkingArea, _, __, ___, userCourtCentreOuCodes]) =>
          inWorkingArea || userCourtCentreOuCodes.length === 0
      )
    );
    this.feedbackUrl = this.configService.getFeedbackUrl();
    this.guidanceUrl = this.configService.getGuidanceUrl();
    this.store
      .select(isHearingEventLogEnded)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isHearingEventLogEnded => {
        this.hearingEventLogEnded = isHearingEventLogEnded;
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
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

  onShowFilters(showFilters: boolean) {
    this.showFilters = showFilters;
  }

  controlsChanged(options: DefaultOptions) {
    this.selectedOptions = Object.assign({ ...this.selectedOptions }, options);
  }

  hearingSelected(hearing: HearingSummary) {
    this.clearSelectedHearing();
    this.clearSelectedTopMenu();
    this.clearSelectedDefendant();
    this.loadHearingDetails(hearing);
  }

  selectSubject(subject: ApplicationSubject) {
    this.selectedSubject = subject;
    this.selectedDefendant = null;
  }

  resetTopMenuActiveTabs() {
    if (this.topMenu) {
      this.topMenu[0][0].active = true;
      this.topMenu[0][1].active = false;
    }
  }

  defendantSelected(defendant: DefendantCasesApplications) {
    const isSelectedCaseBulk: boolean =
      defendant.prosecutionCases?.[0]?.groupId && defendant.prosecutionCases[0].isGroupMember;

    this.store.dispatch(setIsSelectedCaseBulk({ isSelectedCaseBulk }));
    this.selectedDefendant = defendant;
    this.selectedSubject = null;
    this.resetTopMenuActiveTabs();
  }

  goToHearing() {
    this.showCaseAlert({ url: [`/manage/${this.selectedHearing.id}`] });
  }

  goToHearingResults() {
    this.showCaseAlert({ url: [`/manage/${this.selectedHearing.id}/enter-results`] });
  }

  showHideAttendeesPanel(visible: boolean) {
    this.showAttendeesPanel = visible;
  }

  loadHearings(hearingId: string = undefined) {
    this.IdpcIngestionStore.clearIngestionPhase();
    this.store.dispatch(
      new LoadHearingListAction({
        date: this.selectedOptions.dateFilter.toString(),
        courtCentreId: this.selectedOptions.courtCentreFilter.id.toString(),
        roomId: this.selectedOptions.courtRoomFilter.id.toString(),
        startTime: this.getUTCTime(
          this.selectedOptions.dateFilter,
          this.selectedOptions.startTimeFilter
        ),
        endTime: this.getUTCTime(
          this.selectedOptions.dateFilter,
          this.selectedOptions.endTimeFilter
        ),
        hearingId
      })
    );
    this.store.dispatch(
      new SetSelectedHearingDateAction(this.selectedOptions.dateFilter.toString())
    );
    this.store.dispatch(setSelectedOptions({ selectedOptions: this.selectedOptions }));
    this.searchedOptions = { ...this.selectedOptions };
    this.showFilters = false;
  }

  loadHearingDetails(hearing: HearingSummary) {
    this.store.dispatch(new LoadHearingDetailAction(hearing.id));
    this.store.dispatch(loadHearingEventLogCountAction({ hearingId: hearing.id }));
  }

  clearSelectedTopMenu() {
    this.topMenu[0].forEach(item => (item.active = false));
    this.topMenu[0][0].active = true;
  }

  clearSelectedHearing() {
    this.selectedHearing = undefined;
  }

  clearSelectedDefendant() {
    this.selectedDefendant = undefined;
  }

  getReferralReasonForDefendant(defendant: Omit<Defendant, 'offences'>): string {
    if (defendant) {
      // Bugfix for applications
      const foundReferralReason = this.selectedHearing.defendantReferralReasons.find(
        rr => rr.defendantId === defendant.id
      );

      if (foundReferralReason) {
        return foundReferralReason.description;
      }

      return null;
    }

    return null;
  }

  noWhitespaceValidator(inputData: string) {
    return (inputData || '').trim().length !== 0 ? null : { whitespace: true };
  }

  isSaveButtonEnabled() {
    if (this.hearingEventLogEnded) {
      return false;
    }
    if (
      this.selectedAttendeeItem === 'DEFENCE' ||
      this.selectedAttendeeItem === 'COMPANY REPRESENTATIVE' ||
      this.selectedAttendeeItem === 'PROSECUTION' ||
      this.selectedAttendeeItem === 'INTERPRETER / INTERMEDIARY'
    ) {
      return this.counselValid;
    }

    if (this.applicantCounselsFormState) {
      return this.applicantCounselsFormState.valid;
    }
    if (this.respondentCounselsFormState) {
      return this.respondentCounselsFormState.valid;
    }
    return false;
  }

  changeSelectedAttendeeMenuItem(item: string) {
    this.selectedAttendeeItem = item;
    this.applicantCounselsFormState = null;
    this.respondentCounselsFormState = null;
  }

  updateProsecutionCounsel({ pc, removeIndex }: { pc?: ProsecutionCounsel; removeIndex?: number }) {
    const remove = !!removeIndex || removeIndex === 0;
    // tslint:disable-next-line: max-line-length
    this.prosecutionCounsels = this.updateCounselEntitiesAndScroll(
      this.prosecutionCounsels,
      { entity: pc, removeIndex },
      ce => ce.id === pc.id,
      remove
    ) as ProsecutionCounsel[];
    this.editedProsecution = true;
  }

  updateDefenceCounsel({ dc, removeIndex }: { dc?: DefenceCounsel; removeIndex?: number }) {
    const remove = !!removeIndex || removeIndex === 0;
    // tslint:disable-next-line: max-line-length
    this.defenceCounsels = this.updateCounselEntitiesAndScroll(
      this.defenceCounsels,
      { entity: dc, removeIndex },
      ce => ce.id === dc.id,
      remove
    ) as DefenceCounsel[];
    this.editedDefence = true;
  }

  updateIntermediaryCounsel({
    intermediary,
    removeIndex
  }: {
    intermediary: IntermediaryCounsel;
    removeIndex?: number;
  }): void {
    const remove = !!removeIndex || removeIndex === 0;
    // tslint:disable-next-line: max-line-length
    this.intermediariesCounsel = this.updateCounselEntitiesAndScroll(
      this.intermediariesCounsel,
      { entity: intermediary, removeIndex },
      ce => ce.id === intermediary.id,
      remove
    ) as IntermediaryCounsel[];
    this.editedIntemediaries = true;
  }

  updateCompanyRepresentative({
    rep,
    removeIndex
  }: {
    rep?: CompanyRepresentative;
    removeIndex?: number;
  }) {
    const remove = !!removeIndex || removeIndex === 0;
    // tslint:disable-next-line: max-line-length
    this.companyRepresentatives = this.updateCounselEntitiesAndScroll(
      this.companyRepresentatives,
      { entity: rep, removeIndex },
      ce => ce.id === rep.id,
      remove
    ) as CompanyRepresentative[];
    this.editedCompanyRepresentative = true;
  }

  handleDestroyApplicantCounsel(counsel: ApplicantCounsel) {
    this.store.dispatch(
      new SaveApplicantCounselsAction({
        hearingId: this.selectedHearing.id,
        removed: [counsel],
        added: [],
        updated: []
      })
    );
  }

  handleDestroyRespondentCounsel(counsel: RespondentCounsel) {
    this.store.dispatch(
      new SaveRespondentCounselsAction({
        hearingId: this.selectedHearing.id,
        removed: [counsel],
        added: [],
        updated: []
      })
    );
  }

  saveCounsels() {
    if (this.applicantCounselsFormState) {
      const { valid, ...deltas } = this.applicantCounselsFormState;

      this.store.dispatch(
        new SaveApplicantCounselsAction({
          hearingId: this.selectedHearing.id,
          removed: [],
          ...deltas
        })
      );
    } else if (this.respondentCounselsFormState) {
      const { valid, ...deltas } = this.respondentCounselsFormState;

      this.store.dispatch(
        new SaveRespondentCounselsAction({
          hearingId: this.selectedHearing.id,
          removed: [],
          ...deltas
        })
      );
    } else if (this.selectedHearing && this.selectedAttendeeItem === 'PROSECUTION') {
      this.saveProsecutionCounsels();
    } else if (this.selectedHearing && this.selectedAttendeeItem === 'INTERPRETER / INTERMEDIARY') {
      this.saveIntermediaryCounsels();
    } else if (this.selectedHearing && this.selectedAttendeeItem === 'DEFENCE') {
      this.saveDefenceCounsels();
    } else {
      this.saveCompanyRepresentatives();
    }

    this.showHideAttendeesPanel(false);
  }

  showCaseAlert({ url, target = '_blank' }: { url: string | string[]; target?: string }): void {
    const navigateAction = () => {
      if (Array.isArray(url)) {
        this.router.navigate(url);
      } else {
        window.open(url, target);
      }
    };

    const proceedAfterCaseAlert = () => {
      if (
        this.wofdWarningService.isWofdApplication(
          this.selectedHearing?.courtApplications?.map(app => app.type) || []
        )
      ) {
        this.wofdWarningService.showModal({
          onProceed: navigateAction
        });
      } else {
        navigateAction();
      }
    };

    this.caseAlertService.showModal({
      hearingIds: this.todayHearingListIds,
      userId: this.loggedInUser.userId,
      selectedHearingId: this.selectedHearing.id,
      urns: this.urns,
      onSubmit: proceedAfterCaseAlert
    });
  }

  viewApplication(applicationCourt: CourtApplication): void {
    let url: string;
    if (applicationCourt.linkedCaseId) {
      // tslint:disable-next-line: max-line-length
      url = `${this.configService.getBaseUrl()}/prosecution-casefile/edit-case/${
        applicationCourt.linkedCaseId
      }/application-details/${applicationCourt.id}`;
    } else if (this.caseIds && this.caseIds[0]) {
      url = `${this.configService.getBaseUrl()}/prosecution-casefile/edit-case/${
        this.caseIds[0]
      }/application-details/${applicationCourt.id}`;
    } else {
      url = `${this.configService.getBaseUrl()}/prosecution-casefile/application-details/${
        applicationCourt.id
      }`;
    }
    this.showCaseAlert({ url });
  }

  goToCaseMarkers(caseId: string): void {
    let url;
    if (this.usesApplicationAttendeeFlow) {
      url = `${this.configService.getBaseUrl()}/prosecution-casefile/edit-case/${
        this.caseIds[0]
      }/case-markers/hearing/${this.selectedHearing.id}`;
    } else {
      url = `${this.configService.getBaseUrl()}/prosecution-casefile/edit-case/${caseId}/case-markers/hearing/${
        this.selectedHearing.id
      }`;
    }
    this.window.open(url, '_blank');
  }

  goToCaseLink(hearingCaseLink: HearingCaseLink): void {
    const url = getHearingCaseUrl(this.selectedHearing.id, hearingCaseLink);
    const navigate = () =>
      this.window.open(`${this.configService.getBaseUrl()}/prosecution-casefile/${url}`, '_blank');

    if (hearingCaseLink.type === HearingCaseLinkType.APPLICATION_AT_A_GLANCE) {
      const app = this.selectedHearing?.courtApplications?.find(
        a => a.id === hearingCaseLink.applicationId
      );
      const typesToCheck = app ? [app.type] : [];

      if (this.wofdWarningService.isWofdApplication(typesToCheck)) {
        this.wofdWarningService.showModal({
          onProceed: navigate
        });
      } else {
        navigate();
      }
    } else {
      navigate();
    }
  }

  goToCaseDetails(caseId: string) {
    const url = `${this.configService.getBaseUrl()}/prosecution-casefile/case-at-a-glance/${caseId}`;

    this.showCaseAlert({ url });
  }

  goToCreateTask({ caseUrn, courtCentreId }: { caseUrn: string; courtCentreId: string }): void {
    const url = `${this.configService.getBaseUrl()}/work-management/create?caseURN=${caseUrn}&courtCentreId=${courtCentreId}`;
    this.window.open(url, '_blank');
  }

  private saveProsecutionCounsels() {
    const clonedProsecutionCounsels = cloneDeep(this.prosecutionCounsels);
    clonedProsecutionCounsels.forEach(pc => {
      pc.attendanceDays = [this.selectedhearingDate];
    });
    const prosecutionCounselsToAdd = clonedProsecutionCounsels.filter(
      pc => !this.prosecutionCounselsIds.some(a => a === pc.id)
    );

    const prosecutionCounselsToUpdate = clonedProsecutionCounsels.filter(pc =>
      this.prosecutionCounselsIds.some(a => a === pc.id)
    );

    const prosecutionCounselsToDelete = this.prosecutionCounselsIds.filter(x =>
      clonedProsecutionCounsels.every(pc => x !== pc.id)
    );

    this.store.dispatch(
      new SaveProsecutionCounselsAction({
        hearingId: this.selectedHearing.id,
        prosecutionCounselsToAdd: prosecutionCounselsToAdd,
        prosecutionCounselsToUpdate: prosecutionCounselsToUpdate,
        prosecutionCounselsToDelete: prosecutionCounselsToDelete
      })
    );
    this.editedProsecution = false;
  }

  private saveDefenceCounsels(): void {
    const clonedDefenseCounsels = cloneDeep(this.defenceCounsels).map(defenceCoun => {
      const { caseUrn, ...defenceCounWithoutCaseurn } = defenceCoun;
      return defenceCounWithoutCaseurn;
    });

    clonedDefenseCounsels.forEach(pc => {
      pc.attendanceDays = [this.selectedhearingDate];
    });

    const defenceCounselsToAdd = clonedDefenseCounsels.filter(
      dc => !this.defenceCounselIds.some(a => a === dc.id)
    );

    const defenceCounselsToUpdate = clonedDefenseCounsels.filter(dc =>
      this.defenceCounselIds.some(a => a === dc.id)
    );

    const defenceCounselsToDelete = this.defenceCounselIds.filter(dcId =>
      clonedDefenseCounsels.every(dc => dcId !== dc.id)
    );

    this.store.dispatch(
      new SaveDefenceCounselsAction({
        hearingId: this.selectedHearing.id,
        defenceCounselsToAdd: defenceCounselsToAdd,
        defenceCounselsToUpdate: defenceCounselsToUpdate,
        defenceCounselsToDelete: defenceCounselsToDelete
      })
    );
    this.editedDefence = false;
  }

  private saveIntermediaryCounsels(): void {
    const intermediariesToUpdate = this.intermediariesCounsel.map(i => {
      const intermediaryToUpdate = cloneDeep(i);

      if (intermediaryToUpdate.attendant.attendantType === AttendantType.DEFENDANTS) {
        intermediaryToUpdate.attendant.name = undefined;
      } else {
        intermediaryToUpdate.attendant.defendantId = undefined;
      }
      return intermediaryToUpdate;
    });

    const intermediaryCounselsToAdd = intermediariesToUpdate.filter(
      ic => !this.intermediariesCounselIds.some(a => a === ic.id)
    );

    const intermediaryCounselsToUpdate = intermediariesToUpdate.filter(ic =>
      this.intermediariesCounselIds.some(a => a === ic.id)
    );

    const intermediaryCounselsToDelete = this.intermediariesCounselIds.filter(ic =>
      intermediariesToUpdate.every(dc => ic !== dc.id)
    );

    this.store.dispatch(
      new SaveIntermediaryCounselsAction({
        hearingId: this.selectedHearing.id,
        added: intermediaryCounselsToAdd,
        updated: intermediaryCounselsToUpdate,
        removed: intermediaryCounselsToDelete
      })
    );

    this.editedIntemediaries = false;
  }

  private saveCompanyRepresentatives(): void {
    const clonedCompanyRepresentatives = cloneDeep(this.companyRepresentatives).map(companyRep => {
      const { caseUrn, ...companyRepWithoutCaseurn } = companyRep;
      return companyRepWithoutCaseurn;
    });

    clonedCompanyRepresentatives.forEach(pc => {
      pc.attendanceDays = [this.selectedhearingDate];
    });

    const companyRepresentativesToAdd = clonedCompanyRepresentatives.filter(
      dc => !this.companyRepresentativeIds.some(a => a === dc.id)
    );

    const companyRepresentativesToUpdate = clonedCompanyRepresentatives.filter(dc =>
      this.companyRepresentativeIds.some(a => a === dc.id)
    );

    const companyRepresentativesToDelete = this.companyRepresentativeIds.filter(dcId =>
      clonedCompanyRepresentatives.every(dc => dcId !== dc.id)
    );

    this.store.dispatch(
      new SaveCompanyRepresentativesAction({
        hearingId: this.selectedHearing.id,
        companyRepresentativesToAdd: companyRepresentativesToAdd,
        companyRepresentativesToUpdate: companyRepresentativesToUpdate,
        companyRepresentativesToDelete: companyRepresentativesToDelete
      })
    );
    this.editedCompanyRepresentative = false;
  }

  private getUTCTime(date: string | number, time: string): string {
    if (!time) {
      return '';
    }
    return this.dateUtil.toUtcISO(`${date} ${time}`, this.dateUtil.HOURS_MINUTES_24H);
  }

  /**  This method is used to update the parent counsel entities.
   * Depending on the need , it could update the parent component entity value without having to invoke chsnge detection
   *  or it could also modify a clone of a parent entity value and then invoke change detection .
   */

  private updateCounselEntitiesAndScroll(
    entities: counselEntities[],
    { entity, removeIndex }: { entity?: counselEntities; removeIndex?: number },
    indexFinderPredicate: (e: counselEntities) => boolean,
    remove = false
  ): counselEntities[] {
    const clonedEntities = [...entities];
    // delete from clone, return clone hence invoking change detection
    if (remove) {
      clonedEntities.splice(removeIndex, 1);
      return clonedEntities;
    }

    const index = entities.findIndex(indexFinderPredicate);

    // add to clone, scroll to current addition, return clone hence invoking change detection
    if (entity && index <= -1) {
      clonedEntities.push(entity);

      if (this.scrollablePanel) {
        setTimeout(() => {
          const scrollElement = this.scrollablePanel.nativeElement.querySelector('div:first-child');
          this.scrollToTargetbyId(entity.id, scrollElement);
        });
      }
      return clonedEntities;
    }

    // update parent entity , do not invoke change detection , assumes child component has updated entity value
    if (entity) {
      entities.splice(index, 1, entity);
      return entities;
    }

    return [];
  }

  scrollToTargetbyId(id: string, scrollElement: HTMLElement): void {
    const pageScrollInstance: PageScrollInstance = this.pageScrollService.create({
      document: this.document,
      scrollTarget: `#${id}`,
      scrollViews: [scrollElement]
    });
    this.pageScrollService.start(pageScrollInstance);
  }

  get topMenuDetails(): TopMenu {
    return this.topMenu
      ? this.hearingHasBulkCaseOnly
        ? [[this.topMenu[0][0]]]
        : [...this.topMenu]
      : [];
  }

  ingestIdpcs() {
    const courtCentreId = this.selectedOptions?.courtCentreFilter?.id.toString();
    const roomId = this.selectedOptions?.courtRoomFilter?.id.toString();
    const date = this.selectedOptions?.dateFilter.toString();
    this.IdpcIngestionStore.ingestIdpcs({ courtCentreId, roomId, date });
  }
}
