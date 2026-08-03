import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ModalService,
  PdkButtonGroupComponent,
  PdkButtonComponent,
  PdkButtonDirective
} from '@cpp/pdk';
import {
  ApplicationAggregate,
  CourtApplication,
  HearingDetail,
  HearingLockState,
  IndividualDefendant
} from '../../core';
import {
  filterResults,
  getResultBelongsToOptionalBranch,
  getTargetId,
  getTargetsForHearing,
  isActiveDraftResultLine,
  isDirtyDraftResultLine,
  isShareableDraftResultLine,
  validateAncillaryResults,
  validateDraftResult
} from '../core/helpers';
import { DraftResult, ResolvedDraftResultLine } from '../results.interfaces';
import {
  ShareResultConfirmationData,
  ShareResultConfirmationFormComponent
} from './share-result-confirmation-form.component';

@Component({
  selector: 'cpp-share-result-action-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (hasAvailableActions) {
    <pdk-button-group>
      @if (canAdjudicateAmendments) {
      <button pdk-button (click)="approveAmendments.emit()">Validate amendments</button>
      } @if (canAdjudicateAmendments) {
      <button pdk-button="secondary" (click)="rejectAmendments.emit()">Reject amendments</button>
      } @if (canRequestApproval) {
      <button pdk-button (click)="handleShareAmendedDraftResult()">Request approval</button>
      } @if (canShareUnlockedDraftResult) {
      <button
        pdk-button
        (click)="
          requireWelshTranslation
            ? handleShareDraftResultWithWelshTranslate()
            : handleShareDraftResult()
        "
      >
        Share with relevant parties
      </button>
      } @if (canCancelAmendments) {
      <button pdk-button="secondary" (click)="cancelAmendments.emit()">Cancel amendments</button>
      }
    </pdk-button-group>
    }
  `,
  imports: [PdkButtonGroupComponent, PdkButtonComponent, PdkButtonDirective],
  providers: [ModalService]
})
export class ShareResultActionBarComponent {
  @Input() amendedByCurrentUser = false;
  @Input()
  set draftResult(draftResult: DraftResult) {
    const activeShareableResults = filterResults(
      draftResult,
      ({ resultLine }) =>
        isActiveDraftResultLine(resultLine) && isShareableDraftResultLine(draftResult, resultLine)
    );
    const unsharedDirtyResults = filterResults(
      draftResult,
      ({ resultLine }) =>
        isDirtyDraftResultLine(resultLine) &&
        !getResultBelongsToOptionalBranch(draftResult, resultLine.resultLineId)
    );

    this.draftResultValid = validateDraftResult(draftResult);
    this.draftResultDirty = unsharedDirtyResults.length > 0;
    this.targetIdsWithActiveShareableResults = activeShareableResults.map(({ resultLine }) =>
      getTargetId(resultLine)
    );

    this.nonValidAncillaryResults = validateAncillaryResults(activeShareableResults);
  }
  @Input()
  set hearing(hearing: HearingDetail) {
    this.targetIdsForHearing = getTargetsForHearing(hearing).map(target => target.id);
  }
  @Input() hearingLockState: HearingLockState;
  @Input() individualDefendants: IndividualDefendant[];
  @Input() isCurrentHearingInWelshCourt: boolean;
  @Input() isApplicationJourney: ApplicationAggregate[];
  @Input() amendApplicationPermission: boolean;
  @Input() caseStatus: string;
  @Input() hasValidationErrors = false;
  @Output() approveAmendments = new EventEmitter();
  @Output() cancelAmendments = new EventEmitter();
  @Output() rejectAmendments = new EventEmitter();
  @Output() shareAmendments = new EventEmitter();
  @Output() shareDraftResult = new EventEmitter();
  @Output() shareDraftResultWithWelshTranslate = new EventEmitter<void>();
  @Output() standaloneAncillaryResults = new EventEmitter<ResolvedDraftResultLine[]>();

  constructor(private modalService: ModalService) {}

  private draftResultValid = false;
  // Because the `hearingLockState` is governed by all hearing days for a
  // multi-day hearing, we cannot rely on it explicitly to know if there are any
  // amend/share actions available to this particular hearing day. Therefore, we
  // must determine whether this hearing day has any results still awaiting
  // sharing before deferring to the lock state.
  private draftResultDirty = false;
  private nonValidAncillaryResults: ResolvedDraftResultLine[] = [];
  private targetIdsForHearing: string[] = [];
  private targetIdsWithActiveShareableResults: string[] = [];

  // When approval has been requested by the amending user when resharing
  // results, any user other than the amending user can adjudicate them (i.e.
  // validate or reject).
  get canAdjudicateAmendments(): boolean {
    return (
      this.hearingLockState === HearingLockState.APPROVAL_REQUESTED && !this.amendedByCurrentUser
    );
  }

  // When a hearing has been locked for amendments, these amendments can be
  // cancelled only by the amending user. Upon cancellation, the draft result
  // will be reverted to its last shared state.
  get canCancelAmendments(): boolean {
    return (
      this.amendedByCurrentUser &&
      [
        HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR,
        HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR
      ].includes(this.hearingLockState)
    );
  }

  // When a hearing has been locked for amendments due to an admin error when
  // recording the results, approval must be requested by the amending user.
  // Note that the draft result must be in a shareable state (i.e. completely
  // valid) before this can be performed.
  get canRequestApproval(): boolean {
    return (
      this.draftResultValid &&
      (this.hearingLockState === HearingLockState.SHARED_AMEND_LOCKED_ADMIN_ERROR ||
        this.hearingLockState === HearingLockState.SHARED_AMEND_LOCKED_USER_ERROR) &&
      this.amendedByCurrentUser
    );
  }

  // When a hearing has no outstanding adjudication, it can be shared by either
  // the amending user or any other user
  get canShareUnlockedDraftResult(): boolean {
    return (
      this.draftResultValid &&
      !this.hasValidationErrors &&
      [HearingLockState.VALIDATED, HearingLockState.INITIALISED, HearingLockState.SHARED].includes(
        this.hearingLockState
      )
    );
  }

  get hasAvailableActions(): boolean {
    return (
      this.draftResultDirty &&
      (this.canAdjudicateAmendments ||
        this.canCancelAmendments ||
        this.canRequestApproval ||
        this.canShareUnlockedDraftResult)
    );
  }

  get requireWelshTranslation(): boolean {
    return this.isCurrentHearingInWelshCourt && this.individualDefendants.length > 0;
  }

  // When one or more targets are not being resulted as a consequence of
  // (re)sharing this hearing, then raise a confirmation dialog
  private get requireConfirmation(): boolean {
    if (this.amendApplicationPermission) {
      return (
        (!this.courtApplicationFinalised ||
          (this.courtApplicationFinalised && this.applicationAmendAllowed)) &&
        this.targetIdsForHearing.some(
          targetId => !this.targetIdsWithActiveShareableResults.includes(targetId)
        )
      );
    }
    return this.targetIdsForHearing.some(
      targetId => !this.targetIdsWithActiveShareableResults.includes(targetId)
    );
  }

  private validateAncillaryResults(): boolean {
    if (this.nonValidAncillaryResults.length > 0) {
      this.standaloneAncillaryResults.emit(this.nonValidAncillaryResults);
      return false;
    }
    return true;
  }

  handleShareAmendedDraftResult = async () => {
    if (!this.validateAncillaryResults()) return;
    if (!this.requireConfirmation || (await this.confirmShareDraftResult())) {
      this.shareAmendments.emit();
    }
  };

  handleShareDraftResult = async () => {
    if (!this.validateAncillaryResults()) return;
    if (!this.requireConfirmation || (await this.confirmShareDraftResult())) {
      this.shareDraftResult.emit();
    }
  };

  handleShareDraftResultWithWelshTranslate = async () => {
    if (!this.validateAncillaryResults()) return;
    if (!this.requireConfirmation || (await this.confirmShareDraftResult())) {
      this.shareDraftResultWithWelshTranslate.emit();
    }
  };

  private confirmShareDraftResult(): Promise<boolean> {
    return new Promise(resolve => {
      const modalRef = this.modalService.open(ShareResultConfirmationFormComponent, {
        data: {
          onCancel: () => {
            modalRef.dispose();
            resolve(false);
          },
          onSubmit: () => {
            modalRef.dispose();
            resolve(true);
          }
        } as ShareResultConfirmationData
      });
    });
  }

  get courtApplications() {
    const applications = (this.isApplicationJourney || [])
      .reduce((acc, { applications }) => [...acc, ...applications], [])
      .filter(app => !app.parentApplicationId);

    return applications;
  }
  get courtApplicationFinalised() {
    return (
      this.courtApplications &&
      this.courtApplications.some(
        courtApplication => courtApplication.applicationStatus === 'FINALISED'
      )
    );
  }

  get applicationAmendAllowed() {
    return (
      this.courtApplications &&
      this.courtApplications.some(
        (courtApplication: CourtApplication) => courtApplication?.amendmentAllowed
      )
    );
  }
}
