import { Injectable } from '@angular/core';
import moment from 'moment';
import { BaseModalAlertService } from '../core/services/alert/base-modal-alert.service';
import { CaseAccessModalComponent } from './case-access-modal.component';

const CASE_ACCESS_KEY = 'accessAlert';
const CASE_ACCESS_ONE_TIME_KEY = 'accessAlertOneTime';

interface CaseAccessDetails {
  userId: string;
  hearingIds: string[];
  expires: number;
}

interface OneTimeStatus {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CaseAccessAlertService extends BaseModalAlertService {
  private isOneTimeActive: OneTimeStatus = {};
  private getSavedDetails(accessKey = CASE_ACCESS_KEY): CaseAccessDetails | null {
    const json = localStorage.getItem(accessKey);
    if (json) {
      return JSON.parse(json) as CaseAccessDetails;
    }

    return null;
  }

  private checkForOneTimeAccess(
    hearingIds: string[],
    userId: string,
    selectedHearingId?: string
  ): boolean {
    const oneTimeDetails: CaseAccessDetails = this.getSavedDetails(CASE_ACCESS_ONE_TIME_KEY);

    let isOnTime = false;
    if (
      oneTimeDetails &&
      oneTimeDetails.userId === userId &&
      oneTimeDetails.expires > moment().toDate().getTime()
    ) {
      if (selectedHearingId) {
        isOnTime =
          hearingIds.includes(selectedHearingId) &&
          oneTimeDetails.hearingIds.includes(selectedHearingId);
      } else {
        isOnTime = hearingIds.every(id => oneTimeDetails.hearingIds.includes(id));
      }
    }

    localStorage.removeItem(CASE_ACCESS_ONE_TIME_KEY);
    return isOnTime;
  }

  private isOneTimeEnabled(hearingIds: string[] = [], selectedHearingId?: string) {
    return selectedHearingId
      ? hearingIds.includes(selectedHearingId) && !!this.isOneTimeActive[selectedHearingId]
      : hearingIds.every(id => !!this.isOneTimeActive[id]);
  }

  shouldShowModal(
    hearingIds: string[],
    userId: string,
    selectedHearingId?: string,
    checkOneTime = false
  ): boolean {
    if (checkOneTime && this.isOneTimeEnabled(hearingIds, selectedHearingId)) {
      return false;
    }

    // Work around to resolve opening in different tab
    if (checkOneTime) {
      const isOneTimeEnabled = this.checkForOneTimeAccess(hearingIds, userId, selectedHearingId);
      if (isOneTimeEnabled) {
        this.isOneTimeActive = hearingIds.reduce(
          (acc, id) => ({
            ...acc,
            [id]: true
          }),
          this.isOneTimeActive
        );
        return false;
      }
    }

    const details: CaseAccessDetails = this.getSavedDetails();
    if (details && details.userId === userId && details.expires > moment().toDate().getTime()) {
      if (selectedHearingId) {
        return (
          hearingIds.includes(selectedHearingId) && !details.hearingIds.includes(selectedHearingId)
        );
      }

      return !hearingIds.every(id => details.hearingIds.includes(id));
    }

    localStorage.removeItem(CASE_ACCESS_KEY);
    if (selectedHearingId) {
      return hearingIds.includes(selectedHearingId) && !!userId;
    }

    return hearingIds.length > 0 && !!userId;
  }

  showModal({
    hearingIds,
    userId,
    urns,
    selectedHearingId,
    onSubmit,
    onCancel
  }: {
    hearingIds: string[];
    userId: string;
    urns: string[];
    selectedHearingId?: string;
    onSubmit: () => void;
    onCancel?: () => void;
  }) {
    if (this.shouldShowModal(hearingIds, userId, selectedHearingId)) {
      const bsModalRef = this.modalService.show(CaseAccessModalComponent, {
        show: true,
        backdrop: true,
        ignoreBackdropClick: true,
        keyboard: false,
        initialState: {
          urns,
          show: true,
          onCancelAction: () => {
            if (onCancel) {
              onCancel();
            }
            bsModalRef.hide();
          },
          onSubmitAction: (decision: boolean) => {
            if (decision) {
              this.saveDecision(hearingIds, userId, decision, false);
            } else {
              this.saveDecision(hearingIds, userId, decision, true);
            }
            onSubmit();
            bsModalRef.hide();
          }
        }
      });
    } else {
      onSubmit();
    }
  }

  saveDecision(hearingIds: string[], userId: string, decision: boolean, oneTime = false) {
    const details: CaseAccessDetails = this.getSavedDetails();
    let newDetails: CaseAccessDetails;
    if (details) {
      newDetails = {
        ...details,
        hearingIds: Array.from(new Set([...details.hearingIds, ...hearingIds]))
      };
    } else {
      newDetails = {
        userId,
        hearingIds,
        expires: moment().endOf('day').toDate().getTime()
      };
    }

    if (decision) {
      localStorage.removeItem(CASE_ACCESS_ONE_TIME_KEY);
      localStorage.setItem(CASE_ACCESS_KEY, JSON.stringify(newDetails));
    } else if (!decision && oneTime) {
      localStorage.setItem(CASE_ACCESS_ONE_TIME_KEY, JSON.stringify(newDetails));
    }
  }
}
