import { Component, input, output } from '@angular/core';
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
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';

import { ShareResultActionBarComponent } from './share-result-action-bar.component';
import { AsyncPipe } from '@angular/common';
import { getHearingTypes, HearingType } from '@cpp/reference-data';

export interface ShareValidationResult {
  hasAttendanceError: boolean;
  hasTrialEffectivenessError: boolean;
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
  providers: [ModalService]
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

  constructor(private store: Store<ResultsState>, private modalService: ModalService) {}

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
    if (withWelshTranslate) {
      this.shareWithWelshTranslation(individualDefendants);
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
