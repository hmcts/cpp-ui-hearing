import { Component, DestroyRef, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { select, Store } from '@ngrx/store';
import {
  ApplicationAggregate,
  clearCurrentAmendmentReason,
  clearStandaloneAncillaryResults,
  getCasesAndApplicationsIndividualDefendants,
  getCurrentHearing,
  getCurrentHearingState,
  HearingPersonDetails,
  IndividualDefendant,
  isCurrentHearingInWelshCourt,
  ListingService,
  setStandaloneAncillaryResults,
  WelshDefendantTranslate,
  HearingDetail
} from '../../core';
import { hasCitSubreason } from '../../core/selectors/user-groups';
import {
  getDraftResult,
  getHasResultsValidationErrors,
  getHearingAmendedBySelf,
  ResultsState,
  ShareResultsActions
} from '../core/store';
import { ResolvedDraftResultLine } from '../results.interfaces';
import { ModalService } from '@cpp/pdk';
import { WelshDefendantTranslateComponent } from './welsh-defendant-translate.component';
import { combineLatest, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';

import { ShareResultActionBarComponent } from './share-result-action-bar.component';
import { AsyncPipe } from '@angular/common';
import { getHearingTypes, HearingType } from '@cpp/reference-data';
import { getBookingReferencesToCheck } from './session-availability.helper';

export interface ShareValidationResult {
  hasAttendanceError: boolean;
  hasTrialEffectivenessError: boolean;
  hasSessionAvailabilityError?: boolean;
  sessionUnavailableReason?: string;
  pendingAttendanceDefendants?: HearingPersonDetails[];
}

@Component({
  selector: 'cpp-share-result-container',
  template: `
    <cpp-share-result-action-bar
      [amendedByCurrentUser]="amendedByCurrentUser$ | async"
      [draftResult]="draftResult$ | async"
      [hearing]="hearing$ | async"
      [hearingLockState]="hearingLockState$ | async"
      [individualDefendants]="individualDefendants$ | async"
      [isCurrentHearingInWelshCourt]="isCurrentHearingInWelshCourt | async"
      [isApplicationJourney]="isApplicationJourney()"
      [amendApplicationPermission]="amendApplicationPermission()"
      [caseStatus]="caseStatus()"
      [hasValidationErrors]="hasValidationErrors$ | async"
      (approveAmendments)="handleApproveAmendments()"
      (cancelAmendments)="handleCancelAmendments()"
      (rejectAmendments)="handleRejectAmendments()"
      (shareAmendments)="handleShareAmendments()"
      (shareDraftResult)="handleShareDraftResult()"
      (shareDraftResultWithWelshTranslate)="handleShareDraftResultWithWelshTranslate()"
      (standaloneAncillaryResults)="handleStandaloneAncillaryResults($event)"
    >
    </cpp-share-result-action-bar>
  `,
  imports: [ShareResultActionBarComponent, AsyncPipe],
  providers: [ModalService, ListingService]
})
export class ShareResultContainerComponent {
  pendingAttendanceDefendants = input<HearingPersonDetails[]>([]);
  isApplicationJourney = input<ApplicationAggregate[]>([]);
  amendApplicationPermission = input<boolean>(false);
  caseStatus = input<string>('');

  sharedResultsValidation = output<ShareValidationResult>();

  amendedByCurrentUser$ = this.store.pipe(select(getHearingAmendedBySelf));
  hasValidationErrors$ = this.store.pipe(select(getHasResultsValidationErrors));
  draftResult$ = this.store.pipe(select(getDraftResult));
  hearing$ = this.store.pipe(select(getCurrentHearing));
  hearingLockState$ = this.store.pipe(select(getCurrentHearingState));
  individualDefendants$ = this.store.pipe(select(getCasesAndApplicationsIndividualDefendants));
  isCurrentHearingInWelshCourt = this.store.pipe(select(isCurrentHearingInWelshCourt));
  hearingTypes$ = this.store.pipe(select(getHearingTypes));
  citSubreasonEnabled$ = this.store.pipe(select(hasCitSubreason));

  constructor(
    private store: Store<ResultsState>,
    private modalService: ModalService,
    private listingService: ListingService,
    private destroyRef: DestroyRef
  ) {}

  handleApproveAmendments() {
    this.store.dispatch(ShareResultsActions.approveAmendments());
  }

  handleCancelAmendments() {
    this.store.dispatch(clearStandaloneAncillaryResults());
    this.store.dispatch(ShareResultsActions.cancelAmendments());
    this.store.dispatch(clearCurrentAmendmentReason());
  }

  handleRejectAmendments() {
    this.store.dispatch(ShareResultsActions.rejectAmendments());
  }

  handleShareAmendments() {
    this.store.dispatch(ShareResultsActions.requestApprovalForAmendments());
  }

  private validateAndShare(
    hearing: HearingDetail,
    hearingTypes: HearingType[],
    individualDefendants: IndividualDefendant[],
    withWelshTranslate: boolean = false,
    citSubreasonEnabled: boolean = false
  ): void {
    const hasAttendanceError =
      (this.pendingAttendanceDefendants() || []).length > 0 && !this.isFirstHearing();

    const isTrialApp = this.checkIfTrialApplication(hearing, hearingTypes);
    const trialEffectivenessSelected = this.checkTrialEffectiveness(
      hearing,
      hearingTypes,
      citSubreasonEnabled
    );
    const hasTrialEffectivenessError =
      citSubreasonEnabled && isTrialApp && !trialEffectivenessSelected;

    this.sharedResultsValidation.emit({
      hasAttendanceError,
      hasTrialEffectivenessError,
      pendingAttendanceDefendants: hasAttendanceError
        ? this.pendingAttendanceDefendants()
        : undefined
    });

    if (hasAttendanceError || hasTrialEffectivenessError) {
      return;
    }

    this.validateSessionAvailabilityAndShare(withWelshTranslate, individualDefendants);
  }

  private validateSessionAvailabilityAndShare(
    withWelshTranslate: boolean,
    individualDefendants: IndividualDefendant[]
  ): void {
    this.draftResult$
      .pipe(
        take(1),
        switchMap(draftResult => {
          const bookingReferences = getBookingReferencesToCheck(draftResult);

          if (bookingReferences.length === 0) {
            return of({ blocked: false as const });
          }

          return this.listingService.getBookingStatus(bookingReferences).pipe(
            map(response => {
              const unsafe = (response?.bookings ?? []).filter(b => b.safeToShare === false);
              // status: 'UNKNOWN' means listing could not reach courtscheduler; it answers
              // safeToShare: true for that case, so it naturally falls through here and does
              // not block - an advisory check must not block a share on a transient blip.
              return unsafe.length === 0
                ? { blocked: false as const }
                : { blocked: true as const, status: unsafe[0].status };
            }),
            // Fails open deliberately: if the booking-status call itself errors (network,
            // 5xx, unreachable, etc.) we must not block every Crown share in the building for
            // an advisory check over a transient failure - the share still validates
            // server-side. Do not "tighten" this to rethrow.
            catchError(() => of({ blocked: false as const }))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        if (result.blocked) {
          this.sharedResultsValidation.emit({
            hasAttendanceError: false,
            hasTrialEffectivenessError: false,
            hasSessionAvailabilityError: true,
            sessionUnavailableReason: result.status
          });
        } else {
          this.proceedWithResultShare(withWelshTranslate, individualDefendants);
        }
      });
  }

  private proceedWithResultShare(
    withWelshTranslate: boolean,
    individualDefendants: IndividualDefendant[]
  ): void {
    if (withWelshTranslate) {
      this.shareWithWelshTranslation(individualDefendants!);
    } else {
      this.store.dispatch(ShareResultsActions.shareDraftResult());
      this.store.dispatch(clearCurrentAmendmentReason());
    }
  }

  private async shareWithWelshTranslation(
    individualDefendants: IndividualDefendant[]
  ): Promise<void> {
    const selectedDefendants = await this.selectWelshTranslations(individualDefendants);

    if (selectedDefendants) {
      this.store.dispatch(
        ShareResultsActions.shareDraftResultWithWelshTranslate({ payload: selectedDefendants })
      );
    }

    this.store.dispatch(clearCurrentAmendmentReason());
  }

  handleShareDraftResult() {
    combineLatest([this.hearing$, this.hearingTypes$, this.citSubreasonEnabled$])
      .pipe(take(1))
      .subscribe(([hearing, hearingTypes, citSubreasonEnabled]) => {
        this.validateAndShare(hearing, hearingTypes, undefined, false, citSubreasonEnabled);
      });
  }

  handleShareDraftResultWithWelshTranslate() {
    combineLatest([
      this.individualDefendants$,
      this.hearing$,
      this.hearingTypes$,
      this.citSubreasonEnabled$
    ])
      .pipe(take(1))
      .subscribe(([individualDefendants, hearing, hearingTypes, citSubreasonEnabled]) => {
        this.validateAndShare(
          hearing,
          hearingTypes,
          individualDefendants,
          true,
          citSubreasonEnabled
        );
      });
  }

  handleStandaloneAncillaryResults(standaloneAncillaryResults: ResolvedDraftResultLine[]) {
    this.store.dispatch(setStandaloneAncillaryResults({ standaloneAncillaryResults }));
  }

  isFirstHearing() {
    if (!this.isApplicationJourney() || this.isApplicationJourney().length === 0) {
      return false;
    }

    const applications = this.isApplicationJourney()
      .reduce((acc, { applications }) => [...acc, ...applications], [])
      .filter(app => !app.parentApplicationId);

    if (applications.length === 0) {
      return false;
    }

    return applications.every(app => app.type.linkType === 'FIRST_HEARING');
  }

  private selectWelshTranslations(
    individualDefendants: IndividualDefendant[]
  ): Promise<WelshDefendantTranslate[] | false> {
    return new Promise(resolve => {
      const modalRef = this.modalService.open(WelshDefendantTranslateComponent, {
        width: 660,
        data: {
          defendants: individualDefendants,
          onSubmit: (formValue: WelshDefendantTranslate[]) => {
            modalRef.dispose();
            resolve(formValue);
          },
          onCancel: () => {
            modalRef.dispose();
            resolve(false);
          }
        }
      });
    });
  }

  private checkIfTrialApplication(hearing: HearingDetail, hearingTypes: HearingType[]): boolean {
    if (!hearing || !hearing.type || !hearingTypes) return false;
    const hearingType = hearingTypes.find((type: HearingType) => type.id === hearing.type.id);

    if (hearingType) {
      if (hearingType.trialTypeFlag !== undefined) {
        return hearingType.trialTypeFlag;
      }
    }
    return false;
  }

  private checkTrialEffectiveness(
    hearing: HearingDetail,
    hearingTypes: HearingType[],
    citSubreasonEnabled: boolean
  ): boolean {
    if (!hearing || !hearingTypes) {
      return false;
    }

    const hearingType = hearingTypes.find((type: HearingType) => type.id === hearing.type?.id);
    const isTrialHearing = hearingType?.trialTypeFlag;

    if (!isTrialHearing || hearing.isEffectiveTrial != null || hearing.isVacatedTrial) {
      return true;
    }

    if (hearing.crackedIneffectiveTrial) {
      const hasId = !!hearing.crackedIneffectiveTrial.id;
      const hasValue = !!hearing.crackedIneffectiveTrial.value;
      const hasDescription = !!hearing.crackedIneffectiveTrial.reasonShortDescription;
      const hasSubReasonId = !!hearing.crackedIneffectiveTrial.crackedIneffectiveSubReasonId;
      if ((hasId || hasValue || hasDescription) && (!citSubreasonEnabled || hasSubReasonId)) {
        return true;
      }
    }

    return false;
  }
}
