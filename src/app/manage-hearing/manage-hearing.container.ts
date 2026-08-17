import { ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ValidationError,
  PdkVisuallyHiddenDirective,
  PdkGridComponent,
  PdkGridDirective,
  PdkErrorSummaryComponent,
  PdkCheckboxComponent,
  PdkMarginDirective
} from '@cpp/pdk';
import { CourtApplicationType, getHearingTypes, HearingType } from '@cpp/reference-data';
import { getUserDetails, UserDetails } from '@cpp/users-groups';
import { select, Store } from '@ngrx/store';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { AppConfigService } from '../config';
import {
  ApplicationAggregate,
  canUserAmendHearing,
  clearStandaloneAncillaryResults,
  CourtApplication,
  DefendantCasesApplications,
  getCasesAndApplicationsGroupedByDefendant,
  getCurrentHearing,
  getCurrentHearingState,
  getCurrentHearingType,
  getCurrentHearingUrnList,
  getFilteredApplications,
  getGuiltyPleasValues,
  getHasApiActivity,
  getHearingHasBulkCaseOnly,
  getIsGroupCaseApplication,
  getIsLegalAdviserUser,
  getPermissionIdFromMap,
  getPleasMapping,
  getSelectedHearingDate,
  getTodayHearingListIds,
  getTodaysDefendantsAttendance,
  getVerdictTypes,
  HearingDetail,
  HearingLockState,
  HearingPersonDetails,
  LoadVerdictsTypesAction,
  Offence,
  setTrialEffectivenessError,
  TodaysDefendantAttendance,
  toggleSittingYouthCourt,
  UpdateDefendantAttendance,
  UpdatePresenceAction,
  VerdictType
} from '../core';
import { CreateCourtOrdersAction } from '../core/actions/court-orders';
import { DefendantBreachApplication } from '../core/model/breach-application';
import { ActiveCourtOrderByDefendantId } from '../core/model/court-orders';
import {
  caseStatus,
  getActiveOrdersExcludeForCurrentHearing,
  getCommissionOfNewOffenceBreachApplicationTypes,
  getCurrentHearingCasesAndApplicationsDefendants,
  getStandaloneAncillaryResults,
  isPleaApplicable,
  isTierAndListTypeRequired,
  isVerdictsPageAvailable,
  selectTrialEffectivenessError
} from '../core/selectors';
import { OutstandingFineDefendantDetails } from '../outstanding-fines/outstanding-fines.interfaces';
import {
  buildShareValidationErrorSummary,
  getTargetsForHearing,
  Target
} from '../results/core/helpers';
import {
  getDefendantLevelWarningMessages,
  getOffenceLevelWarningMessages,
  getShareResultsValidationFailure,
  ResultsState
} from '../results/core/store';
import { OffenceLike, ResolvedDraftResultLine } from '../results/results.interfaces';
import { ValidationMessage } from '../results/results-validation.interfaces';
import { canAmendApplication, hasResultingAssistant } from '../core/selectors/user-groups';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExtendMagistratesAccessComponent } from './extend-magistrates-access/extend-magistrates-access.component';
import { CaseAccessAlertComponent } from '../case-access-alert/case-access-alert.component';
import { HearingResultsListComponent } from './hearing-results-list/hearing-results-list.component';
import { ApplicationResultDetailsContainer } from './application-results-details/application-result-details.container';
import {
  ShareResultContainerComponent,
  ShareValidationResult
} from '../results/share-results/share-result.container';
@Component({
  selector: 'manage-hearing',
  templateUrl: './manage-hearing.container.html',
  styleUrls: ['./manage-hearing.container.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PdkVisuallyHiddenDirective,
    PdkGridComponent,
    PdkGridDirective,
    PdkErrorSummaryComponent,
    PdkCheckboxComponent,
    FormsModule,
    PdkMarginDirective,
    ExtendMagistratesAccessComponent,
    CaseAccessAlertComponent,
    HearingResultsListComponent,
    ApplicationResultDetailsContainer,
    ShareResultContainerComponent,
    AsyncPipe,
    TranslatePipe
  ]
})
export class ManageHearingContainer implements OnDestroy, OnInit {
  canUserAmendHearing$: Observable<boolean>;
  verdictTypes$: Observable<VerdictType[]>;
  hearingType$: Observable<string>;
  hasApiActivity$: Observable<boolean>;
  todayHearingListIds$: Observable<string[]>;
  bulkCaseOnly$: Observable<boolean>;
  isGroupCaseApplication$: Observable<boolean>;
  loggedInUser: UserDetails;
  urns$: Observable<string[]>;
  casesAndApplicationsGroupedByDefendant$: Observable<DefendantCasesApplications[]>;
  caseStatus$: Observable<string>;
  courtApplications$: Observable<ApplicationAggregate[]>;
  pleasMapping$: Observable<{ [key: string]: string }>;
  guiltyPleasValues$: Observable<string[]>;
  destroy$: Subject<boolean> = new Subject<boolean>();
  hearing$: Observable<HearingDetail>;
  defendantsNames$: Observable<HearingPersonDetails[]>;
  hearingState$: Observable<HearingLockState>;
  todaysDefendantsAttendance$: Observable<TodaysDefendantAttendance[]>;
  selectedHearingDate: string;
  selectedHearingId: string;
  hearingAccessPermissionId$: Observable<string>;
  isLegalAdviser$: Observable<boolean>;
  reasonOptions: { label: string; value: string }[] = [];
  activeCourtOrders$: Observable<ActiveCourtOrderByDefendantId>;
  breachTypes$: Observable<CourtApplicationType[]>;
  earliestNextHearingDate: string;
  isAllSelected: Observable<boolean>;
  translateSubscription: Subscription;
  translated: { [key: string]: string };
  errors: ValidationError[] = [];
  trialEffectivenessError: ValidationError[] | null = null;
  shareValidationErrors: ValidationError[] = [];
  isTrialApplication$: Observable<boolean>;

  pendingAttendanceDefendants$: Observable<HearingPersonDetails[]>;
  isPleaApplicableFlag$: Observable<boolean>;
  isVerdictsPageAvailable$: Observable<boolean>;
  isFirstHearing$: Observable<boolean>;
  reminders$: Observable<{ attendance: boolean; tierAndListType: boolean }>;
  isAmendApplicationPermission$: Observable<boolean>;
  hasResultingAssistant$: Observable<boolean>;
  offenceLevelWarningMessages$: Observable<Map<string, ValidationMessage[]>>;
  defendantLevelWarningMessages$: Observable<Map<string, ValidationMessage[]>>;
  targetsForHearing: Target[];
  participant: string;

  get attendanceErrors(): ValidationError[] {
    return this.errors.filter(e => !e.message.endsWith(this.ancillaryErrorMessage));
  }

  private readonly ancillaryErrorMessage =
    'result must include a final or interim result before it can be shared';

  constructor(
    private store: Store<ResultsState>,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private appConfigService: AppConfigService,
    private translateService: TranslateService,
    @Inject('Window') private window: Window
  ) {
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.selectedHearingId = params['hearingId'];
    });

    this.store.dispatch(new LoadVerdictsTypesAction());
  }

  ngOnInit(): void {
    this.translateSubscription = this.translateService
      .get([
        'MANAGE_HEARING.PRESENCE_NOT_YET_ENTERED',
        'MANAGE_HEARING.TRIAL_EFFECTIVENESS_REQUIRED'
      ])
      .subscribe(values => {
        this.translated = {
          PRESENCE_NOT_YET_ENTERED: values['MANAGE_HEARING.PRESENCE_NOT_YET_ENTERED'],
          TRIAL_EFFECTIVENESS_REQUIRED: values['MANAGE_HEARING.TRIAL_EFFECTIVENESS_REQUIRED']
        };
      });

    this.hearingType$ = this.store.pipe(select(getCurrentHearingType));

    this.todaysDefendantsAttendance$ = this.store.pipe(select(getTodaysDefendantsAttendance));

    this.store.pipe(select(getSelectedHearingDate), takeUntil(this.destroy$)).subscribe(date => {
      this.selectedHearingDate = date;
    });

    this.hasApiActivity$ = this.store.pipe(select(getHasApiActivity));

    this.canUserAmendHearing$ = this.store.pipe(select(canUserAmendHearing));

    this.verdictTypes$ = this.store.pipe(select(getVerdictTypes));

    this.casesAndApplicationsGroupedByDefendant$ = this.store.pipe(
      select(getCasesAndApplicationsGroupedByDefendant)
    );

    this.caseStatus$ = this.store.pipe(select(caseStatus));

    this.courtApplications$ = this.store.pipe(select(getFilteredApplications));

    this.todayHearingListIds$ = this.store.pipe(select(getTodayHearingListIds));
    this.hearing$ = this.store.pipe(select(getCurrentHearing));
    this.defendantsNames$ = this.store.pipe(
      select(getCurrentHearingCasesAndApplicationsDefendants)
    );
    this.hearing$ = this.store.pipe(
      select(getCurrentHearing),
      tap(hearing => {
        this.earliestNextHearingDate = hearing.earliestNextHearingDate;
        this.targetsForHearing = getTargetsForHearing(hearing);
      })
    );

    this.hearingState$ = this.store.pipe(select(getCurrentHearingState));
    this.store.pipe(select(getUserDetails), takeUntil(this.destroy$)).subscribe(userInfo => {
      this.loggedInUser = userInfo;
    });

    this.urns$ = this.store.pipe(select(getCurrentHearingUrnList));
    this.pleasMapping$ = this.store.pipe(select(getPleasMapping));
    this.guiltyPleasValues$ = this.store.pipe(select(getGuiltyPleasValues));
    this.hearingAccessPermissionId$ = this.store.pipe(
      select(getPermissionIdFromMap('Extend', 'HearingAccess', this.selectedHearingId))
    );
    this.isLegalAdviser$ = this.store.pipe(select(getIsLegalAdviserUser));

    this.activeCourtOrders$ = this.store.pipe(select(getActiveOrdersExcludeForCurrentHearing));
    this.breachTypes$ = this.store.pipe(select(getCommissionOfNewOffenceBreachApplicationTypes));

    this.isAllSelected = combineLatest([this.hearing$, this.defendantsNames$]).pipe(
      map(([hearing, defendants]) => {
        const youthCourtDefIds = [...(hearing.youthCourtDefendantIds || [])].sort();
        const allDefendantIds = [...defendants.map(defendant => defendant.defendantId)].sort();

        return youthCourtDefIds.join(',') === allDefendantIds.join(',');
      })
    );
    this.bulkCaseOnly$ = this.store.pipe(select(getHearingHasBulkCaseOnly));
    this.isGroupCaseApplication$ = this.store.pipe(select(getIsGroupCaseApplication));

    this.pendingAttendanceDefendants$ = combineLatest([this.hearing$, this.defendantsNames$]).pipe(
      map(([hearing, defendantsNames]) => {
        const completedAttendanceDefendantIds = hearing.defendantAttendance.map(
          def => def.defendantId
        );

        if (!!hearing.prosecutionCases && hearing.prosecutionCases.length > 0) {
          hearing.prosecutionCases.forEach(pcases => {
            completedAttendanceDefendantIds.forEach(defId => {
              const defendant = pcases.defendants.find(def => def.id === defId);
              if (defendant && !!defendant.masterDefendantId) {
                completedAttendanceDefendantIds.push(defendant.masterDefendantId);
              }
            });
          });
        } else {
          !!hearing.courtApplications &&
            hearing.courtApplications.length > 0 &&
            hearing.courtApplications.forEach(courtApplication => {
              completedAttendanceDefendantIds.forEach(defId => {
                const defendant = courtApplication.subject.masterDefendant;
                const defendantId = defendant.masterDefendantId;
                if (defendantId === defId) {
                  completedAttendanceDefendantIds.push(defendantId);
                }
              });
            });
        }

        return defendantsNames.filter(
          el =>
            !completedAttendanceDefendantIds.includes(el.defendantId) &&
            !completedAttendanceDefendantIds.includes(el.masterDefendantId)
        );
      })
    );

    this.isPleaApplicableFlag$ = this.store.pipe(select(isPleaApplicable));
    this.isVerdictsPageAvailable$ = this.store.pipe(select(isVerdictsPageAvailable));

    this.store
      .pipe(select(getStandaloneAncillaryResults), takeUntil(this.destroy$))
      .subscribe(standaloneAncillaryResults => {
        this.setStandaloneAncillaryResultsErrors(standaloneAncillaryResults);
      });

    this.isFirstHearing$ = this.courtApplications$.pipe(
      map(applications => {
        const courtApplications = (applications || [])
          .reduce((acc, { applications }) => [...acc, ...applications], [])
          .filter(app => !app.parentApplicationId);
        return (
          courtApplications.length > 0 &&
          courtApplications.every(app => app.type.linkType === 'FIRST_HEARING')
        );
      })
    );

    this.reminders$ = combineLatest([
      this.pendingAttendanceDefendants$,
      this.isFirstHearing$,
      this.store.pipe(select(isTierAndListTypeRequired))
    ]).pipe(
      map(([pendingAttendanceDefendants, isFirstHearing, tierAndListTypeRequired]) => ({
        attendance: pendingAttendanceDefendants?.length > 0 && isFirstHearing === false,
        tierAndListType: tierAndListTypeRequired
      }))
    );

    this.isAmendApplicationPermission$ = this.store.pipe(select(canAmendApplication));
    this.hasResultingAssistant$ = this.store.pipe(select(hasResultingAssistant));
    this.offenceLevelWarningMessages$ = this.store.pipe(select(getOffenceLevelWarningMessages));
    this.defendantLevelWarningMessages$ = this.store.pipe(select(getDefendantLevelWarningMessages));

    this.store
      .pipe(select(selectTrialEffectivenessError), takeUntil(this.destroy$))
      .subscribe(error => {
        this.trialEffectivenessError = error;
      });

    this.store
      .pipe(select(getShareResultsValidationFailure), takeUntil(this.destroy$))
      .subscribe(shareResultsValidationFailure => {
        this.shareValidationErrors = buildShareValidationErrorSummary(
          shareResultsValidationFailure
        );
        if (this.shareValidationErrors.length > 0) {
          this.window.scroll(0, 0);
        }
      });

    this.isTrialApplication$ = combineLatest([
      this.store.pipe(select(getCurrentHearing)),
      this.store.pipe(select(getHearingTypes))
    ]).pipe(map(([hearing, hearingTypes]) => this.checkIfTrialApplication(hearing, hearingTypes)));
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.translateSubscription.unsubscribe();
    this.store.dispatch(clearStandaloneAncillaryResults());
  }

  onPresenceChanged(data: any): void {
    const body: UpdateDefendantAttendance = {
      hearingId: this.selectedHearingId,
      defendantId: data.defendantId,
      attendanceDay: {
        day: this.selectedHearingDate,
        attendanceType: data.selectedOption
      }
    };
    this.errors = this.errors.filter(e => e.message.endsWith(this.ancillaryErrorMessage));

    this.store.dispatch(new UpdatePresenceAction(body));
  }

  navigateToAction(action: string): void {
    this.router.navigate([`/manage/${this.selectedHearingId}/${action}`]).then(() => {
      this.window.scroll(0, 0);
    });
  }

  outstandingFine(defendantDetails: OutstandingFineDefendantDetails): void {
    const appUrl = this.appConfigService.getBaseUrl();
    let url: string;
    if (defendantDetails.name) {
      const { defendantId, name } = defendantDetails;
      url = `${appUrl}/hearing/outstanding-fines/defendant/${defendantId}?defendantFirstName=${name}&isSJPCase=false`;
    } else {
      const { defendantId, firstName, lastName } = defendantDetails;
      url = `${appUrl}/hearing/outstanding-fines/defendant/${defendantId}?defendantFirstName=${firstName}&defendantLastName=${lastName}&isSJPCase=false`;
    }
    window.open(url, '_blank');
  }

  selectedParticipant($event: string) {
    this.participant = $event;
  }

  onBreachApplications(defendantBreach: DefendantBreachApplication) {
    this.store.dispatch(new CreateCourtOrdersAction(defendantBreach));
  }

  youthCourtToggle(defendantId?: string): void {
    if (defendantId) {
      this.store.dispatch(toggleSittingYouthCourt({ defendantId }));
    } else {
      this.store.dispatch(toggleSittingYouthCourt({ isToggleAll: true }));
    }
  }

  missingAttendanceHandler(pendingAttendanceDefendants: HearingPersonDetails[]): void {
    if (pendingAttendanceDefendants.length > 0) {
      const pendingDefendantNames = pendingAttendanceDefendants
        .map(def => `${def.firstName} ${def.lastName}`)
        .join(', ');
      this.errors = [
        {
          id: 'defendant-presence',
          message: `${pendingDefendantNames} ${this.translated.PRESENCE_NOT_YET_ENTERED}`
        }
      ];
      this.window.scroll(0, 0);
    }
  }

  hasErrors(): boolean {
    return this.getAllErrors()?.length > 0;
  }

  getAllErrors(): ValidationError[] {
    const combined = [...this.errors, ...this.shareValidationErrors];
    if (this.trialEffectivenessError && Array.isArray(this.trialEffectivenessError)) {
      combined.push(...this.trialEffectivenessError);
    }
    return combined;
  }

  onTrialEffectivenessMissing() {
    const error = [
      {
        id: 'trial-effectiveness',
        message: `${this.translated.TRIAL_EFFECTIVENESS_REQUIRED}`
      }
    ];
    this.store.dispatch(setTrialEffectivenessError({ error }));
    this.window.scroll(0, 0);
  }

  clearTrialEffectivenessError() {
    this.store.dispatch(setTrialEffectivenessError({ error: null }));
  }

  onTrialTypeChanged() {
    this.clearTrialEffectivenessError();
  }

  private checkIfTrialApplication(hearing: HearingDetail, hearingTypes: HearingType[]): boolean {
    if (!hearing || !hearing.type || !hearingTypes) return false;

    const hearingType = hearingTypes.find((type: HearingType) => type.id === hearing.type.id);

    if (hearingType) {
      if (hearingType.trialTypeFlag !== undefined) {
        return hearingType.trialTypeFlag === true;
      }
    }
    return false;
  }

  onClearAttendanceError() {
    this.errors = [];
  }

  onClearTrialEffectivenessError() {
    this.store.dispatch(setTrialEffectivenessError({ error: null }));
  }

  handleSharedResultsValidation(result: ShareValidationResult): void {
    this.errors = [];
    this.clearTrialEffectivenessError();

    if (result.hasAttendanceError && result.pendingAttendanceDefendants) {
      this.missingAttendanceHandler(result.pendingAttendanceDefendants);
    }

    if (result.hasTrialEffectivenessError) {
      this.onTrialEffectivenessMissing();
    }
  }

  private setStandaloneAncillaryResultsErrors(
    standaloneAncillaryResults: ResolvedDraftResultLine[]
  ): void {
    const standaloneErrors = (standaloneAncillaryResults || []).reduce((errors, resultLine) => {
      let offenceOrApplicationTitle: string;
      const offenceLikeResult = resultLine as OffenceLike<ResolvedDraftResultLine>;
      if (offenceLikeResult.offenceId) {
        offenceOrApplicationTitle = (
          this.targetsForHearing.find(
            target => target.id === offenceLikeResult.offenceId
          ) as Offence
        ).offenceTitle;
      } else {
        offenceOrApplicationTitle = (
          this.targetsForHearing.find(
            target => target.id === resultLine.applicationId
          ) as CourtApplication
        ).type.type;
      }

      return [
        ...errors,
        {
          id: `${resultLine.resultLineId}`,
          rule: 'nonStandAloneAncillaryError',
          message: `${offenceOrApplicationTitle}: ${this.ancillaryErrorMessage}`,
          shouldFocus: true
        } as ValidationError
      ];
    }, [] as ValidationError[]);
    this.errors = standaloneErrors;
  }

  protected readonly Object = Object;
}
